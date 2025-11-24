# Fitness Progression Calculator v2.0 - Complete Refactor Implementation Guide

## Overview
**Goal**: Completely refactor the fitness-progression-calculator npm package to use a simplified, predictable progression system with clear separation between Strength and Hypertrophy programs.
**Why**: Current implementation is overly complex, uses fragile string matching, has unpredictable outcomes, and is difficult to maintain.
**Affected Areas**: Entire npm package
**Estimated Complexity**: Medium

---

## Core Design Principles

1. **Simplicity over cleverness** - Every progression rule should be explainable in one sentence
2. **Predictable outcomes** - Users should be able to anticipate what happens for each rating
3. **All 5 ratings produce unique outcomes** - No two ratings should ever result in the same change (for isolation exercises in hypertrophy)
4. **Exercise IDs only** - Zero string matching, no exceptions
5. **Two distinct program types** - Strength and Hypertrophy have fundamentally different progression logic
6. **Compound movements always progress by weight** - Even in hypertrophy programs, to prevent dangerous volume spikes

---

## Progression Logic Specification

### Constants

```typescript
// Hypertrophy rep bounds (isolation exercises only)
const MIN_REPS = 10;
const MAX_REPS = 16;

// Volume preservation factors for cycling (hypertrophy isolation)
const VOLUME_FACTOR_AGGRESSIVE = 0.85;  // For "Very Easy" and "Easy" cycling
const VOLUME_FACTOR_CONSERVATIVE = 0.95; // For "Moderate" cycling
```

---

### Strength Program

**Principle**: Weight is the only variable. Reps never change automatically.

| Rating | Action | Multiplier |
|--------|--------|------------|
| 1 - Very Easy | weight + (4 × increment) | 4× |
| 2 - Easy | weight + (2 × increment) | 2× |
| 3 - Moderate | weight + (1 × increment) | 1× |
| 4 - Hard | no change | 0× |
| 5 - Too Hard | weight − (2 × increment) | −2× |

```typescript
function calculateStrengthProgression(
  weight: number,
  reps: number,
  rating: number,
  increment: number
): ProgressionResult {
  const multipliers = { 1: 4, 2: 2, 3: 1, 4: 0, 5: -2 };
  const multiplier = multipliers[rating] ?? 0;
  
  return {
    newWeight: Math.max(0, weight + (increment * multiplier)),
    newReps: reps, // Never changes
  };
}
```

---

### Hypertrophy Program

**Principle**: 
- **Compound movements**: Always use weight-only progression (same as Strength) to prevent dangerous volume spikes
- **Isolation movements**: Progress through reps until ceiling, then cycle weight up with volume-preserving rep reduction

#### Compound Movements (is_compound = true)

Uses **identical logic to Strength program**:

| Rating | Action | Multiplier |
|--------|--------|------------|
| 1 - Very Easy | weight + (4 × increment) | 4× |
| 2 - Easy | weight + (2 × increment) | 2× |
| 3 - Moderate | weight + (1 × increment) | 1× |
| 4 - Hard | no change | 0× |
| 5 - Too Hard | weight − (2 × increment) | −2× |

#### Isolation Movements (is_compound = false)

##### When NOT at MAX_REPS (16):

| Rating | Action | Example @ 12 reps, 26kg, 2kg increment |
|--------|--------|----------------------------------------|
| 1 - Very Easy | weight + increment AND reps + 1 | 28kg × 13 |
| 2 - Easy | reps + 2 | 26kg × 14 |
| 3 - Moderate | reps + 1 | 26kg × 13 |
| 4 - Hard | no change | 26kg × 12 |
| 5 - Too Hard | weight − increment | 24kg × 12 |

##### When AT MAX_REPS (16) - Cycling:

