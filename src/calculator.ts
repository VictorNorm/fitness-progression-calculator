import type { ExerciseData, ProgramType, UserEquipmentSettings, ProgressionResult } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { calculateStrengthProgression } from './progressions/strength';
import { calculateHypertrophyProgression } from './progressions/hypertrophy';
import { calculateBodyweightProgression } from './progressions/bodyweight';

export function calculateProgression(
  data: ExerciseData,
  programType: ProgramType,
  settings: UserEquipmentSettings = DEFAULT_SETTINGS
): ProgressionResult {
  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    return { newWeight: data.weight, newReps: data.reps };
  }
  
  // Bodyweight exercises (weight = 0) use rep-only progression
  if (data.weight === 0) {
    return calculateBodyweightProgression(data);
  }
  
  // Route to appropriate progression type
  if (programType === 'STRENGTH') {
    return calculateStrengthProgression(data, settings);
  }
  
  return calculateHypertrophyProgression(data, settings);
}