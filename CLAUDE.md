# Technology
Use pnpm for package management instead of npm

# Repo Packages Structure

* `client` is used for the frontend. All of the browser game rendering logic lives here.
* `server` is used for the backend. It's a websocket server that maintains game state.
* `shared` is used for shared code. Game logic lives here

## CSS Conventions

This project uses **Tailwind CSS v4** with **class-variance-authority (CVA)** for styling.

- Tailwind is integrated via the `@tailwindcss/vite` Vite plugin (no PostCSS config needed).
- `packages/client/src/index.css` contains only `@import "tailwindcss"`.
- Use `cva()` to define components with visual variants; extend `VariantProps` in the component props interface.
- Do not write plain CSS classes for component appearance.

# Evaluations After Writing Code
An evaluation is defined as running `pnpm check` followed by `pnpm test`
Run an evaluation after making any change to code