| Rating | Weight Change | Volume Factor | Example @ 16 reps, 26kg, 2kg increment |
|--------|---------------|---------------|----------------------------------------|
| 1 - Very Easy | +2× increment | 85% | 30kg × 11 |
| 2 - Easy | +1× increment | 85% | 28kg × 12 |
| 3 - Moderate | +1× increment | 95% | 28kg × 14 |
| 4 - Hard | no change | — | 26kg × 16 |
| 5 - Too Hard | −1× increment | — | 24kg × 16 |

#### Cycling Formula:

```typescript
function calculateCycleReps(
  currentReps: number,
  currentWeight: number,
  newWeight: number,
  volumeFactor: number
): number {
  const targetVolume = currentReps * currentWeight * volumeFactor;
  const calculatedReps = Math.floor(targetVolume / newWeight);
  return Math.max(MIN_REPS, Math.min(MAX_REPS, calculatedReps));
}
```

---

### Bodyweight Exercises (weight = 0)

**Principle**: Only reps can change. No ceiling for now.

| Rating | Action |
|--------|--------|
| 1 - Very Easy | reps + 3 |
| 2 - Easy | reps + 2 |
| 3 - Moderate | reps + 1 |
| 4 - Hard | no change |
| 5 - Too Hard | reps − 2 (min 1) |

**Note**: Same logic for both Strength and Hypertrophy programs when weight = 0.

---

## Type Definitions

### Input Types

```typescript
type EquipmentType = 'BARBELL' | 'DUMBBELL' | 'CABLE' | 'MACHINE' | 'BODYWEIGHT';
type ProgramType = 'STRENGTH' | 'HYPERTROPHY';

interface ExerciseData {
  exerciseId: number;              // Required - no exceptions
  sets: number;
  reps: number;
  weight: number;
  rating: number;                  // 1-5
  equipment_type: EquipmentType;   // Keep snake_case for backend compatibility
  is_compound: boolean;            // Keep snake_case for backend compatibility
}

interface UserEquipmentSettings {
  barbellIncrement: number;   // Default: 2.5
  dumbbellIncrement: number;  // Default: 2.0
  cableIncrement: number;     // Default: 2.5
  machineIncrement: number;   // Default: 5.0
}
```

### Output Types

```typescript
interface ProgressionResult {
  newWeight: number;
  newReps: number;
  suggestion?: ProgressionSuggestion;
}

interface ProgressionSuggestion {
  type: 'ADD_WEIGHT' | 'CHANGE_EXERCISE';
  message: string;
  suggestedExerciseId?: number;
}
```

### Exercise Configuration (for future transitions)

```typescript
interface ExerciseConfig {
  exerciseId: number;
  weightCeiling?: number;              // When to suggest different exercise
  suggestedExerciseId?: number;        // What to suggest
  suggestedExerciseMessage?: string;   // Custom message
}

// Example config (dormant until exercises are added)
const EXERCISE_CONFIGS: Record<number, ExerciseConfig> = {
  // Goblet Squat -> Back Squat transition (example, IDs TBD)
  // [EXERCISE_IDS.GOBLET_SQUAT]: {
  //   exerciseId: EXERCISE_IDS.GOBLET_SQUAT,
  //   weightCeiling: 15,
  //   suggestedExerciseId: EXERCISE_IDS.BACK_SQUAT,
  //   suggestedExerciseMessage: 'Ready for barbell! Consider Back Squat.',
  // },
};
```

---

## Implementation Tasks

### Task 1: Create New Type Definitions
**File**: `src/types.ts`
**Type**: Complete Rewrite

#### Goal
Replace all existing types with clean, simplified type definitions.

#### Requirements
- [ ] Remove `exercise_name` field entirely (replaced by exerciseId)
- [ ] Add `exerciseId: number` as required field in ExerciseData
- [ ] Keep `equipment_type` with snake_case (backend compatibility)
- [ ] Keep `is_compound` with snake_case (backend compatibility)
- [ ] Remove `experienceLevel` from UserEquipmentSettings (not used in MVP)
- [ ] Remove `deload` from ProgressionResult (not used)
- [ ] Add ProgressionSuggestion type for future transitions
- [ ] Add ExerciseConfig type for future transitions

