import type {
	ExerciseData,
	ProgressionResult,
	ProgramType,
	UserEquipmentSettings,
} from "./types";

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
 * Gets base increment for the given equipment type from user settings
 */
function getBaseIncrement(
	equipmentType: ExerciseData["equipment_type"],
	currentWeight: number,
	userSettings: UserEquipmentSettings = DEFAULT_EQUIPMENT_SETTINGS,
): number {
	// Always use 1kg increments for dumbbells 0-10kg
	if (equipmentType === "DUMBBELL" && currentWeight <= 10) {
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
 * Determine maximum percentage increase based on exercise properties to cap increases
 */
function getMaxPercentageIncrease(
	currentWeight: number,
	isCompound: boolean,
	equipmentType: ExerciseData["equipment_type"],
	userSettings: UserEquipmentSettings = DEFAULT_EQUIPMENT_SETTINGS,
): number {
	// Base percentage depends on exercise type and experience level
	let maxPercentage: number;

	// Get experience level from settings
	const experienceLevel = userSettings.experienceLevel || "BEGINNER";

	// Set base percentage based on compound/isolation and experience level
	if (isCompound) {
		switch (experienceLevel) {
			case "BEGINNER":
				maxPercentage = 15;
				break;
			case "INTERMEDIATE":
				maxPercentage = 10;
				break;
			case "ADVANCED":
				maxPercentage = 7.5;
				break;
			default:
				maxPercentage = 15; // Default to beginner if unknown
		}
	} else {
		// Isolation exercises
		switch (experienceLevel) {
			case "BEGINNER":
				maxPercentage = 12.5;
				break;
			case "INTERMEDIATE":
				maxPercentage = 10;
				break;
			case "ADVANCED":
				maxPercentage = 7.5;
				break;
			default:
				maxPercentage = 12.5; // Default to beginner if unknown
		}
	}

	// For lighter weights, allow even higher percentage increases
	if (currentWeight < 10) {
		maxPercentage *= 1.5; // e.g., 22.5% for beginner compounds
	} else if (currentWeight < 20) {
		maxPercentage *= 1.25; // e.g., 18.75% for beginner compounds
	}

	// Special case for very light dumbbell exercises (like lateral raises)
	// These can handle larger percentage increases when the weights are very light
	if (equipmentType === "DUMBBELL" && currentWeight < 5) {
		// Allow up to 25% increases for very light dumbbells (e.g., 2kg to 2.5kg)
		maxPercentage = Math.max(maxPercentage, 25);
	}

	return maxPercentage;
}

/**
 * Apply percentage-based caps to weight increases
 */
function applyPercentageCap(
	currentWeight: number,
	proposedWeight: number,
	isCompound: boolean,
	equipmentType: ExerciseData["equipment_type"],
	userSettings: UserEquipmentSettings = DEFAULT_EQUIPMENT_SETTINGS,
): number {
	// Get max percentage increase for this exercise
	const maxPercent = getMaxPercentageIncrease(
		currentWeight,
		isCompound,
		equipmentType,
		userSettings,
	);

	// Calculate the maximum allowed weight
	const maxAllowedWeight = currentWeight * (1 + maxPercent / 100);

	// Return the smaller of the proposed weight and maximum allowed weight
	return Math.min(proposedWeight, maxAllowedWeight);
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
 * Main function to calculate progression based on exercise data and program type
 */
export function calculateProgression(
	data: ExerciseData,
	programType: ProgramType,
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

	// Calculate weight change based on rating
	const weightChange = getWeightChangeForRating(data.rating, baseIncrement);

	// For strength programs, focus on weight increases
	if (programType === "STRENGTH") {
		const rawNewWeight = Math.max(0, data.weight + weightChange);

		// Apply percentage cap to prevent excessive increases
		const cappedWeight = applyPercentageCap(
			data.weight,
			rawNewWeight,
			data.is_compound,
			data.equipment_type,
			userSettings,
		);

		// Round the weight to the nearest multiple of the increment
		const roundedWeight = roundToIncrementMultiple(
			cappedWeight,
			data.equipment_type,
			userSettings,
		);

		return {
			newWeight: roundedWeight,
			newReps: data.reps,
		};
	}

	// HYPERTROPHY program logic

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

		// Apply percentage-based cap
		const cappedWeight = applyPercentageCap(
			data.weight,
			idealNewWeight,
			data.is_compound,
			data.equipment_type,
			userSettings,
		);

		// Round to the nearest increment for the equipment type
		const roundedWeight = roundToIncrementMultiple(
			cappedWeight,
			data.equipment_type,
			userSettings,
		);

		return {
			newWeight: roundedWeight,
			newReps: CYCLING_TARGET_REPS,
		};
	}

	// For ratings 4 (Hard) and 5 (Too Hard)
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

	// Prepare options for progression
	const rawNewWeight = Math.max(0, data.weight + weightChange);

	// Apply percentage cap to prevent excessive increases
	const cappedWeight = applyPercentageCap(
		data.weight,
		rawNewWeight,
		data.is_compound,
		data.equipment_type,
		userSettings,
	);

	const roundedNewWeight = roundToIncrementMultiple(
		cappedWeight,
		data.equipment_type,
		userSettings,
	);
	const newReps = Math.min(data.reps + 1, MAX_REPS);

	// Calculate current volume
	const currentVolume = calculateVolume(data.sets, data.reps, data.weight);

	// Calculate volumes for different progression options
	const volumeWithWeightIncrease = calculateVolume(
		data.sets,
		data.reps,
		roundedNewWeight,
	);

	const volumeWithRepIncrease = calculateVolume(
		data.sets,
		newReps,
		data.weight,
	);

	// Use per-unit efficiency calculations
	const weightDelta = roundedNewWeight - data.weight;
	const repDelta = newReps - data.reps;

	// Efficiency is volume increase per unit of change (per kg or per rep)
	const weightEfficiency =
		weightDelta > 0
			? (volumeWithWeightIncrease - currentVolume) / weightDelta
			: 0;

	const repEfficiency =
		repDelta > 0 ? (volumeWithRepIncrease - currentVolume) / repDelta : 0;

	// Option objects for cleaner code
	const increaseBoth = {
		newWeight: roundedNewWeight,
		newReps: newReps,
	};

	const increaseWeightOnly = {
		newWeight: roundedNewWeight,
		newReps: data.reps,
	};

	const increaseRepsOnly = {
		newWeight: data.weight,
		newReps: newReps,
	};

	const noChange = {
		newWeight: data.weight,
		newReps: data.reps,
	};

	// For ratings 1-3 with guaranteed different outcomes
	// Final solution that ensures distinct outcomes while respecting percentage caps

	switch (data.rating) {
		case 1: {
			// Very Easy - Weight gain with rep increase fallback
			// For "Very Easy", attempt significant weight increase (2 increments)
			const veryEasyTargetWeight = data.weight + baseIncrement * 2;

			// Apply percentage cap to prevent excessive increases
			const cappedVeryEasyWeight = applyPercentageCap(
				data.weight,
				veryEasyTargetWeight,
				data.is_compound,
				data.equipment_type,
				userSettings,
			);

			// Round to valid equipment increments
			const roundedVeryEasyWeight = roundToIncrementMultiple(
				cappedVeryEasyWeight,
				data.equipment_type,
				userSettings,
			);

			// Check if this results in a meaningful weight increase
			if (roundedVeryEasyWeight > data.weight) {
				// If we got a weight increase, use it
				return {
					newWeight: roundedVeryEasyWeight,
					newReps: data.reps, // Keep reps the same
				};
			}
			// If weight couldn't increase due to caps, increase reps AND weight
			// This ensures Rating 1 is always different from Rating 2 & 3
			const easyTargetWeight = data.weight + baseIncrement;
			const cappedEasyWeight = applyPercentageCap(
				data.weight,
				easyTargetWeight,
				data.is_compound,
				data.equipment_type,
				userSettings,
			);
			const roundedEasyWeight = roundToIncrementMultiple(
				cappedEasyWeight,
				data.equipment_type,
				userSettings,
			);

			return {
				newWeight: roundedEasyWeight,
				newReps: Math.min(data.reps + 1, MAX_REPS),
			};
		}

		case 2: {
			// Easy - Weight increase only
			// For "Easy", add 1 increment of weight
			const easyTargetWeight = data.weight + baseIncrement;

			// Apply percentage cap
			const cappedEasyWeight = applyPercentageCap(
				data.weight,
				easyTargetWeight,
				data.is_compound,
				data.equipment_type,
				userSettings,
			);

			// Round to valid equipment increments
			const roundedEasyWeight = roundToIncrementMultiple(
				cappedEasyWeight,
				data.equipment_type,
				userSettings,
			);

			// Check if this results in a meaningful weight increase
			if (roundedEasyWeight > data.weight) {
				// If we got a weight increase, use it
				return {
					newWeight: roundedEasyWeight,
					newReps: data.reps, // Keep reps the same
				};
			}
			// If weight couldn't increase, keep weight the same
			// This ensures Rating 2 is always different from Rating 3
			return {
				newWeight: data.weight,
				newReps: data.reps, // No change
			};
		}

		case 3: // Moderate - Rep increase only
			// For "Moderate", keep the weight the same but increase reps
			return {
				newWeight: data.weight,
				newReps: Math.min(data.reps + 1, MAX_REPS),
			};

		case 4: // Hard - No change
			return {
				newWeight: data.weight,
				newReps: data.reps,
			};

		case 5: {
			// Too Hard - Decrease weight
			// For "Too Hard", decrease by one increment
			const tooHardWeight = Math.max(0, data.weight - baseIncrement);
			const roundedTooHardWeight = roundToIncrementMultiple(
				tooHardWeight,
				data.equipment_type,
				userSettings,
			);

			return {
				newWeight: roundedTooHardWeight,
				newReps: data.reps,
			};
		}

		default:
			return {
				newWeight: data.weight,
				newReps: data.reps,
			};
	}
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
