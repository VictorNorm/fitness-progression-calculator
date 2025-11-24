import type { ExerciseData, ProgressionResult } from '../types';
import { BODYWEIGHT_REP_CHANGES } from '../constants';

export function calculateBodyweightProgression(
  data: ExerciseData
): ProgressionResult {
  const repChange = BODYWEIGHT_REP_CHANGES[data.rating] ?? 0;
  const newReps = Math.max(1, data.reps + repChange);
  
  return {
    newWeight: 0,
    newReps,
  };
}