#### Expected Structure
```typescript
export type EquipmentType = 'BARBELL' | 'DUMBBELL' | 'CABLE' | 'MACHINE' | 'BODYWEIGHT';
export type ProgramType = 'STRENGTH' | 'HYPERTROPHY';

export interface ExerciseData {
  exerciseId: number;
  sets: number;
  reps: number;
  weight: number;
  rating: number;
  equipment_type: EquipmentType;
  is_compound: boolean;
}

export interface UserEquipmentSettings {
  barbellIncrement: number;
  dumbbellIncrement: number;
  cableIncrement: number;
  machineIncrement: number;
}

export interface ProgressionResult {
  newWeight: number;
  newReps: number;
  suggestion?: ProgressionSuggestion;
}

export interface ProgressionSuggestion {
  type: 'ADD_WEIGHT' | 'CHANGE_EXERCISE';
  message: string;
  suggestedExerciseId?: number;
}

export interface ExerciseConfig {
  exerciseId: number;
  weightCeiling?: number;
  suggestedExerciseId?: number;
  suggestedExerciseMessage?: string;
}
```

---

### Task 2: Create Constants File
**File**: `src/constants.ts`
**Type**: New File

#### Goal
Centralize all magic numbers and default values.

#### Requirements
- [ ] Define MIN_REPS = 10
- [ ] Define MAX_REPS = 16
- [ ] Define volume factors for cycling
- [ ] Define default equipment settings
- [ ] Define rating multipliers for strength (used by compounds too)
- [ ] Define rep changes for bodyweight
- [ ] Export empty EXERCISE_CONFIGS (placeholder for future)

#### Expected Structure
```typescript
import type { UserEquipmentSettings, ExerciseConfig } from './types';

// Hypertrophy rep bounds (isolation exercises only)
export const MIN_REPS = 10;
export const MAX_REPS = 16;

// Volume preservation factors for cycling
export const VOLUME_FACTOR_AGGRESSIVE = 0.85;
export const VOLUME_FACTOR_CONSERVATIVE = 0.95;

// Default equipment increments (kg)
export const DEFAULT_SETTINGS: UserEquipmentSettings = {
  barbellIncrement: 2.5,
  dumbbellIncrement: 2.0,
  cableIncrement: 2.5,
  machineIncrement: 5.0,
};

// Strength & Compound: weight multipliers by rating
export const STRENGTH_MULTIPLIERS: Record<number, number> = {
  1: 4,   // Very Easy
  2: 2,   // Easy
  3: 1,   // Moderate
  4: 0,   // Hard
  5: -2,  // Too Hard
};

// Bodyweight: rep changes by rating
export const BODYWEIGHT_REP_CHANGES: Record<number, number> = {
  1: 3,   // Very Easy
  2: 2,   // Easy
  3: 1,   // Moderate
  4: 0,   // Hard
  5: -2,  // Too Hard
};

// Exercise configurations (for future transitions)
// Keys are exercise IDs, populated when exercises are finalized
export const EXERCISE_CONFIGS: Record<number, ExerciseConfig> = {
  // Will be populated in ~2 weeks when exercises are added
};
```

---

### Task 3: Create Utility Functions
**File**: `src/utils.ts`
**Type**: New File

#### Goal
Simple helper functions with single responsibilities.

#### Requirements
- [ ] `getIncrement(equipment_type, settings)` - returns appropriate increment
- [ ] `calculateCycleReps(currentReps, currentWeight, newWeight, volumeFactor)` - volume-preserving rep calculation
- [ ] `clampReps(reps)` - enforce MIN_REPS and MAX_REPS bounds
- [ ] `checkExerciseTransition(exerciseId, newWeight)` - check if exercise should suggest transition

