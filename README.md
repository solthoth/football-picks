# frontend-react-template

A React 19 + TypeScript + Vite starter template with linting, type-checking,
unit tests, Conventional Commits enforcement, and CI wired up out of the box.

## Prerequisites

- [Node.js](https://nodejs.org/) 24+
- [pnpm](https://pnpm.io/) (this repo pins it via the `packageManager` field —
  run `corepack enable pnpm` if you don't have it)

## Getting started

```bash
pnpm install
# install git hooks (commit-msg + pre-commit) — requires the pre-commit tool
# (https://pre-commit.com): `brew install pre-commit` or `pipx install pre-commit`
pre-commit install --hook-type pre-commit --hook-type commit-msg
pnpm dev
```

## Commands

| Command           | What it does                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `pnpm dev`        | Start the Vite dev server with HMR.                                 |
| `pnpm build`      | Type-check (`tsc -b`) and build the production bundle to `dist/`.   |
| `pnpm preview`    | Serve the built `dist/` locally to verify the production output.    |
| `pnpm lint`       | Run ESLint across the repo.                                         |
| `pnpm typecheck`  | Type-check only (`tsc -b`), no build output.                        |
| `pnpm test`       | Run the Vitest unit suite once.                                     |
| `pnpm test:watch` | Run Vitest in watch mode.                                           |

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
and are validated by commitlint via a git hook. The same `lint`, `build`, and
`test` commands run in CI on every push and pull request.

## About the Vite template

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
