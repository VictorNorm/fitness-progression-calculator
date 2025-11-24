export type EquipmentType = 'BARBELL' | 'DUMBBELL' | 'CABLE' | 'MACHINE' | 'BODYWEIGHT';
export type ProgramType = 'STRENGTH' | 'HYPERTROPHY';

export interface ExerciseData {
  exerciseId: number;
  sets: number;
  reps: number;
  weight: number;
  rating: number;
  equipment_type: EquipmentType;
  is_compound: boolean;
}

export interface UserEquipmentSettings {
  barbellIncrement: number;
  dumbbellIncrement: number;
  cableIncrement: number;
  machineIncrement: number;
}

export interface ProgressionResult {
  newWeight: number;
  newReps: number;
  suggestion?: ProgressionSuggestion;
}

export interface ProgressionSuggestion {
  type: 'ADD_WEIGHT' | 'CHANGE_EXERCISE';
  message: string;
  suggestedExerciseId?: number;
}

export interface ExerciseConfig {
  exerciseId: number;
  weightCeiling?: number;
  suggestedExerciseId?: number;
  suggestedExerciseMessage?: string;
}
