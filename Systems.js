// Game systems that run every frame
import Matter from 'matter-js';
import {
    PLAYER_SPEED,
    JUMP_FORCE,
    DODGE_IMPULSE,
    DODGE_DURATION,
    HIT_STOP_DURATION,
    ATTACK_DURATION,
    COYOTE_TIME,
    JUMP_BUFFER_TIME,
    ZOMBIE_SPEED,
    AGGRO_DISTANCE,
    ATTACK_DISTANCE,
    LUNGE_SPEED,
    PLAYER_DAMAGE,
    ZOMBIE_DAMAGE,
    COLLISION_CATEGORIES,
    COLLISION_MASKS,
    ENTITY_TYPES,
} from './Constants';

// Physics System - updates Matter.js engine
export const PhysicsSystem = (entities, { time }) => {
    const { physics, gameState } = entities;

    // Check for hit-stop
    if (gameState.hitStopEndTime > time.current) {
        return entities; // Pause physics during hit-stop
    }

    // Update physics engine
    Matter.Engine.update(physics.engine, time.delta);

    return entities;
};

// Player Control System
export const PlayerControlSystem = (entities, { time }) => {
    const { player, inputState, gameState } = entities;

    if (gameState.isPaused || gameState.isGameOver) {
        return entities;
    }

    const playerBody = player.body;
    const playerData = playerBody.gameData;
    const currentTime = time.current;

    // Check if player is grounded
    const isGrounded = Math.abs(playerBody.velocity.y) < 0.5;

    if (isGrounded) {
        playerData.lastGroundedTime = currentTime;
        playerData.canDoubleJump = true;
    }

    playerData.isGrounded = isGrounded;

    // Coyote time - can jump shortly after leaving ground
    const canCoyoteJump = (currentTime - playerData.lastGroundedTime) < COYOTE_TIME;

    // Handle dodge roll
    if (playerData.dodgeEndTime > currentTime) {
        playerData.isInvulnerable = true;
        // Modify collision filter to ignore enemies during dodge
        playerBody.collisionFilter.mask = COLLISION_CATEGORIES.ENVIRONMENT;
    } else {
        playerData.isInvulnerable = false;
        playerBody.collisionFilter.mask = COLLISION_MASKS.PLAYER;
    }

    // Horizontal movement
    let targetVelocityX = 0;

    if (inputState.left) {
        targetVelocityX = -PLAYER_SPEED;
        playerData.facingRight = false;
    }
    if (inputState.right) {
        targetVelocityX = PLAYER_SPEED;
        playerData.facingRight = true;
    }

    // Apply horizontal velocity with friction
    const currentVelocityX = playerBody.velocity.x;
    const newVelocityX = currentVelocityX * 0.8 + targetVelocityX * 0.2; // Smooth lerp

    Matter.Body.setVelocity(playerBody, {
        x: Math.max(-PLAYER_SPEED, Math.min(PLAYER_SPEED, newVelocityX)),
        y: playerBody.velocity.y,
    });

    // Jump buffering - remember jump input
    if (inputState.jump && !inputState.jumpHandled) {
        playerData.jumpBufferTime = currentTime;
        inputState.jumpHandled = true;
    }

    if (!inputState.jump) {
        inputState.jumpHandled = false;
    }

    // Check if buffered jump should be executed
    const hasJumpBuffer = (currentTime - playerData.jumpBufferTime) < JUMP_BUFFER_TIME;

    // Jump logic
    if (hasJumpBuffer) {
        if (isGrounded || canCoyoteJump) {
            // First jump
            Matter.Body.applyForce(playerBody, playerBody.position, {
                x: 0,
                y: -JUMP_FORCE,
            });
            playerData.jumpBufferTime = 0; // Clear buffer
            playerData.canDoubleJump = true;
        } else if (playerData.canDoubleJump) {
            // Double jump
            Matter.Body.setVelocity(playerBody, {
                x: playerBody.velocity.x,
                y: 0,
            });
            Matter.Body.applyForce(playerBody, playerBody.position, {
                x: 0,
                y: -JUMP_FORCE,
            });
            playerData.jumpBufferTime = 0; // Clear buffer
            playerData.canDoubleJump = false;
        }
    }

    // Dodge roll
    if (inputState.roll && !inputState.rollHandled && playerData.dodgeEndTime <= currentTime) {
        const dodgeDirection = playerData.facingRight ? 1 : -1;
        Matter.Body.applyForce(playerBody, playerBody.position, {
            x: DODGE_IMPULSE * dodgeDirection * 0.01,
            y: 0,
        });
        playerData.dodgeEndTime = currentTime + DODGE_DURATION;
        inputState.rollHandled = true;
    }

    if (!inputState.roll) {
        inputState.rollHandled = false;
    }

    // Attack
    if (inputState.attack && !inputState.attackHandled) {
        // Create attack hitbox
        const hitboxWidth = 30;
        const hitboxHeight = 40;
        const offsetX = playerData.facingRight ? player.size / 2 + hitboxWidth / 2 : -(player.size / 2 + hitboxWidth / 2);

        const hitbox = Matter.Bodies.rectangle(
            playerBody.position.x + offsetX,
            playerBody.position.y,
            hitboxWidth,
            hitboxHeight,
            {
                isSensor: true,
                label: ENTITY_TYPES.PLAYER_HITBOX,
                collisionFilter: {
                    category: COLLISION_CATEGORIES.PLAYER_ATTACK,
                    mask: COLLISION_MASKS.PLAYER_ATTACK,
                },
            }
        );

        hitbox.gameData = {
            damage: PLAYER_DAMAGE,
            createdTime: currentTime,
            duration: ATTACK_DURATION,
        };

        Matter.World.add(physics.world, hitbox);

        // Store hitbox reference
        playerData.attackHitbox = hitbox;

        inputState.attackHandled = true;
    }

    if (!inputState.attack) {
        inputState.attackHandled = false;
    }

    // Remove attack hitbox after duration
    if (playerData.attackHitbox) {
        const hitbox = playerData.attackHitbox;
        if (hitbox.gameData && currentTime - hitbox.gameData.createdTime > hitbox.gameData.duration) {
            Matter.World.remove(physics.world, hitbox);
            playerData.attackHitbox = null;
        }
    }

    return entities;
};

