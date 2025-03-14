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

const MAX_REPS = 20;
const BODYWEIGHT_MAX_REPS = 15; // Before considering adding weight
const SPECIAL_BODYWEIGHT_EXERCISES = [
	"PULL UP",
	"CHIN UP",
	"DIP",
	"PUSH UP",
	"PUSH UP DEFICIT",
];

const DEFAULT_EQUIPMENT_SETTINGS: UserEquipmentSettings = {
	barbellIncrement: 2.5,
	dumbbellIncrement: 2.0,
	cableIncrement: 2.5,
	machineIncrement: 5.0,
	experienceLevel: "BEGINNER",
};

// Constants
const CYCLING_TARGET_REPS = 15; // New target reps when cycling down from MAX_REPS
const LIGHT_DUMBBELL_MAX = 10; // Maximum weight for light dumbbells
const LIGHT_DUMBBELL_INCREMENT = 1.0; // Increment for light dumbbells

// Helper functions
function isSpecialBodyweightExercise(exerciseName: string): boolean {
	return SPECIAL_BODYWEIGHT_EXERCISES.includes(exerciseName.toUpperCase());
}

/**
 * Gets base increment for the given equipment type from user settings
 */
function getBaseIncrement(
	equipmentType: ExerciseData["equipment_type"],
	currentWeight: number,
	userSettings: UserEquipmentSettings = DEFAULT_EQUIPMENT_SETTINGS,
): number {
	// Special case for light dumbbells
	if (equipmentType === "DUMBBELL" && currentWeight < LIGHT_DUMBBELL_MAX) {
		return LIGHT_DUMBBELL_INCREMENT;
	}

	switch (equipmentType) {
		case "BARBELL":
			return (
				userSettings.barbellIncrement ||
				DEFAULT_EQUIPMENT_SETTINGS.barbellIncrement
			);
		case "DUMBBELL":
			return (
				userSettings.dumbbellIncrement ||
				DEFAULT_EQUIPMENT_SETTINGS.dumbbellIncrement
			);
		case "CABLE":
			return (
				userSettings.cableIncrement || DEFAULT_EQUIPMENT_SETTINGS.cableIncrement
			);
		case "MACHINE":
			return (
				userSettings.machineIncrement ||
				DEFAULT_EQUIPMENT_SETTINGS.machineIncrement
			);
		case "BODYWEIGHT":
			return (
				userSettings.dumbbellIncrement ||
				DEFAULT_EQUIPMENT_SETTINGS.dumbbellIncrement
			);
		default:
			return 2.5; // Default fallback
	}
}

/**
 * Rounds a weight to the nearest multiple of the increment
 */
function roundToIncrementMultiple(
	weight: number,
	equipmentType: ExerciseData["equipment_type"],
	userSettings: UserEquipmentSettings = DEFAULT_EQUIPMENT_SETTINGS,
): number {
	const increment = getBaseIncrement(equipmentType, weight, userSettings);
	return Math.round(weight / increment) * increment;
}

/**
 * Calculate the total volume for a given exercise configuration
 */
function calculateVolume(sets: number, reps: number, weight: number): number {
	return sets * reps * weight;
}

/**
 * Handle bodyweight exercises specially
 */
function handleBodyweightExercise(data: ExerciseData): ProgressionResult {
	switch (data.rating) {
		case 1: // Very easy
			return {
				newWeight: data.weight,
				newReps: Math.min(data.reps + 2, MAX_REPS),
			};
		case 2: // Easy
		case 3: // Moderate
			return {
				newWeight: data.weight,
				newReps: Math.min(data.reps + 1, MAX_REPS),
			};
		case 4: // Hard
			return {
				newWeight: data.weight,
				newReps: data.reps,
			};
		case 5: // Too hard
			return {
				newWeight: data.weight,
				newReps: Math.max(1, data.reps - 2),
			};
		default:
			return {
				newWeight: data.weight,
				newReps: data.reps,
			};
	}
}

/**
 * Calculate weight change based on rating
 */
function getWeightChangeForRating(
	rating: number,
	baseIncrement: number,
): number {
	switch (rating) {
		case 1: // Very easy
			return baseIncrement * 3;
		case 2: // Easy
			return baseIncrement * 2;
		case 3: // Moderate
			return baseIncrement;
		case 4: // Hard
			return 0;
		case 5: // Too hard
			return -baseIncrement;
		default:
			return 0;
	}
}

/**
 * Main function to calculate progression based on exercise data and program type
 */
