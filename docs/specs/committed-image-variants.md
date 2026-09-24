# Spec: Commit generated image variants so Netlify stops encoding them

Status: **implemented** · Branch: `perf/committed-image-variants`

## Problem Statement

The site is on Netlify's Legacy free plan, has run out of build credits, and paying for more is
not an option. Build time has risen sharply over the last few weeks, and the cause was never
measured.

Each of the last 12 commits was built from a clean export (`git archive` → `npm ci` → image
generation → `next build`) on an 18-core Mac:

| commit | change | image encoding | `next build` | total | variant files |
|---|---|---:|---:|---:|---:|
| `a744fc6` | deps update (#108) | — | 8s | **8s** | 0 |
| `2af3696` | build-time highlighting (#109) | — | 9s | **9s** | 0 |
| **`3b28a97`** | **responsive AVIF/WebP variants (#110)** | **42s** | 9s | **51s** | 663 |
| `29971a8` … `b3d2278` | #111–#113 | 42–43s | 9s | 51–52s | 663 |
| **`0d66dde`** | **site chrome variants, adds 96/200 widths (#114)** | **51s** | 9s | **60s** | 1,097 |
| `aa75f52` … `f43d8ea` (HEAD) | #117–#121 | 50–51s | 9–10s | 59–60s | 1,085 |

Two further measurements on HEAD:

- **Cold, one encoder thread** (`VIPS_CONCURRENCY=1`): **120s** of image encoding alone. That is a
  closer approximation of a small shared build container than 18 cores are. On Netlify's hardware
  the real cost is likely to be minutes per build.
- **Warm cache** (variants and manifest already on disk): **0s**. The generator's content-hash
  cache works. Netlify never benefits from it, though.

**Root cause.** `npm run images` runs as `prebuild`, and its output (`public/_img/`) is
gitignored. Every Netlify build, whether a production deploy or a deploy preview, starts from a
fresh checkout with no manifest and re-encodes all 110 raster images into AVIF and WebP at up to
six widths. `post-asset-pipeline.md` assumption 4 expected the manifest-based skip to mean "the
cost is paid once per changed image rather than once per build". That assumption holds locally
and never held on Netlify.

`next build` itself did not regress: it takes 8–10s across all 12 commits. Everything else
(highlighting, lightbox, JSON-LD, marquee, tags) had no measurable effect.

## Solution

Treat the generated variants as checked-in build artefacts, like a lockfile.

- `public/_img/` (about 15 MB, 1,085 files plus `manifest.json`) is committed to git.
- The site owner runs `npm run images` locally whenever they add, change or remove an image under
  `public/`, and commits the result alongside it.
- On Netlify, `prebuild` finds every variant already present and matching its source hash, so it
  encodes nothing. Build time returns to roughly pre-#110 levels (≈10s of real work plus install).
- GitHub Actions (free for this public repo) enforces the contract. A PR whose committed variants
  are missing, stale or orphaned fails CI with a message telling the author to run
  `npm run images`.
- Netlify skips builds entirely for commits that cannot change the published site (docs, specs,
  tests, CI config), so they no longer consume build minutes.

If someone forgets to regenerate, the site still builds correctly: the prebuild step encodes only
the images whose variants are missing. The cost of forgetting is a few seconds on one build, not
a broken deploy, and CI flags it before merge.

## User Stories

1. As the site owner, I want Netlify builds to take roughly as long as they did before #110, so that I stay within the Legacy free plan without paying for more.
2. As the site owner, I want to know which commit made builds slow and by how much, so that I can trust the fix targets the real cause.
3. As the site owner, I want generated image variants committed to the repo, so that Netlify never has to run the AVIF/WebP encoder.
4. As the site owner, I want one command (`npm run images`) to regenerate every variant and the manifest locally, so that updating them is a single step when I add an image.
5. As the site owner, I want that command to re-encode only images that changed, so that adding one cover image takes seconds rather than two minutes.
6. As the site owner, I want the generated output to be byte-for-byte deterministic for the same inputs, so that re-running the command on an unchanged tree produces no git diff.
7. As the site owner, I want the manifest written in a stable key order with stable formatting, so that a PR's diff shows exactly which images changed.
8. As the site owner, I want variants for a deleted source image removed when I regenerate, so that the repo does not accumulate dead files.
9. As the site owner, I want variants for a renamed or moved source image regenerated at the new path and removed from the old one, so that moves are clean.
10. As the site owner, I want a check mode on the generator that reports problems without writing any files, so that CI can verify the committed output without mutating it.
11. As the site owner, I want the check mode to fail when a source image has no manifest entry, so that a newly added image cannot ship without variants unnoticed.
12. As the site owner, I want the check mode to fail when a source image's content hash differs from its manifest entry, so that an edited image cannot ship with stale variants.
13. As the site owner, I want the check mode to fail when a manifest entry's variant files are missing from disk, so that a partially committed set is caught.
14. As the site owner, I want the check mode to fail when the encoder config (widths, max width, formats, qualities) differs from the one recorded in the manifest, so that changing the ladder forces a regeneration.
15. As the site owner, I want the check mode to fail when there are variant files or manifest entries with no corresponding source, so that orphans are caught.
16. As the site owner, I want the check mode's failure message to list each offending image and say to run `npm run images` and commit the result, so that the fix is obvious.
17. As the site owner, I want the check mode to exit zero with a one-line summary when everything is in sync, so that CI logs stay quiet.
18. As the site owner, I want CI on every PR and push to main to run the check, so that out-of-date variants never reach main.
19. As the site owner, I want the check to run in GitHub Actions rather than on Netlify, so that verification uses free minutes and not Netlify's.
20. As the site owner, I want Netlify's prebuild to still encode anything missing rather than fail, so that a forgotten regeneration degrades to a slower build rather than a failed deploy.
21. As the site owner, I want the prebuild log on Netlify to say how many images were encoded versus reused, so that I can confirm from a deploy log that nothing was encoded.
22. As the site owner, I want Netlify to skip building commits that only touch docs, specs, tests, CI workflows or markdown guides, so that housekeeping commits cost zero build minutes.
23. As the site owner, I want Netlify to still build any commit that touches posts, `public/`, `src/`, dependencies or build config, so that the skip rule can never leave the live site stale.
24. As the site owner, I want the skip rule to also apply to deploy previews, so that PRs that only change docs or tests don't burn minutes on previews.
25. As the site owner, I want the local dev server to keep working after a fresh clone without running any extra command, so that committed variants make onboarding simpler, not harder.
26. As a reader, I want every page to render exactly the same images, `srcset`s and dimensions as before, so that the change is invisible to me.
27. As a reader, I want the AVIF/WebP byte savings from #110 and #114 kept in full, so that a faster build is not bought with slower pages.
28. As a contributor or agent adding a post with images, I want CLAUDE.md to tell me to run `npm run images` and commit `public/_img/`, so that I follow the workflow without having to discover it from a CI failure.
29. As a contributor, I want the existing asset-pipeline spec corrected where it says variants are not committed and that Netlify build time rise is acceptable, so that the docs don't contradict the repo.
30. As the site owner, I want to understand the repository-size cost (≈15 MB now, plus a full rewrite of all variants whenever the encoder config changes), so that I change widths or qualities deliberately.
31. As the site owner, I want the test suite to cover the check mode against real fixture images in a temp directory, so that the contract CI relies on is itself verified.
32. As the site owner, I want the change delivered as one PR that includes the committed variants, so that main moves straight from "encodes every build" to "encodes nothing".

## Implementation Decisions

- **Generated variants are committed.** Remove `public/_img/` from `.gitignore` and commit the
  current output of `npm run images` (manifest plus all variants). This reverses assumption 3 of
  `post-asset-pipeline.md`. Update that spec with a short correction note pointing here, in the
  same style as its existing "Correction (during implementation)" note.
- **`prebuild` stays wired to `npm run images`.** Its existing content-hash cache already makes it
  a no-op when the committed output is in sync (measured: 0s, "0 encoded, 110 reused"). Keeping
  it means a forgotten regeneration self-heals on Netlify instead of breaking the deploy. No
  change to `netlify.toml`'s build command.
- **Orphan cleanup in generate mode.** The generator currently only adds. With output committed,
  it must also delete variant files under `public/_img/` that no current manifest entry
  references, and drop manifest entries whose source no longer exists. `manifest.json` itself is
  never deleted.
- **Deterministic output.** Manifest keys stay sorted by source path (already the case, since
  sources are sorted), formatting stays two-space JSON with a trailing newline, and nothing
  time-based or machine-specific is written. Encoded bytes must be identical across runs on the
  same `sharp`/libvips version. If a `sharp` upgrade changes encoder output, that shows up as a
  config or hash mismatch only if the config hash changes, so see the next point.
- **The config hash includes the sharp version.** The cache key today is widths + max width +
  formats/qualities. Add the installed `sharp` version (and with it libvips) so a dependency bump
  that could change encoder output forces a deliberate regeneration rather than leaving a mix of
  encoder generations. This makes dependency-update PRs that bump `sharp` fail `--check` until
  regenerated, which is intended.
- **New `--check` mode on the generator.** Invoked as `npm run images:check` (new script). It
  performs the same walk and hashing as generate mode but writes nothing and encodes nothing. It
  collects every discrepancy into one report and exits non-zero if there are any. Discrepancy
  kinds:
  - *missing*: source raster with no manifest entry
  - *stale*: source hash ≠ manifest hash
  - *config*: entry's config hash ≠ current config hash
  - *incomplete*: manifest references a variant file that does not exist
  - *orphan-entry*: manifest entry whose source does not exist
  - *orphan-file*: file under the variants root that no entry references

  Measure-only formats (GIFs) are checked for presence and correct dimensions only.
- **The generator becomes callable with explicit roots.** The main routine accepts the source
  root and output root as parameters (defaulting to `public` and `public/_img`) and returns a
  result object (counts of encoded, reused, measured, skipped, removed, plus the list of
  discrepancies in check mode). It no longer hard-codes paths or calls `process.exit` internally.
  The CLI wrapper maps the result to logs and an exit code. This is the one test seam.
- **CI.** The existing `CI` workflow runs `npm run images:check` immediately after `npm ci`,
  *before* `npm run build`. Otherwise the build's own `prebuild` would regenerate the missing
  variants and mask the problem. It also bumps `actions/checkout` and `actions/setup-node` from
  v2 to current majors while touching the file.
- **Netlify skip rule.** Add an `ignore` command to the `[build]` section of `netlify.toml`. It
  exits 0 (skip) when the diff between Netlify's cached commit and the current commit touches
  only paths that cannot affect `out/`: `docs/`, `*.md` at the repo root, `.github/`, test files
  (`*.test.ts`, `*.test.tsx`), `jest.config.ts`, `jest.setup.ts`, `codecov.yml`. Everything else
  builds. The command must also build (exit 1) when there is no cached commit ref, such as on a
  first build or a cleared cache. An allowlist of skippable paths is preferred over a denylist of
  buildable ones, so any new top-level directory builds by default.
- **Docs.** CLAUDE.md gains a short "Images" note under the content pipeline: after adding,
  changing or removing any raster image under `public/`, run `npm run images` and commit
  `public/_img/` in the same commit. CI enforces it.
- **What does not change.** Widths, formats, qualities, the manifest schema consumed by
  `src/app/util/images`, variant URL naming, `<picture>` markup, and every rendered page. The
  `hash` and `config` fields remain generator-private.

## Testing Decisions

- **What makes a good test here:** it drives the generator the way CI and a developer do (point
  it at a directory of images, run it, inspect the result object and the files on disk) and
  asserts outcomes, never internal helper calls. A test should still pass if the generator's
  internals were rewritten.
- **One seam: the generator's main routine with explicit roots.** Tests build a small fixture tree
  in a temp directory with a few tiny real images: one PNG, one JPEG, one GIF, one narrower than
  the smallest rung. They then exercise:
  - a first generate run encodes everything and writes a manifest; a second run encodes nothing and leaves every file byte-identical
  - `--check` on a freshly generated tree reports no discrepancies
  - after adding a source image, `--check` reports *missing* for exactly that image
  - after overwriting a source's bytes, `--check` reports *stale*
  - after deleting one variant file, `--check` reports *incomplete*
  - after deleting a source, `--check` reports *orphan-entry* and *orphan-file*; a generate run then removes those files and the entry
  - after renaming a source, generate produces variants at the new path and removes the old ones
  - a changed config hash is reported as *config* for every encoded entry
  - check mode never writes: the fixture tree's file list and mtimes are unchanged after a failing check
- Fixtures should be tiny (tens of pixels) so the suite stays fast. Real encoding at that size
  takes milliseconds.
- **Prior art:** `src/app/util/images/targetWidths.test.ts` already imports from
  `scripts/generate-image-variants.mjs`, so Jest can load the script as-is. `urls.test.ts` shows
  the pattern of checking the real manifest against code, and should keep passing unchanged
  against the now-committed manifest.
- **Not unit-tested:** the Netlify `ignore` command (verified manually by pushing a docs-only
  commit and confirming Netlify reports "Build skipped") and the CI wiring (verified by the PR's
  own CI run, plus one deliberately stale commit that is then reverted).
- **Acceptance measurement:** after merge, the Netlify deploy log's prebuild line reads
  "0 encoded, 110 reused", and total Netlify build time is compared against the last pre-merge
  deploy. Record both numbers in the PR.

## Out of Scope

- Moving the build to GitHub Actions and deploying the prebuilt `out/` with the Netlify CLI.
  That would take Netlify build minutes to zero, but it needs secrets, dashboard changes and
  preview rewiring. Revisit if committed variants prove insufficient.
- A Netlify build-cache plugin to persist `public/_img/` between builds instead of committing it.
  It is less deterministic (evictions, first builds, previews), and the owner prefers committed
  artefacts.
- Git LFS for the variants. At ≈15 MB it isn't warranted, and LFS bandwidth has its own quotas.
- Changing the width ladder, dropping AVIF, or lowering encoder effort to make encoding cheaper.
  Once encoding leaves Netlify, its cost only matters locally.
- Any change to reader-facing output, the `src/app/util/images` API or the manifest schema.
- A git pre-commit hook to run `npm run images` automatically. CI is the enforcement point.
- Reducing `next build` time (steady at 8–10s; not the regression).

## Further Notes

- The step change is **`3b28a97` (#110)**: about 9s → 51s clean on an 18-core machine.
  **`0d66dde` (#114)** added a second step, 51s → 60s, by adding the 96px and 200px rungs
  (663 → 1,097 files). Nothing after that moved the numbers.
- Benchmark method: each commit was exported with `git archive` into a scratch directory,
  followed by `npm ci`, a timed `node scripts/generate-image-variants.mjs`, a timed
  `npx next build`, and a count of generated files. Absolute Netlify times will be higher; the
  single-thread figure (120s encoding) is the better guide to that environment.
- Netlify's Legacy free plan meters build minutes across production deploys **and** deploy
  previews. September has had 13 PRs so far, each with at least one preview build plus a
  production build on merge. That is why the per-build encoding cost compounded so quickly, and
  why the docs-only skip rule is worth having on top of the main fix.
- Repository cost: ≈15 MB now. Any future change to widths, formats, qualities or the `sharp`
  version rewrites every variant, adding roughly another 15 MB to history each time. That is an
  acceptable trade for a personal site, but a reason to change those settings rarely.