#### Expected Structure
```typescript
import type { EquipmentType, UserEquipmentSettings, ProgressionSuggestion } from './types';
import { DEFAULT_SETTINGS, MIN_REPS, MAX_REPS, EXERCISE_CONFIGS } from './constants';

export function getIncrement(
  equipment_type: EquipmentType,
  settings: UserEquipmentSettings = DEFAULT_SETTINGS
): number {
  switch (equipment_type) {
    case 'BARBELL':
      return settings.barbellIncrement ?? DEFAULT_SETTINGS.barbellIncrement;
    case 'DUMBBELL':
    case 'BODYWEIGHT':
      return settings.dumbbellIncrement ?? DEFAULT_SETTINGS.dumbbellIncrement;
    case 'CABLE':
      return settings.cableIncrement ?? DEFAULT_SETTINGS.cableIncrement;
    case 'MACHINE':
      return settings.machineIncrement ?? DEFAULT_SETTINGS.machineIncrement;
    default:
      return 2.5;
  }
}

export function calculateCycleReps(
  currentReps: number,
  currentWeight: number,
  newWeight: number,
  volumeFactor: number
): number {
  if (newWeight <= 0) return currentReps;
  const targetVolume = currentReps * currentWeight * volumeFactor;
  const calculatedReps = Math.floor(targetVolume / newWeight);
  return clampReps(calculatedReps);
}

export function clampReps(reps: number): number {
  return Math.max(MIN_REPS, Math.min(MAX_REPS, reps));
}

export function checkExerciseTransition(
  exerciseId: number,
  newWeight: number
): ProgressionSuggestion | undefined {
  const config = EXERCISE_CONFIGS[exerciseId];
  if (!config) return undefined;
  
  if (config.weightCeiling && newWeight >= config.weightCeiling && config.suggestedExerciseId) {
    return {
      type: 'CHANGE_EXERCISE',
      message: config.suggestedExerciseMessage ?? 'Consider progressing to a more advanced exercise.',
      suggestedExerciseId: config.suggestedExerciseId,
    };
  }
  
  return undefined;
}
```

---

### Task 4: Implement Strength Progression
**File**: `src/progressions/strength.ts`
**Type**: New File

#### Goal
Clean, simple strength progression - weight changes only. Also used by compound movements in hypertrophy.

#### Requirements
- [ ] Weight changes based on rating multiplier
- [ ] Reps NEVER change
- [ ] Handle edge case: weight cannot go below 0
- [ ] Check for exercise transitions

#### Expected Structure
```typescript
import type { ExerciseData, UserEquipmentSettings, ProgressionResult } from '../types';
import { STRENGTH_MULTIPLIERS } from '../constants';
import { getIncrement, checkExerciseTransition } from '../utils';

export function calculateStrengthProgression(
  data: ExerciseData,
  settings: UserEquipmentSettings
): ProgressionResult {
  const increment = getIncrement(data.equipment_type, settings);
  const multiplier = STRENGTH_MULTIPLIERS[data.rating] ?? 0;
  const newWeight = Math.max(0, data.weight + (increment * multiplier));
  
  return {
    newWeight,
    newReps: data.reps, // Never changes in strength
    suggestion: checkExerciseTransition(data.exerciseId, newWeight),
  };
}
```

---

### Task 5: Implement Hypertrophy Progression
**File**: `src/progressions/hypertrophy.ts`
**Type**: New File

#### Goal
- Compound movements: Route to strength progression (weight only)
- Isolation movements: Rep-focused progression with volume-preserving cycling at max reps

#### Requirements
- [ ] Compound movements (is_compound = true) use strength progression
- [ ] Isolation movements (is_compound = false) use rep-based progression
- [ ] All 5 ratings MUST produce unique outcomes for isolation exercises
- [ ] When not at MAX_REPS: primarily increase reps
- [ ] When at MAX_REPS: cycle with volume preservation
- [ ] Rating 1 at MAX_REPS: aggressive cycle (2× increment, 85% volume)
- [ ] Rating 2 at MAX_REPS: standard cycle (1× increment, 85% volume)
- [ ] Rating 3 at MAX_REPS: conservative cycle (1× increment, 95% volume)
- [ ] Rating 4 at MAX_REPS: no change
- [ ] Rating 5 at MAX_REPS: reduce weight, keep reps
- [ ] Check for exercise transitions

