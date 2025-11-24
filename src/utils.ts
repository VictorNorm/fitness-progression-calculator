import type { EquipmentType, UserEquipmentSettings, ProgressionSuggestion } from './types';
import { DEFAULT_SETTINGS, MIN_REPS, MAX_REPS, EXERCISE_CONFIGS } from './constants';

export function getIncrement(
  equipment_type: EquipmentType,
  settings: UserEquipmentSettings = DEFAULT_SETTINGS
): number {
  switch (equipment_type) {
    case 'BARBELL':
      return settings.barbellIncrement ?? DEFAULT_SETTINGS.barbellIncrement;
    case 'DUMBBELL':
    case 'BODYWEIGHT':
      return settings.dumbbellIncrement ?? DEFAULT_SETTINGS.dumbbellIncrement;
    case 'CABLE':
      return settings.cableIncrement ?? DEFAULT_SETTINGS.cableIncrement;
    case 'MACHINE':
      return settings.machineIncrement ?? DEFAULT_SETTINGS.machineIncrement;
    default:
      return 2.5;
  }
}

export function calculateCycleReps(
  currentReps: number,
  currentWeight: number,
  newWeight: number,
  volumeFactor: number
): number {
  if (newWeight <= 0) return currentReps;
  const targetVolume = currentReps * currentWeight * volumeFactor;
  const calculatedReps = Math.floor(targetVolume / newWeight);
  return clampReps(calculatedReps);
}

export function clampReps(reps: number): number {
  return Math.max(MIN_REPS, Math.min(MAX_REPS, reps));
}

export function checkExerciseTransition(
  exerciseId: number,
  newWeight: number
): ProgressionSuggestion | undefined {
  const config = EXERCISE_CONFIGS[exerciseId];
  if (!config) return undefined;
  
  if (config.weightCeiling && newWeight >= config.weightCeiling && config.suggestedExerciseId) {
    return {
      type: 'CHANGE_EXERCISE',
      message: config.suggestedExerciseMessage ?? 'Consider progressing to a more advanced exercise.',
      suggestedExerciseId: config.suggestedExerciseId,
    };
  }
  
  return undefined;
}