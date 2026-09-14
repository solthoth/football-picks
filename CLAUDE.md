# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Vite + React 19 + TypeScript, scaffolded from `create-vite`'s `react-ts` template. Package manager is **pnpm** (managed via Corepack — `corepack enable pnpm` if missing).

## Commands

- `pnpm dev` — start the Vite dev server with HMR.
- `pnpm build` — type-check the project (`tsc -b`) and produce a production bundle in `dist/`. The `tsc -b` step is gating: type errors fail the build.
- `pnpm lint` — run ESLint across the repo using the flat-config in `eslint.config.js`.
- `pnpm typecheck` — `tsc -b` only (the type-check half of `build`).
- `pnpm test` — run the Vitest unit suite once. `pnpm test:watch` for watch mode.
- `pnpm preview` — serve the built `dist/` locally to sanity-check the production output.

These scripts are the single source of truth: the local pre-commit hooks and the CI workflow both invoke them, so a green commit and a green CI run can't disagree. Change behavior by editing the script in `package.json`, not by duplicating flags in a hook or workflow.

## Testing

Vitest with the jsdom environment and Testing Library. Config lives in `vite.config.ts` under the `test` key (`globals: true`, `setupFiles: ['./src/setupTests.ts']`); `src/setupTests.ts` registers `@testing-library/jest-dom` matchers. Co-locate tests as `*.test.ts(x)` next to the code. Test files live under `src/`, so `tsc -b` type-checks them, but Vite tree-shakes them out of the production bundle.

## TypeScript layout

Uses TS project references — the root `tsconfig.json` is just a solution file and references two real configs:

- `tsconfig.app.json` — covers `src/` (browser code). Bundler-mode resolution, `verbatimModuleSyntax`, `noUnusedLocals`/`noUnusedParameters`, and `erasableSyntaxOnly` are all on, which means: type-only imports must use `import type`, unused symbols fail the build, and TS-only syntax that can't be erased (enums, namespaces, parameter properties) is rejected. Prefer plain unions/objects over `enum`.
- `tsconfig.node.json` — covers tooling files (`vite.config.ts`).

When changing TS config, edit the appropriate referenced file, not the root.

## ESLint

Flat config (`eslint.config.js`) extends `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` flat recommended, and `eslint-plugin-react-refresh`'s `vite` preset. `dist` is globally ignored. Rules are **not** type-aware by default; if turning on `recommendedTypeChecked`, wire `parserOptions.project` to both tsconfigs as shown in `README.md`.

## React Compiler

Not enabled. See `README.md` if/when adding it.

## Commit hygiene

- **Conventional Commits** are enforced. `commitlint.config.js` extends `@commitlint/config-conventional`, so commit headers must look like `feat: ...`, `fix(scope): ...`, `chore: ...`, etc.
- **pre-commit framework** (`.pre-commit-config.yaml`) wires local hooks:
  - `commit-msg` stage → `pnpm exec commitlint --edit` validates the message.
  - `pre-commit` stage → `eslint --fix` on staged JS/TS files (auto-fixing), then `pnpm typecheck` and `pnpm test` (whole-repo, matching CI).
- Lint is the one intentional pre-commit/CI divergence: locally it auto-fixes staged files; CI runs whole-repo `pnpm lint` as the backstop. Both use the same `eslint.config.js`, so the fixed code a commit produces is exactly what CI re-checks. typecheck and test are identical commands on both sides.
- New contributors must run `pre-commit install --hook-type pre-commit --hook-type commit-msg` once after cloning.
- **Do not bypass with `--no-verify`.** A Claude PreToolUse hook (`.claude/hooks/block-no-verify.sh`, wired in `.claude/settings.json`) rejects `git commit --no-verify` and `-n` to keep the gates honest. Fix the underlying hook failure instead.

## CI

`.github/workflows/ci.yml` runs on push/PR to `main`: `pnpm lint`, `pnpm build`, `pnpm test` — the same scripts the pre-commit hooks use. pnpm is pinned via the `packageManager` field in `package.json`, which both `corepack` locally and `pnpm/action-setup` in CI honor.
