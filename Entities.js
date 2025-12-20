// Initial game state with all entities
import Matter from 'matter-js';
import {
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    GRAVITY,
    COLLISION_CATEGORIES,
    COLLISION_MASKS,
    ENTITY_TYPES,
    PLAYER_MAX_HP,
    ZOMBIE_MAX_HP,
} from './Constants';

// Create the Matter.js physics engine
const engine = Matter.Engine.create({
    enableSleeping: false,
    gravity: {
        x: 0,
        y: GRAVITY,
    },
});

const world = engine.world;

// Player entity
const playerSize = 40;
const player = Matter.Bodies.rectangle(100, SCREEN_HEIGHT - 200, playerSize, playerSize, {
    isStatic: false,
    label: ENTITY_TYPES.PLAYER,
    friction: 0.01,
    frictionAir: 0.01,
    restitution: 0,
    collisionFilter: {
        category: COLLISION_CATEGORIES.PLAYER,
        mask: COLLISION_MASKS.PLAYER,
    },
});

// Player state data (not part of Matter.js body)
player.gameData = {
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    isInvulnerable: false,
    canDoubleJump: false,
    isGrounded: false,
    lastGroundedTime: 0,
    jumpBufferTime: 0,
    facingRight: true,
    attackHitbox: null,
    dodgeEndTime: 0,
};

Matter.World.add(world, player);

// Floor
const floorHeight = 50;
const floor = Matter.Bodies.rectangle(
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT - floorHeight / 2,
    SCREEN_WIDTH,
    floorHeight,
    {
        isStatic: true,
        label: ENTITY_TYPES.FLOOR,
        collisionFilter: {
            category: COLLISION_CATEGORIES.ENVIRONMENT,
            mask: COLLISION_MASKS.ENVIRONMENT,
        },
    }
);

Matter.World.add(world, floor);

// Walls (left and right boundaries)
const wallThickness = 20;
const leftWall = Matter.Bodies.rectangle(
    -wallThickness / 2,
    SCREEN_HEIGHT / 2,
    wallThickness,
    SCREEN_HEIGHT,
    {
        isStatic: true,
        label: ENTITY_TYPES.WALL,
        collisionFilter: {
            category: COLLISION_CATEGORIES.ENVIRONMENT,
            mask: COLLISION_MASKS.ENVIRONMENT,
        },
    }
);

const rightWall = Matter.Bodies.rectangle(
    SCREEN_WIDTH + wallThickness / 2,
    SCREEN_HEIGHT / 2,
    wallThickness,
    SCREEN_HEIGHT,
    {
        isStatic: true,
        label: ENTITY_TYPES.WALL,
        collisionFilter: {
            category: COLLISION_CATEGORIES.ENVIRONMENT,
            mask: COLLISION_MASKS.ENVIRONMENT,
        },
    }
);

Matter.World.add(world, [leftWall, rightWall]);

// Platforms
const platform1 = Matter.Bodies.rectangle(200, SCREEN_HEIGHT - 300, 150, 20, {
    isStatic: true,
    label: ENTITY_TYPES.FLOOR,
    collisionFilter: {
        category: COLLISION_CATEGORIES.ENVIRONMENT,
        mask: COLLISION_MASKS.ENVIRONMENT,
    },
});

const platform2 = Matter.Bodies.rectangle(320, SCREEN_HEIGHT - 450, 120, 20, {
    isStatic: true,
    label: ENTITY_TYPES.FLOOR,
    collisionFilter: {
        category: COLLISION_CATEGORIES.ENVIRONMENT,
        mask: COLLISION_MASKS.ENVIRONMENT,
    },
});

Matter.World.add(world, [platform1, platform2]);

// Zombie enemies
const createZombie = (x, y, patrolLeft, patrolRight) => {
    const zombieSize = 35;
    const zombie = Matter.Bodies.rectangle(x, y, zombieSize, zombieSize, {
        isStatic: false,
        label: ENTITY_TYPES.ZOMBIE,
        friction: 0.01,
        frictionAir: 0.05,
        restitution: 0,
        collisionFilter: {
            category: COLLISION_CATEGORIES.ENEMY,
            mask: COLLISION_MASKS.ENEMY,
        },
    });

    zombie.gameData = {
        hp: ZOMBIE_MAX_HP,
        maxHp: ZOMBIE_MAX_HP,
        state: 'PATROL', // PATROL, AGGRO, ATTACK
        patrolLeft,
        patrolRight,
        patrolDirection: 1, // 1 for right, -1 for left
        lastAttackTime: 0,
    };

    return zombie;
};

const zombie1 = createZombie(250, SCREEN_HEIGHT - 150, 200, 300);
const zombie2 = createZombie(320, SCREEN_HEIGHT - 500, 280, 360);

Matter.World.add(world, [zombie1, zombie2]);

// Prison Door (win condition)
const doorSize = { width: 50, height: 80 };
const door = Matter.Bodies.rectangle(
    SCREEN_WIDTH - 100,
    SCREEN_HEIGHT - floorHeight - doorSize.height / 2,
    doorSize.width,
    doorSize.height,
    {
        isStatic: true,
        label: ENTITY_TYPES.DOOR,
        isSensor: true,
    }
);

door.gameData = {
    isUnlocked: false,
};

Matter.World.add(world, door);

// Input state (managed in App.js)
const inputState = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    roll: false,
};

// Game state
const gameState = {
    isPaused: false,
    isGameOver: false,
    isVictory: false,
    hitStopEndTime: 0,
};

// Export entities for GameEngine
export default (world) => {
    return {
        physics: { engine, world: engine.world },
        player: { body: player, size: playerSize, renderer: 'Player' },
        floor: { body: floor, renderer: 'Floor' },
        leftWall: { body: leftWall, renderer: 'Wall' },
        rightWall: { body: rightWall, renderer: 'Wall' },
        platform1: { body: platform1, renderer: 'Platform' },
        platform2: { body: platform2, renderer: 'Platform' },
        zombie1: { body: zombie1, size: 35, renderer: 'Zombie' },
        zombie2: { body: zombie2, size: 35, renderer: 'Zombie' },
        door: { body: door, size: doorSize, renderer: 'Door' },
        inputState,
        gameState,
    };
};
