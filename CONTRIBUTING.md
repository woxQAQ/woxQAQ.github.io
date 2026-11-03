
# Contributing

Thank you for your interest in contributing!

## Before You Start

If you plan to make major changes (especially new features or design changes), please open an issue or discussion before starting work. This helps ensure your effort aligns with the project's direction.

## Submitting Code

Please keep each pull request focused on a single purpose. Avoid mixing unrelated changes in one PR, as this can make reviewing and merging code more difficult.

Please use the [Conventional Commits](https://www.conventionalcommits.org/) format for your commit messages whenever possible. This keeps our history clear and consistent.

We use oxfmt for formatting and oxlint for linting. Before submitting code, run:

```bash
pnpm format
pnpm lint
pnpm check
```

Use `pnpm lint:fix` to apply safe lint fixes. CI runs `pnpm format:check` and
`pnpm lint` without modifying files. Formatting covers source code, including
Astro and Svelte components; CSS and blog content are excluded.