#### Expected Structure
```typescript
import type { ExerciseData, UserEquipmentSettings, ProgressionResult } from '../types';
import { MAX_REPS, VOLUME_FACTOR_AGGRESSIVE, VOLUME_FACTOR_CONSERVATIVE } from '../constants';
import { getIncrement, calculateCycleReps, checkExerciseTransition } from '../utils';
import { calculateStrengthProgression } from './strength';

export function calculateHypertrophyProgression(
  data: ExerciseData,
  settings: UserEquipmentSettings
): ProgressionResult {
  // Compound movements always use weight-only progression
  // This prevents dangerous volume spikes on heavy exercises
  if (data.is_compound) {
    return calculateStrengthProgression(data, settings);
  }
  
  // Isolation exercises use rep-based progression
  const increment = getIncrement(data.equipment_type, settings);
  const atMaxReps = data.reps >= MAX_REPS;
  
  let newWeight = data.weight;
  let newReps = data.reps;
  
  if (atMaxReps) {
    // Cycling logic - at rep ceiling
    switch (data.rating) {
      case 1: // Very Easy - aggressive cycle
        newWeight = data.weight + (increment * 2);
        newReps = calculateCycleReps(data.reps, data.weight, newWeight, VOLUME_FACTOR_AGGRESSIVE);
        break;
      case 2: // Easy - standard cycle
        newWeight = data.weight + increment;
        newReps = calculateCycleReps(data.reps, data.weight, newWeight, VOLUME_FACTOR_AGGRESSIVE);
        break;
      case 3: // Moderate - conservative cycle
        newWeight = data.weight + increment;
        newReps = calculateCycleReps(data.reps, data.weight, newWeight, VOLUME_FACTOR_CONSERVATIVE);
        break;
      case 4: // Hard - no change
        break;
      case 5: // Too Hard - reduce weight, keep reps
        newWeight = Math.max(0, data.weight - increment);
        break;
    }
  } else {
    // Standard progression - not at ceiling
    switch (data.rating) {
      case 1: // Very Easy - weight AND reps
        newWeight = data.weight + increment;
        newReps = data.reps + 1;
        break;
      case 2: // Easy - reps + 2
        newReps = Math.min(data.reps + 2, MAX_REPS);
        break;
      case 3: // Moderate - reps + 1
        newReps = Math.min(data.reps + 1, MAX_REPS);
        break;
      case 4: // Hard - no change
        break;
      case 5: // Too Hard - reduce weight
        newWeight = Math.max(0, data.weight - increment);
        break;
    }
  }
  
  return {
    newWeight,
    newReps,
    suggestion: checkExerciseTransition(data.exerciseId, newWeight),
  };
}
```

---

### Task 6: Implement Bodyweight Progression
**File**: `src/progressions/bodyweight.ts`
**Type**: New File

#### Goal
Rep-only progression for exercises with weight = 0.

#### Requirements
- [ ] Only reps change
- [ ] No rep ceiling (infinite scaling for now)
- [ ] Minimum 1 rep
- [ ] Same logic for both Strength and Hypertrophy programs

#### Expected Structure
```typescript
import type { ExerciseData, ProgressionResult } from '../types';
import { BODYWEIGHT_REP_CHANGES } from '../constants';

export function calculateBodyweightProgression(
  data: ExerciseData
): ProgressionResult {
  const repChange = BODYWEIGHT_REP_CHANGES[data.rating] ?? 0;
  const newReps = Math.max(1, data.reps + repChange);
  
  return {
    newWeight: 0,
    newReps,
  };
}
```

---

### Task 7: Create Main Calculator Entry Point
**File**: `src/calculator.ts`
**Type**: Complete Rewrite

#### Goal
Single entry point that routes to appropriate progression function.

