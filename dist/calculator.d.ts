interface ExerciseData {
    sets: number;
    reps: number;
    weight: number;
    rating: number;
    equipment_type: "DUMBBELL" | "BARBELL" | "CABLE" | "MACHINE" | "BODYWEIGHT";
    is_compound: boolean;
    exercise_name: string;
}
interface ProgressionResult {
    newWeight: number;
    newReps: number;
    deload?: boolean;
}
interface UserEquipmentSettings {
    barbellIncrement: number;
    dumbbellIncrement: number;
    cableIncrement: number;
    machineIncrement: number;
    experienceLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
}
/**
 * Main function to calculate progression based on exercise data and program type
 */
export declare function calculateProgression(data: ExerciseData, programType: "STRENGTH" | "HYPERTROPHY", userSettings?: UserEquipmentSettings): ProgressionResult;
/**
 * Helper function to round weight to closest available increment
 * Useful for client-side adjustments
 */
export declare function roundToClosestIncrement(weight: number, equipmentType: ExerciseData["equipment_type"], userSettings?: UserEquipmentSettings): number;
export type { ExerciseData, ProgressionResult, UserEquipmentSettings };
