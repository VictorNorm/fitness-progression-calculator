"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = exports.MAX_REPS = exports.MIN_REPS = exports.calculateProgression = void 0;
// Main function
var calculator_1 = require("./calculator");
Object.defineProperty(exports, "calculateProgression", { enumerable: true, get: function () { return calculator_1.calculateProgression; } });
// Constants (for consumers who need them)
var constants_1 = require("./constants");
Object.defineProperty(exports, "MIN_REPS", { enumerable: true, get: function () { return constants_1.MIN_REPS; } });
Object.defineProperty(exports, "MAX_REPS", { enumerable: true, get: function () { return constants_1.MAX_REPS; } });
Object.defineProperty(exports, "DEFAULT_SETTINGS", { enumerable: true, get: function () { return constants_1.DEFAULT_SETTINGS; } });