#### Requirements
- [ ] Export single `calculateProgression` function
- [ ] Route bodyweight (weight = 0) to bodyweight progression
- [ ] Route STRENGTH to strength progression
- [ ] Route HYPERTROPHY to hypertrophy progression
- [ ] Apply default settings if not provided
- [ ] Validate rating is 1-5

#### Expected Structure
```typescript
import type { ExerciseData, ProgramType, UserEquipmentSettings, ProgressionResult } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { calculateStrengthProgression } from './progressions/strength';
import { calculateHypertrophyProgression } from './progressions/hypertrophy';
import { calculateBodyweightProgression } from './progressions/bodyweight';

export function calculateProgression(
  data: ExerciseData,
  programType: ProgramType,
  settings: UserEquipmentSettings = DEFAULT_SETTINGS
): ProgressionResult {
  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    return { newWeight: data.weight, newReps: data.reps };
  }
  
  // Bodyweight exercises (weight = 0) use rep-only progression
  if (data.weight === 0) {
    return calculateBodyweightProgression(data);
  }
  
  // Route to appropriate progression type
  if (programType === 'STRENGTH') {
    return calculateStrengthProgression(data, settings);
  }
  
  return calculateHypertrophyProgression(data, settings);
}
```

---

### Task 8: Update Package Index
**File**: `src/index.ts`
**Type**: Complete Rewrite

#### Goal
Clean public API export.

#### Requirements
- [ ] Export `calculateProgression` function
- [ ] Export all types
- [ ] Export constants (for consumers who need them)
- [ ] Do NOT export internal utilities or progression functions

#### Expected Structure
```typescript
// Main function
export { calculateProgression } from './calculator';

// Types
export type {
  ExerciseData,
  ProgressionResult,
  ProgressionSuggestion,
  ProgramType,
  EquipmentType,
  UserEquipmentSettings,
  ExerciseConfig,
} from './types';

// Constants (for consumers who need them)
export {
  MIN_REPS,
  MAX_REPS,
  DEFAULT_SETTINGS,
} from './constants';
```

---

### Task 9: Delete Old Files
**File**: Multiple
**Type**: Deletion

#### Goal
Remove all legacy code.

#### Requirements
- [ ] Delete any old .ts files not part of new structure
- [ ] Clean up `dist/` folder (will be regenerated on build)
- [ ] Ensure only the new file structure remains

---

### Task 10: Update Package.json
**File**: `package.json`
**Type**: Modification

#### Goal
Bump version for breaking changes.

#### Requirements
- [ ] Update version to `2.0.0` (breaking changes in API)
- [ ] Verify build script is correct
- [ ] Verify main and types paths are correct

---

## File Structure After Refactor

```
fitness-progression-calculator/
├── src/
│   ├── index.ts              # Public exports
│   ├── calculator.ts         # Main entry point
│   ├── types.ts              # Type definitions
│   ├── constants.ts          # All constants
│   ├── utils.ts              # Helper functions
│   └── progressions/
│       ├── strength.ts       # Strength progression (also used by compounds)
│       ├── hypertrophy.ts    # Hypertrophy progression (routes compounds to strength)
│       └── bodyweight.ts     # Bodyweight progression
├── dist/                     # Compiled output (generated)
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

---

## Testing & Validation

### Unit Test Cases

After implementation, manually verify these scenarios:

**Strength Program:**
```
Input: 100kg × 8 reps, Rating 1 (Very Easy), Barbell, Compound
Expected: 110kg × 8 reps (4 × 2.5 = 10kg increase)

Input: 100kg × 8 reps, Rating 3 (Moderate), Barbell, Compound
Expected: 102.5kg × 8 reps (1 × 2.5 = 2.5kg increase)

Input: 100kg × 8 reps, Rating 5 (Too Hard), Barbell, Compound
Expected: 95kg × 8 reps (-2 × 2.5 = 5kg decrease)
```

**Hypertrophy Program - Compound Movement (uses strength logic):**
```
Input: 80kg × 8 reps, Rating 1 (Very Easy), Barbell, is_compound=true
Expected: 90kg × 8 reps (4 × 2.5 = 10kg increase, reps unchanged)

