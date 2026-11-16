# Walkthrough under sandfactory

The repo has a `.sandcastle/` directory: its tickets are issues of a sandfactory **group**, implemented by sandcastle runs. This adds to step 1 of [SKILL.md](SKILL.md); it replaces nothing there.

## Which repos

Read `topology` in `.sandcastle/sandfactory.json`. Under `single`, there is one range, in this repo. Under `superproject`, tickets live in the umbrella and code lives in the submodules, so take one range per submodule the group touched: an issue's `Repo:` field names it.

## Which commits

- Implementer commits are subjects like `RALPH: complete issue #48`, and each ticket's work merges as `Merge branch 'sandcastle/<group>-<NN>-<slug>'`. `walkthrough.mjs hunks` already traces both to their tickets.
- In a superproject, the umbrella's `sandcastle(<group>): advance <repo>, close <tickets>` commits say which tickets each run closed and in which repo.
- A feature group's landing branch is the submodule's `branch =` in `.gitmodules`, or the umbrella's default branch under `single`.

## Close-out

When `/to-tickets` slices the queue, each new ticket needs a `Repo:` under `superproject`, so the next run routes it to the right submodule.
