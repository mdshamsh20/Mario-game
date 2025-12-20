// Game constants and collision categories for Matter.js
import Matter from 'matter-js';

// Screen dimensions (adjust based on device)
export const SCREEN_WIDTH = 375;
export const SCREEN_HEIGHT = 812;

// Physics constants
export const GRAVITY = 0.8;
export const PLAYER_SPEED = 5;
export const JUMP_FORCE = 0.12;
export const DODGE_IMPULSE = 12;
export const DODGE_DURATION = 300; // ms
export const HIT_STOP_DURATION = 50; // ms
export const ATTACK_DURATION = 150; // ms
export const COYOTE_TIME = 100; // ms
export const JUMP_BUFFER_TIME = 50; // ms

// AI constants
export const ZOMBIE_SPEED = 2;
export const AGGRO_DISTANCE = 200;
export const ATTACK_DISTANCE = 40;
export const LUNGE_SPEED = 8;

// Health constants
export const PLAYER_MAX_HP = 100;
export const ZOMBIE_MAX_HP = 30;
export const PLAYER_DAMAGE = 20;
export const ZOMBIE_DAMAGE = 10;

// Collision categories using Matter.js Body.nextCategory()
export const COLLISION_CATEGORIES = {
  PLAYER: 0x0001,
  PLAYER_ATTACK: 0x0002,
  ENEMY: 0x0004,
  ENVIRONMENT: 0x0008,
};

// Collision masks - define what each category collides with
export const COLLISION_MASKS = {
  PLAYER: COLLISION_CATEGORIES.ENVIRONMENT | COLLISION_CATEGORIES.ENEMY,
  PLAYER_ATTACK: COLLISION_CATEGORIES.ENEMY,
  ENEMY: COLLISION_CATEGORIES.ENVIRONMENT | COLLISION_CATEGORIES.PLAYER_ATTACK,
  ENVIRONMENT: COLLISION_CATEGORIES.PLAYER | COLLISION_CATEGORIES.ENEMY,
};

// Colors for rendering
export const COLORS = {
  PLAYER: '#00FF00',
  ENEMY: '#FF0000',
  DOOR_LOCKED: '#8B4513',
  DOOR_UNLOCKED: '#FFD700',
  ENVIRONMENT: '#808080',
  BACKGROUND: '#1a1a2e',
  UI_BUTTON: '#4A90E2',
  UI_TEXT: '#FFFFFF',
};

// Entity types
export const ENTITY_TYPES = {
  PLAYER: 'PLAYER',
  ZOMBIE: 'ZOMBIE',
  FLOOR: 'FLOOR',
  WALL: 'WALL',
  DOOR: 'DOOR',
  PLAYER_HITBOX: 'PLAYER_HITBOX',
};
