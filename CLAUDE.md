# Fitness Progression Calculator - Developer Guide

## Build Commands
- `npm run build`: Compiles TypeScript to JavaScript
- `npm run prepare`: Runs build before package publish

## Code Style Guidelines

### TypeScript & Types
- Use strict typing with TypeScript
- Export interfaces and types from types.ts
- Use descriptive type/interface names in PascalCase
- Prefer explicit types over 'any'

### Naming Conventions
- Interfaces/Types: PascalCase (ExerciseData, ProgressionResult)
- Constants: UPPER_SNAKE_CASE (MAX_REPS)
- Functions/variables: camelCase (calculateProgression)
- File names: camelCase.ts (calculator.ts)

### Code Organization
- Pure functions with clear purpose
- JSDoc comments for exported functions
- Functions should handle their own error cases
- Use 2-space indentation
- Import order: types first, then functions

### Architecture
- Keep calculator.ts for core calculation logic
- Expose all types and utilities through index.ts
- Avoid side effects in calculation functions