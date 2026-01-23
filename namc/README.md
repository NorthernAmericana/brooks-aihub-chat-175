# NAMC Repository Conventions

## Naming conventions
- Lore packages live in `namc/lore/*.lore.md`.
- Project scaffolding lives in `namc/projects/<slug>/`.
- Use lowercase slugs with hyphens (e.g., `my-daughter-death`).

## Secret Commands

NAMC content is integrated into Brooks AI HUB through special "secret commands" - hidden, discoverable features that provide unique experiences. See [docs/secret-commands.md](../docs/secret-commands.md) for more information.

Example: `/NAMC/ let me watch a movie` opens a video player for NAMC content.

## Project structure (recommended)
Each project should include:
- `index.md` (spoiler-safe hub)
- `timeline.md` (high-level beats)
- `characters.md`
- `locations.md`
- `motifs.md`
- `formats.md` (if cross-media)
- `continuity.md` (canon rules and spoiler gates)

## Spoiler policy rules
- **Top-level index pages must remain spoiler-safe.**
- Spoilers can live only in clearly labeled sections or separate files.
- Avoid resolving core mysteries in index-level docs.

## Adding a new project
1. Create a lore file in `namc/lore/` with a spoiler-safe overview.
2. Create a project folder in `namc/projects/<slug>/` with the recommended docs.
3. Link the project in:
   - `namc/lore_dictionary.md`
   - `namc/timeline_master.md`
   - `namc/projects/index.md`
4. Use consistent metadata blocks:
   - `Status: Coming soon`
   - `Release date: TBA`
   - `Format:` or `Formats:`
