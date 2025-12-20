import React, { useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import setupEntities from './Entities';
import {
    PhysicsSystem,
    PlayerControlSystem,
    ZombieAISystem,
    DamageSystem,
    WinConditionSystem,
} from './Systems';
import { COLORS, ENTITY_TYPES } from './Constants';

const { width, height } = Dimensions.get('window');

// Custom renderers for each entity type
const Player = ({ body, size }) => {
    const x = body.position.x - size / 2;
    const y = body.position.y - size / 2;
    const hp = body.gameData.hp;
    const maxHp = body.gameData.maxHp;

    return (
        <View
            style={[
                styles.player,
                {
                    left: x,
                    top: y,
                    width: size,
                    height: size,
                    opacity: body.gameData.isInvulnerable ? 0.5 : 1,
                },
            ]}>
            {/* Health bar */}
            <View style={styles.healthBarContainer}>
                <View style={[styles.healthBar, { width: `${(hp / maxHp) * 100}%` }]} />
            </View>
        </View>
    );
};

const Zombie = ({ body, size }) => {
    const x = body.position.x - size / 2;
    const y = body.position.y - size / 2;
    const hp = body.gameData.hp;
    const maxHp = body.gameData.maxHp;

    return (
        <View
            style={[
                styles.zombie,
                {
                    left: x,
                    top: y,
                    width: size,
                    height: size,
                },
            ]}>
            {/* Health bar */}
            <View style={styles.healthBarContainer}>
                <View style={[styles.healthBar, { width: `${(hp / maxHp) * 100}%` }]} />
            </View>
            {/* State indicator */}
            <Text style={styles.stateText}>{body.gameData.state[0]}</Text>
        </View>
    );
};

const Floor = ({ body }) => {
    const width = body.bounds.max.x - body.bounds.min.x;
    const height = body.bounds.max.y - body.bounds.min.y;
    const x = body.position.x - width / 2;
    const y = body.position.y - height / 2;

    return (
        <View
            style={[
                styles.floor,
                {
                    left: x,
                    top: y,
                    width,
                    height,
                },
            ]}
        />
    );
};

const Platform = ({ body }) => {
    const width = body.bounds.max.x - body.bounds.min.x;
    const height = body.bounds.max.y - body.bounds.min.y;
    const x = body.position.x - width / 2;
    const y = body.position.y - height / 2;

    return (
        <View
            style={[
                styles.platform,
                {
                    left: x,
                    top: y,
                    width,
                    height,
                },
            ]}
        />
    );
};

const Wall = ({ body }) => {
    const width = body.bounds.max.x - body.bounds.min.x;
    const height = body.bounds.max.y - body.bounds.min.y;
    const x = body.position.x - width / 2;
    const y = body.position.y - height / 2;

    return (
        <View
            style={[
                styles.wall,
                {
                    left: x,
                    top: y,
                    width,
                    height,
                },
            ]}
        />
    );
};

const Door = ({ body, size }) => {
    const x = body.position.x - size.width / 2;
    const y = body.position.y - size.height / 2;
    const isUnlocked = body.gameData.isUnlocked;

    return (
        <View
            style={[
                styles.door,
                {
                    left: x,
                    top: y,
                    width: size.width,
                    height: size.height,
                    backgroundColor: isUnlocked ? COLORS.DOOR_UNLOCKED : COLORS.DOOR_LOCKED,
                },
            ]}>
            <Text style={styles.doorText}>{isUnlocked ? '🎉' : '🔒'}</Text>
        </View>
    );
};

export default function App() {
    const gameEngine = useRef(null);
    const entities = setupEntities();

    const handleInput = (type, value) => {
        if (entities.inputState) {
            entities.inputState[type] = value;
        }
    };

    const resetGame = () => {
        if (gameEngine.current) {
            gameEngine.current.swap(setupEntities());
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <GameEngine
                ref={gameEngine}
                style={styles.gameContainer}
                systems={[
                    PhysicsSystem,
                    PlayerControlSystem,
                    ZombieAISystem,
                    DamageSystem,
                    WinConditionSystem,
                ]}
                entities={entities}
                renderer={{
                    Player,
                    Zombie,
                    Floor,
                    Platform,
                    Wall,
                    Door,
                }}>

                {/* Game Over Overlay */}
                {entities.gameState.isGameOver && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayTitle}>GAME OVER</Text>
                        <Text style={styles.overlaySubtitle}>You were defeated!</Text>
                        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Victory Overlay */}
                {entities.gameState.isVictory && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayTitle}>VICTORY!</Text>
                        <Text style={styles.overlaySubtitle}>You defeated all enemies!</Text>
                        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                            <Text style={styles.buttonText}>Play Again</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* HUD - Player HP */}
                <View style={styles.hud}>
                    <Text style={styles.hudText}>
                        HP: {Math.max(0, entities.player.body.gameData.hp)} / {entities.player.body.gameData.maxHp}
                    </Text>
                </View>
            </GameEngine>

            {/* On-screen controls */}
            <View style={styles.controls}>
                {/* Left side - Movement */}
                <View style={styles.leftControls}>
                    <TouchableOpacity
                        style={styles.arrowButton}
                        onPressIn={() => handleInput('left', true)}
                        onPressOut={() => handleInput('left', false)}>
                        <Text style={styles.arrowText}>←</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.arrowButton}
                        onPressIn={() => handleInput('right', true)}
                        onPressOut={() => handleInput('right', false)}>
                        <Text style={styles.arrowText}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Right side - Actions */}
                <View style={styles.rightControls}>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.jumpButton]}
                            onPressIn={() => handleInput('jump', true)}
                            onPressOut={() => handleInput('jump', false)}>
                            <Text style={styles.buttonLabel}>JUMP</Text>
                            <Text style={styles.buttonKey}>A</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.attackButton]}
                            onPressIn={() => handleInput('attack', true)}
                            onPressOut={() => handleInput('attack', false)}>
                            <Text style={styles.buttonLabel}>ATTACK</Text>
                            <Text style={styles.buttonKey}>B</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rollButton]}
                            onPressIn={() => handleInput('roll', true)}
                            onPressOut={() => handleInput('roll', false)}>
                            <Text style={styles.buttonLabel}>ROLL</Text>
                            <Text style={styles.buttonKey}>C</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    gameContainer: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    player: {
        position: 'absolute',
        backgroundColor: COLORS.PLAYER,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#00CC00',
    },
    zombie: {
        position: 'absolute',
        backgroundColor: COLORS.ENEMY,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#CC0000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    floor: {
        position: 'absolute',
        backgroundColor: COLORS.ENVIRONMENT,
        borderTopWidth: 2,
        borderTopColor: '#A0A0A0',
    },
    platform: {
        position: 'absolute',
        backgroundColor: COLORS.ENVIRONMENT,
        borderTopWidth: 2,
        borderTopColor: '#A0A0A0',
    },
    wall: {
        position: 'absolute',
        backgroundColor: COLORS.ENVIRONMENT,
    },
    door: {
        position: 'absolute',
        borderRadius: 4,
        borderWidth: 3,
        borderColor: '#654321',
        justifyContent: 'center',
        alignItems: 'center',
    },
    doorText: {
        fontSize: 32,
    },
    healthBarContainer: {
        position: 'absolute',
        top: -8,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
    },
    healthBar: {
        height: '100%',
        backgroundColor: '#00FF00',
        borderRadius: 2,
    },
    stateText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    hud: {
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: 8,
    },
    hudText: {
        color: COLORS.UI_TEXT,
        fontSize: 16,
        fontWeight: 'bold',
    },
    controls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    leftControls: {
        flexDirection: 'row',
        gap: 10,
    },
    rightControls: {
        gap: 10,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    arrowButton: {
        width: 70,
        height: 70,
        backgroundColor: COLORS.UI_BUTTON,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#3A7BC8',
    },
    arrowText: {
        fontSize: 32,
        color: COLORS.UI_TEXT,
        fontWeight: 'bold',
    },
    actionButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
    },
    jumpButton: {
        backgroundColor: '#FFD700',
        borderColor: '#CC9900',
    },
    attackButton: {
        backgroundColor: '#FF4444',
        borderColor: '#CC0000',
    },
    rollButton: {
        backgroundColor: '#44FF44',
        borderColor: '#00CC00',
    },
    buttonLabel: {
        fontSize: 9,
        color: '#FFF',
        fontWeight: 'bold',
    },
    buttonKey: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: 'bold',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 180,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTitle: {
        fontSize: 48,
        color: COLORS.UI_TEXT,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    overlaySubtitle: {
        fontSize: 20,
        color: COLORS.UI_TEXT,
        marginBottom: 40,
    },
    resetButton: {
        backgroundColor: COLORS.UI_BUTTON,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#3A7BC8',
    },
    buttonText: {
        color: COLORS.UI_TEXT,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
