import type { ExerciseData, ProgressionResult, ProgramType, UserEquipmentSettings } from "./types";
import { roundToClosestIncrement } from "./calculator";
export declare function calculateProgression(data: ExerciseData, programType: ProgramType, userSettings?: UserEquipmentSettings): ProgressionResult;
export type { ExerciseData, ProgressionResult, ProgramType, UserEquipmentSettings, };
export { roundToClosestIncrement };