Input: 90kg × 8 reps, Rating 2 (Easy), Barbell, is_compound=true
Expected: 95kg × 8 reps (2 × 2.5 = 5kg increase, reps unchanged)

Input: 110kg × 12 reps, Rating 3 (Moderate), Barbell, is_compound=true
Expected: 112.5kg × 12 reps (1 × 2.5 = 2.5kg increase, reps unchanged)
```

**Hypertrophy Program - Isolation Movement (not at max):**
```
Input: 26kg × 12 reps, Rating 1 (Very Easy), Dumbbell, is_compound=false
Expected: 28kg × 13 reps (weight + increment, reps + 1)

Input: 26kg × 12 reps, Rating 2 (Easy), Dumbbell, is_compound=false
Expected: 26kg × 14 reps (reps + 2)

Input: 26kg × 12 reps, Rating 3 (Moderate), Dumbbell, is_compound=false
Expected: 26kg × 13 reps (reps + 1)
```

**Hypertrophy Program - Isolation Movement (at max reps):**
```
Input: 26kg × 16 reps, Rating 2 (Easy), Dumbbell, is_compound=false
Expected: 28kg × 12 reps (cycle with 85% volume)
Check: 16 × 26 × 0.85 / 28 = 12.6 → 12 ✓

Input: 26kg × 16 reps, Rating 3 (Moderate), Dumbbell, is_compound=false
Expected: 28kg × 14 reps (cycle with 95% volume)
Check: 16 × 26 × 0.95 / 28 = 14.1 → 14 ✓
```

**Bodyweight:**
```
Input: 0kg × 8 reps, Rating 1 (Very Easy), Bodyweight
Expected: 0kg × 11 reps (reps + 3)

Input: 0kg × 8 reps, Rating 5 (Too Hard), Bodyweight
Expected: 0kg × 6 reps (reps - 2)
```

**Verify unique outcomes (Hypertrophy Isolation @ 12 reps, 26kg):**
```
Rating 1: 28kg × 13 ✓
Rating 2: 26kg × 14 ✓
Rating 3: 26kg × 13 ✓
Rating 4: 26kg × 12 ✓
Rating 5: 24kg × 12 ✓
All different ✓
```

---

## Breaking Changes for Consumers

The following changes will require updates in Myo backend and mobile:

1. **ExerciseData field changes:**
   - Removed: `exercise_name` (string)
   - Added: `exerciseId` (number) - REQUIRED
   - Kept: `equipment_type` (snake_case, unchanged)
   - Kept: `is_compound` (snake_case, unchanged)

2. **UserEquipmentSettings changes:**
   - Removed: `experienceLevel`

3. **ProgressionResult changes:**
   - Removed: `deload` (optional field, was unused)
   - Added: `suggestion` (optional, for future transitions)

4. **Function signature unchanged:**
   - `calculateProgression(data, programType, settings)` - same signature

---

## Post-Implementation: Update Myo

After the npm package is updated and published, the following files in Myo will need updates:

**Backend:**
- `src/services/workoutService.ts` - Change `exercise_name: exercise.name` to `exerciseId: exercise.id`

**Mobile:**
- `src/utils/hooks/useProgressionCalculator.js` - Update field mapping
- `src/components/ExerciseRatingDialog.jsx` - Update field mapping

This will be a separate task after the npm package is published.

---

## Success Validation

**This implementation is complete when:**

1. [ ] All old files deleted, new structure in place
2. [ ] `npm run build` succeeds with no TypeScript errors
3. [ ] All test cases above pass manual verification
4. [ ] Package version is 2.0.0
5. [ ] No string-based exercise identification anywhere
6. [ ] All 5 ratings produce unique outcomes for hypertrophy isolation exercises
7. [ ] Compound movements in hypertrophy use weight-only progression
8. [ ] Code is under 250 total lines (excluding types)