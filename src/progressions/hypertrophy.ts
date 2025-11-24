import type { ExerciseData, UserEquipmentSettings, ProgressionResult } from '../types';
import { MAX_REPS, VOLUME_FACTOR_AGGRESSIVE, VOLUME_FACTOR_CONSERVATIVE } from '../constants';
import { getIncrement, calculateCycleReps, checkExerciseTransition } from '../utils';
import { calculateStrengthProgression } from './strength';

export function calculateHypertrophyProgression(
  data: ExerciseData,
  settings: UserEquipmentSettings
): ProgressionResult {
  // Compound movements always use weight-only progression
  // This prevents dangerous volume spikes on heavy exercises
  if (data.is_compound) {
    return calculateStrengthProgression(data, settings);
  }
  
  // Isolation exercises use rep-based progression
  const increment = getIncrement(data.equipment_type, settings);
  const atMaxReps = data.reps >= MAX_REPS;
  
  let newWeight = data.weight;
  let newReps = data.reps;
  
  if (atMaxReps) {
    // Cycling logic - at rep ceiling
    switch (data.rating) {
      case 1: // Very Easy - aggressive cycle
        newWeight = data.weight + (increment * 2);
        newReps = calculateCycleReps(data.reps, data.weight, newWeight, VOLUME_FACTOR_AGGRESSIVE);
        break;
      case 2: // Easy - standard cycle
        newWeight = data.weight + increment;
        newReps = calculateCycleReps(data.reps, data.weight, newWeight, VOLUME_FACTOR_AGGRESSIVE);
        break;
      case 3: // Moderate - conservative cycle
        newWeight = data.weight + increment;
        newReps = calculateCycleReps(data.reps, data.weight, newWeight, VOLUME_FACTOR_CONSERVATIVE);
        break;
      case 4: // Hard - no change
        break;
      case 5: // Too Hard - reduce weight, keep reps
        newWeight = Math.max(0, data.weight - increment);
        break;
    }
  } else {
    // Standard progression - not at ceiling
    switch (data.rating) {
      case 1: // Very Easy - weight AND reps
        newWeight = data.weight + increment;
        newReps = data.reps + 1;
        break;
      case 2: // Easy - reps + 2
        newReps = Math.min(data.reps + 2, MAX_REPS);
        break;
      case 3: // Moderate - reps + 1
        newReps = Math.min(data.reps + 1, MAX_REPS);
        break;
      case 4: // Hard - no change
        break;
      case 5: // Too Hard - reduce weight
        newWeight = Math.max(0, data.weight - increment);
        break;
    }
  }
  
  return {
    newWeight,
    newReps,
    suggestion: checkExerciseTransition(data.exerciseId, newWeight),
  };
}