import type {
	ExerciseData,
	ProgressionResult,
	ProgramType,
	UserEquipmentSettings,
} from "./types";
import {
	calculateProgression as rawCalculateProgression,
	roundToClosestIncrement,
} from "./calculator";

// Re-export the main function
export function calculateProgression(
	data: ExerciseData,
	programType: ProgramType,
	userSettings?: UserEquipmentSettings,
): ProgressionResult {
	return rawCalculateProgression(data, programType, userSettings);
}

// Export types and helper functions
export type {
	ExerciseData,
	ProgressionResult,
	ProgramType,
	UserEquipmentSettings,
};
export { roundToClosestIncrement };
