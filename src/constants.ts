import type { UserEquipmentSettings, ExerciseConfig } from './types';

// Hypertrophy rep bounds (isolation exercises only)
export const MIN_REPS = 10;
export const MAX_REPS = 16;

// Volume preservation factors for cycling
export const VOLUME_FACTOR_AGGRESSIVE = 0.85;
export const VOLUME_FACTOR_CONSERVATIVE = 0.95;

// Default equipment increments (kg)
export const DEFAULT_SETTINGS: UserEquipmentSettings = {
  barbellIncrement: 2.5,
  dumbbellIncrement: 2.0,
  cableIncrement: 2.5,
  machineIncrement: 5.0,
};

// Strength & Compound: weight multipliers by rating
export const STRENGTH_MULTIPLIERS: Record<number, number> = {
  1: 4,   // Very Easy
  2: 2,   // Easy
  3: 1,   // Moderate
  4: 0,   // Hard
  5: -2,  // Too Hard
};

// Bodyweight: rep changes by rating
export const BODYWEIGHT_REP_CHANGES: Record<number, number> = {
  1: 3,   // Very Easy
  2: 2,   // Easy
  3: 1,   // Moderate
  4: 0,   // Hard
  5: -2,  // Too Hard
};

// Exercise configurations (for future transitions)
// Keys are exercise IDs, populated when exercises are finalized
export const EXERCISE_CONFIGS: Record<number, ExerciseConfig> = {
  // Will be populated in ~2 weeks when exercises are added
};