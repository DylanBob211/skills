# Preflight under sandfactory

The repo has a `.sandcastle/` directory: its tickets are issues of a sandfactory **group**, and a run reads them through the factory's own parser. This adds to [SKILL.md](SKILL.md); it replaces nothing there.

## The base

If the branch `group/<slug>` exists, the base is its tip: the group as built so far, its closed issues included. Otherwise it is the branch `sandfactory group new` will fork from (`--from`, by default the current branch).

## Extra mechanics checks

Add these to step 4, item 5:

- **What the parser sees.** Run `npm run issues -- list` and compare each in-group issue's parsed `status`, `dependsOn` and `repo` with what its text says. A blocking edge in the text that is missing from `dependsOn` (a `Blocked by:` line, a field in the wrong place) is a lost edge: the planner will never see it, so it is a contradiction.
- **Repo routing.** Read `topology` in `.sandcastle/sandfactory.json`. Under `superproject`, every issue needs a `Repo:` naming a submodule the project declares. Under `single`, `Repo:` is absent or `.`.
- **Check tiers.** `CHECKS.md` has fast checks, which every implementer and reviewer run without a Docker daemon, and full checks, which only the merger and final reviewer run. A criterion only a full check can verify, demanded of a single ticket, is a contradiction.

## Hand-back

Tell the user to commit the spec and tickets, then run `sandfactory group new <slug>`: a group reads them from its branch.
