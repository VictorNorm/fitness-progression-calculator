import type { ExerciseData, UserEquipmentSettings, ProgressionResult } from '../types';
import { STRENGTH_MULTIPLIERS } from '../constants';
import { getIncrement, checkExerciseTransition } from '../utils';

export function calculateStrengthProgression(
  data: ExerciseData,
  settings: UserEquipmentSettings
): ProgressionResult {
  const increment = getIncrement(data.equipment_type, settings);
  const multiplier = STRENGTH_MULTIPLIERS[data.rating] ?? 0;
  const newWeight = Math.max(0, data.weight + (increment * multiplier));
  
  return {
    newWeight,
    newReps: data.reps, // Never changes in strength
    suggestion: checkExerciseTransition(data.exerciseId, newWeight),
  };
}