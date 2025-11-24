"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProgression = calculateProgression;
const constants_1 = require("./constants");
const strength_1 = require("./progressions/strength");
const hypertrophy_1 = require("./progressions/hypertrophy");
const bodyweight_1 = require("./progressions/bodyweight");
function calculateProgression(data, programType, settings = constants_1.DEFAULT_SETTINGS) {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
        return { newWeight: data.weight, newReps: data.reps };
    }
    // Bodyweight exercises (weight = 0) use rep-only progression
    if (data.weight === 0) {
        return (0, bodyweight_1.calculateBodyweightProgression)(data);
    }
    // Route to appropriate progression type
    if (programType === 'STRENGTH') {
        return (0, strength_1.calculateStrengthProgression)(data, settings);
    }
    return (0, hypertrophy_1.calculateHypertrophyProgression)(data, settings);
}
