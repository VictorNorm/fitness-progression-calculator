"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProgression = calculateProgression;
exports.roundToClosestIncrement = roundToClosestIncrement;
const MAX_REPS = 20;
const BODYWEIGHT_MAX_REPS = 15; // Before considering adding weight
const SPECIAL_BODYWEIGHT_EXERCISES = [
    "PULL UP",
    "CHIN UP",
    "DIP",
    "PUSH UP",
    "PUSH UP DEFICIT",
];
const DEFAULT_EQUIPMENT_SETTINGS = {
    barbellIncrement: 2.5,
    dumbbellIncrement: 2.0,
    cableIncrement: 2.5,
    machineIncrement: 5.0,
    experienceLevel: "BEGINNER",
};
// Constants
const STARTING_HYPERTROPHY_REPS = 10; // Rep count to cycle back to after reaching MAX_REPS
// Helper functions
function isSpecialBodyweightExercise(exerciseName) {
    return SPECIAL_BODYWEIGHT_EXERCISES.includes(exerciseName.toUpperCase());
}
/**
 * Gets base increment for the given equipment type from user settings
 */
function getBaseIncrement(equipmentType, userSettings = DEFAULT_EQUIPMENT_SETTINGS) {
    switch (equipmentType) {
        case "BARBELL":
            return (userSettings.barbellIncrement ||
                DEFAULT_EQUIPMENT_SETTINGS.barbellIncrement);
        case "DUMBBELL":
            return (userSettings.dumbbellIncrement ||
                DEFAULT_EQUIPMENT_SETTINGS.dumbbellIncrement);
        case "CABLE":
            return (userSettings.cableIncrement || DEFAULT_EQUIPMENT_SETTINGS.cableIncrement);
        case "MACHINE":
            return (userSettings.machineIncrement ||
                DEFAULT_EQUIPMENT_SETTINGS.machineIncrement);
        case "BODYWEIGHT":
            return (userSettings.dumbbellIncrement ||
                DEFAULT_EQUIPMENT_SETTINGS.dumbbellIncrement);
        default:
            return 2.5; // Default fallback
    }
}
/**
 * Calculate the total volume for a given exercise configuration
 */
function calculateVolume(sets, reps, weight) {
    return sets * reps * weight;
}
/**
 * Handle bodyweight exercises specially
 */
function handleBodyweightExercise(data) {
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
function getWeightChangeForRating(rating, baseIncrement) {
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
function calculateProgression(data, programType, userSettings = DEFAULT_EQUIPMENT_SETTINGS) {
    console.log(`Calculate progression for ${data.exercise_name}:`, {
        currentWeight: data.weight,
        currentReps: data.reps,
        rating: data.rating,
        equipmentType: data.equipment_type,
        programType,
    });
    // Special handling for bodyweight exercises
    if (data.equipment_type === "BODYWEIGHT" &&
        isSpecialBodyweightExercise(data.exercise_name)) {
        return handleBodyweightExercise(data);
    }
    // Get the base increment for this equipment type
    const baseIncrement = getBaseIncrement(data.equipment_type, userSettings);
    console.log(`Using ${data.equipment_type} increment: ${baseIncrement}kg`);
    // Calculate weight change based on rating
    const weightChange = getWeightChangeForRating(data.rating, baseIncrement);
    // For strength programs, focus on weight increases
    if (programType === "STRENGTH") {
        return {
            newWeight: Math.max(0, data.weight + weightChange),
            newReps: data.reps,
        };
    }
    // HYPERTROPHY program logic
    // For ratings 4 (Hard) and 5 (Too Hard), no rep increase, only potential weight decrease
    if (data.rating >= 4) {
        return {
            newWeight: Math.max(0, data.weight + weightChange),
            newReps: data.reps,
        };
    }
    // If we've reached max reps, cycle back to starting reps with increased weight
    if (data.reps >= MAX_REPS) {
        // Calculate how much weight to increase to maintain volume
        // Current volume: sets * maxReps * currentWeight
        // New volume: sets * startingReps * newWeight
        // So, newWeight = currentWeight * (maxReps / startingReps)
        // Ensure the weight increases by at least the rating-based increment
        const volumeBasedIncrement = data.weight * (MAX_REPS / STARTING_HYPERTROPHY_REPS) - data.weight;
        const actualIncrement = Math.max(weightChange, volumeBasedIncrement);
        return {
            newWeight: Math.max(0, data.weight + actualIncrement),
            newReps: STARTING_HYPERTROPHY_REPS,
        };
    }
    // For ratings 1-3 with non-maxed reps, compare volume increases
    // Option 1: Increase weight
    const newWeight = Math.max(0, data.weight + weightChange);
    const volumeWithWeightIncrease = calculateVolume(data.sets, data.reps, newWeight);
    // Option 2: Increase reps
    const newReps = data.reps + 1;
    const volumeWithRepIncrease = calculateVolume(data.sets, newReps, data.weight);
    // Calculate volume change for each option
    const currentVolume = calculateVolume(data.sets, data.reps, data.weight);
    const volumeChangeWithWeight = volumeWithWeightIncrease - currentVolume;
    const volumeChangeWithReps = volumeWithRepIncrease - currentVolume;
    console.log("Volume comparison:", {
        currentVolume,
        volumeWithWeightIncrease,
        volumeWithRepIncrease,
        volumeChangeWithWeight,
        volumeChangeWithReps,
    });
    // For very easy (rating 1), always increase both weight and reps if compound
    if (data.rating === 1 && data.is_compound) {
        return {
            newWeight: newWeight,
            newReps: Math.min(newReps, MAX_REPS),
        };
    }
    // For other cases, choose the option with the smaller volume increase
    // This helps make sure progression is steady and not too aggressive
    if (volumeChangeWithWeight <= volumeChangeWithReps) {
        return {
            newWeight: newWeight,
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
function roundToClosestIncrement(weight, equipmentType, userSettings = DEFAULT_EQUIPMENT_SETTINGS) {
    const baseIncrement = getBaseIncrement(equipmentType, userSettings);
    // Round to nearest multiple of baseIncrement
    return Math.round(weight / baseIncrement) * baseIncrement;
}
