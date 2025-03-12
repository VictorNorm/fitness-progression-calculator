export interface UserEquipmentSettings {
    barbellIncrement: number;
    dumbbellIncrement: number;
    cableIncrement: number;
    machineIncrement: number;
    experienceLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
}
export interface ExerciseData {
    sets: number;
    reps: number;
    weight: number;
    rating: number;
    equipment_type: "DUMBBELL" | "BARBELL" | "CABLE" | "MACHINE" | "BODYWEIGHT";
    is_compound: boolean;
    exercise_name: string;
}
export interface ProgressionResult {
    newWeight: number;
    newReps: number;
    deload?: boolean;
}
export type ProgramType = "STRENGTH" | "HYPERTROPHY";
