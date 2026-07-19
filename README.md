# live-show-ads

Ads Manager — Next.js app for live-show advertisers, part of the pnpm
workspace rooted at the repository root (`pnpm-workspace.yaml`). It consumes
`@live-show/design-system` (`packages/design-system`) via `workspace:*`,
compiled through `transpilePackages` — the package ships as TS/SCSS source
with no build step.

Install and build **from the workspace root**, not from this directory:

```bash
pnpm install                        # root — resolves the whole workspace
pnpm --filter live-show-ads build   # or: dev, test, typecheck
```

There is no local `pnpm-lock.yaml` here — the root lockfile is the single
source of truth. Do not add one. Dev server runs on port 3002.
