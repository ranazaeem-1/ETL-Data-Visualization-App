# DataWeave Project Rules

## Code Style
- Use **TypeScript** for all files
- Use **functional components** with hooks
- Prefer **named exports** over default exports for components
- Use **single quotes** for strings
- Max line length: **100 characters**

## Component Structure
- Place reusable components in `src/components/`
- Place business logic/utilities in `src/lib/`
- Use `'use client'` directive for client-side components

## State Management
- Use **Zustand** for global state (`src/lib/store.ts`)
- Use local state (`useState`) for UI-only state
- Memoize expensive computations with `useMemo`

## Styling
- Use **Tailwind CSS** classes
- Prefer dark theme (glassmorphism + gradients)
- Keep accessibility in mind (contrast ratios)

## Data Processing
- All CSV parsing happens client-side via **PapaParse**
- Analysis and transformations use utility functions in `src/lib/data-engine.ts`
- Visualization logic in `src/lib/vis-engine.ts`

## Testing
- Run `npm run build` before committing to catch TypeScript errors
- Test with sample CSVs of varying sizes

## Git Commits
- Use semantic commit messages: `feat:`, `fix:`, `docs:`, `refactor:`
