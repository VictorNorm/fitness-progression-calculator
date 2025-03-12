"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundToClosestIncrement = void 0;
exports.calculateProgression = calculateProgression;
const calculator_1 = require("./calculator");
Object.defineProperty(exports, "roundToClosestIncrement", { enumerable: true, get: function () { return calculator_1.roundToClosestIncrement; } });
// Re-export the main function
function calculateProgression(data, programType, userSettings) {
    return (0, calculator_1.calculateProgression)(data, programType, userSettings);
}