// Zombie AI System
export const ZombieAISystem = (entities, { time }) => {
    const { player, physics, gameState } = entities;

    if (gameState.isPaused || gameState.isGameOver) {
        return entities;
    }

    const playerBody = player.body;

    // Find all zombie entities
    Object.keys(entities).forEach(key => {
        const entity = entities[key];
        if (entity.body && entity.body.label === ENTITY_TYPES.ZOMBIE) {
            const zombieBody = entity.body;
            const zombieData = zombieBody.gameData;

            const distance = Math.abs(zombieBody.position.x - playerBody.position.x);
            const direction = playerBody.position.x > zombieBody.position.x ? 1 : -1;

            // State machine
            if (distance < ATTACK_DISTANCE) {
                // Attack state
                zombieData.state = 'ATTACK';

                // Lunge attack (apply once per cooldown)
                if (time.current - zombieData.lastAttackTime > 1000) {
                    Matter.Body.applyForce(zombieBody, zombieBody.position, {
                        x: LUNGE_SPEED * direction * 0.01,
                        y: 0,
                    });
                    zombieData.lastAttackTime = time.current;
                }
            } else if (distance < AGGRO_DISTANCE) {
                // Aggro state - chase player
                zombieData.state = 'AGGRO';

                Matter.Body.setVelocity(zombieBody, {
                    x: ZOMBIE_SPEED * direction,
                    y: zombieBody.velocity.y,
                });
            } else {
                // Patrol state
                zombieData.state = 'PATROL';

                // Patrol between waypoints
                if (zombieBody.position.x <= zombieData.patrolLeft) {
                    zombieData.patrolDirection = 1;
                } else if (zombieBody.position.x >= zombieData.patrolRight) {
                    zombieData.patrolDirection = -1;
                }

                Matter.Body.setVelocity(zombieBody, {
                    x: ZOMBIE_SPEED * zombieData.patrolDirection,
                    y: zombieBody.velocity.y,
                });
            }
        }
    });

    return entities;
};

// Damage System - handle collisions and damage
export const DamageSystem = (entities, { time }) => {
    const { physics, player, gameState } = entities;

    if (gameState.isPaused || gameState.isGameOver) {
        return entities;
    }

    const pairs = Matter.Detector.collisions(
        Matter.Detector.create(),
        physics.engine.world.bodies
    );

    const toRemove = [];

    pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;

        // Player hitbox hits enemy
        if (
            (bodyA.label === ENTITY_TYPES.PLAYER_HITBOX && bodyB.label === ENTITY_TYPES.ZOMBIE) ||
            (bodyB.label === ENTITY_TYPES.PLAYER_HITBOX && bodyA.label === ENTITY_TYPES.ZOMBIE)
        ) {
            const hitbox = bodyA.label === ENTITY_TYPES.PLAYER_HITBOX ? bodyA : bodyB;
            const enemy = bodyA.label === ENTITY_TYPES.ZOMBIE ? bodyA : bodyB;

            if (hitbox.gameData && !hitbox.gameData.hasHit) {
                enemy.gameData.hp -= hitbox.gameData.damage;
                hitbox.gameData.hasHit = true; // Prevent multiple hits

                // Hit-stop effect
                gameState.hitStopEndTime = time.current + HIT_STOP_DURATION;

                // Remove enemy if dead
                if (enemy.gameData.hp <= 0) {
                    toRemove.push(enemy);
                }
            }
        }

        // Enemy hits player
        if (
            (bodyA.label === ENTITY_TYPES.ZOMBIE && bodyB.label === ENTITY_TYPES.PLAYER) ||
            (bodyB.label === ENTITY_TYPES.ZOMBIE && bodyA.label === ENTITY_TYPES.PLAYER)
        ) {
            const playerBody = player.body;
            const playerData = playerBody.gameData;

            if (!playerData.isInvulnerable && !playerData.lastHitTime) {
                playerData.hp -= ZOMBIE_DAMAGE;
                playerData.lastHitTime = time.current;

                // Hit-stop effect
                gameState.hitStopEndTime = time.current + HIT_STOP_DURATION;

                // I-frames for player (500ms)
                setTimeout(() => {
                    playerData.lastHitTime = null;
                }, 500);

                // Check game over
                if (playerData.hp <= 0) {
                    gameState.isGameOver = true;
                }
            }
        }
    });

    // Remove dead enemies
    toRemove.forEach(body => {
        Matter.World.remove(physics.world, body);

        // Remove from entities
        Object.keys(entities).forEach(key => {
            if (entities[key].body === body) {
                delete entities[key];
            }
        });
    });

    return entities;
};

// Win Condition System
export const WinConditionSystem = (entities) => {
    const { door, gameState } = entities;

    if (gameState.isPaused || gameState.isGameOver) {
        return entities;
    }

    // Check if all zombies are defeated
    const zombiesRemaining = Object.keys(entities).some(key => {
        const entity = entities[key];
        return entity.body && entity.body.label === ENTITY_TYPES.ZOMBIE;
    });

    if (!zombiesRemaining && !door.body.gameData.isUnlocked) {
        door.body.gameData.isUnlocked = true;
        gameState.isVictory = true;
    }

    return entities;
};