export function calculateProgression(
	data: ExerciseData,
	programType: "STRENGTH" | "HYPERTROPHY",
	userSettings: UserEquipmentSettings = DEFAULT_EQUIPMENT_SETTINGS,
): ProgressionResult {
	console.log(`Calculate progression for ${data.exercise_name}:`, {
		currentWeight: data.weight,
		currentReps: data.reps,
		rating: data.rating,
		equipmentType: data.equipment_type,
		programType,
	});

	// Special handling for bodyweight exercises
	if (
		data.equipment_type === "BODYWEIGHT" &&
		isSpecialBodyweightExercise(data.exercise_name)
	) {
		return handleBodyweightExercise(data);
	}

	// Get the base increment for this equipment type
	const baseIncrement = getBaseIncrement(
		data.equipment_type,
		data.weight,
		userSettings,
	);
	// console.log(`Using ${data.equipment_type} increment: ${baseIncrement}kg`);

	// Calculate weight change based on rating
	const weightChange = getWeightChangeForRating(data.rating, baseIncrement);

	// For strength programs, focus on weight increases
	if (programType === "STRENGTH") {
		const rawNewWeight = Math.max(0, data.weight + weightChange);
		// Round the weight to the nearest multiple of the increment
		const roundedWeight = roundToIncrementMultiple(
			rawNewWeight,
			data.equipment_type,
			userSettings,
		);
		return {
			newWeight: roundedWeight,
			newReps: data.reps,
		};
	}

	// HYPERTROPHY program logic

	// For ratings 4 (Hard) and 5 (Too Hard), no rep increase, only potential weight decrease
	if (data.rating >= 4) {
		const rawNewWeight = Math.max(0, data.weight + weightChange);
		const roundedWeight = roundToIncrementMultiple(
			rawNewWeight,
			data.equipment_type,
			userSettings,
		);
		return {
			newWeight: roundedWeight,
			newReps: data.reps,
		};
	}

	// If we've reached max reps, cycle back to target reps with increased weight
	if (data.reps >= MAX_REPS) {
		// Use a more conservative approach to weight increases when cycling reps
		// The heavier the weight, the more conservative we become

		// Base volume ratio (would be 20/15 = 1.33 if we maintained exact volume)
		// Instead, we use a slightly reduced ratio to be more conservative
		let volumeRatio: number;

		// Adjust conservativeness based on weight range
		if (data.weight >= 100) {
			// For heavy weights (100kg+), be very conservative (25% increase instead of 33%)
			volumeRatio = 1.25;
		} else if (data.weight >= 50) {
			// For medium weights (50-100kg), be moderately conservative (28% increase)
			volumeRatio = 1.28;
		} else if (data.weight >= 20) {
			// For lighter weights (20-50kg), be slightly conservative (30% increase)
			volumeRatio = 1.3;
		} else {
			// For very light weights (<20kg), standard ratio is usually safe
			volumeRatio = 1.33;
		}

		// For advanced users, be even more conservative
		if (userSettings.experienceLevel === "ADVANCED") {
			volumeRatio *= 0.95; // Reduce by 5% for advanced users
		}

		// Calculate ideal new weight with adjusted ratio
		const idealNewWeight = data.weight * volumeRatio;

		// Round to the nearest increment for the equipment type
		const roundedWeight = roundToIncrementMultiple(
			idealNewWeight,
			data.equipment_type,
			userSettings,
		);

		// Log the details of the rep cycling calculation
		// console.log("Rep cycling calculation:", {
		// 	oldReps: data.reps,
		// 	newReps: CYCLING_TARGET_REPS,
		// 	oldWeight: data.weight,
		// 	adjustedVolumeRatio: volumeRatio,
		// 	idealNewWeight,
		// 	roundedWeight,
		// 	oldVolume: data.sets * data.reps * data.weight,
		// 	newVolume: data.sets * CYCLING_TARGET_REPS * roundedWeight,
		// 	experienceLevel: userSettings.experienceLevel,
		// });

		return {
			newWeight: roundedWeight,
			newReps: CYCLING_TARGET_REPS,
		};
	}

	// For ratings 1-3 with non-maxed reps, compare volume increases

	// Option 1: Increase weight
	const rawNewWeight = Math.max(0, data.weight + weightChange);
	const roundedNewWeight = roundToIncrementMultiple(
		rawNewWeight,
		data.equipment_type,
		userSettings,
	);
	const volumeWithWeightIncrease = calculateVolume(
		data.sets,
		data.reps,
		roundedNewWeight,
	);

	// Option 2: Increase reps
	const newReps = data.reps + 1;
	const volumeWithRepIncrease = calculateVolume(
		data.sets,
		newReps,
		data.weight,
	);

	// Calculate volume change for each option
	const currentVolume = calculateVolume(data.sets, data.reps, data.weight);
	const volumeChangeWithWeight = volumeWithWeightIncrease - currentVolume;
	const volumeChangeWithReps = volumeWithRepIncrease - currentVolume;

	// console.log("Volume comparison:", {
	// 	currentVolume,
	// 	volumeWithWeightIncrease,
	// 	volumeWithRepIncrease,
	// 	volumeChangeWithWeight,
	// 	volumeChangeWithReps,
	// });

	// For very easy (rating 1), always increase both weight and reps if compound
	if (data.rating === 1 && data.is_compound) {
		return {
			newWeight: roundedNewWeight,
			newReps: Math.min(newReps, MAX_REPS),
		};
	}

	// For other cases, choose the option with the smaller volume increase
	// This helps make sure progression is steady and not too aggressive
	if (volumeChangeWithWeight <= volumeChangeWithReps) {
		return {
			newWeight: roundedNewWeight,
			newReps: data.reps,
		};
	}
	return {
		newWeight: data.weight,
		newReps: newReps,
	};
}

/**
 * Helper function to round weight to closest available increment
 * Useful for client-side adjustments
 */
export function roundToClosestIncrement(
	weight: number,
	equipmentType: ExerciseData["equipment_type"],
	userSettings: UserEquipmentSettings = DEFAULT_EQUIPMENT_SETTINGS,
): number {
	return roundToIncrementMultiple(weight, equipmentType, userSettings);
}

export type { ExerciseData, ProgressionResult, UserEquipmentSettings };
