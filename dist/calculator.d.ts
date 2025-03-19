import type { ExerciseData, ProgressionResult, ProgramType, UserEquipmentSettings } from "./types";
/**
 * Main function to calculate progression based on exercise data and program type
 */
export declare function calculateProgression(data: ExerciseData, programType: ProgramType, userSettings?: UserEquipmentSettings): ProgressionResult;
/**
 * Helper function to round weight to closest available increment
 * Useful for client-side adjustments
 */
export declare function roundToClosestIncrement(weight: number, equipmentType: ExerciseData["equipment_type"], userSettings?: UserEquipmentSettings): number;
