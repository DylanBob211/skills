# To Testbook under sandfactory

The repo has a `.sandcastle/` directory: its tickets are issues of a sandfactory **group**, implemented by sandcastle runs, and reviewed in the group's **workspace** before it lands. Where it differs from [SKILL.md](SKILL.md), it wins. A factory stage that hands you its own batch and output path follows those instead.

## Where a testbook lives

The factory generates one testbook per **batch**: the group's issues closed since its last testbook, or since the group forked. Each sits in its own folder of the workspace, `.sandcastle/reviews/<tip>/`, holding `testbook.html` and its record `testbook.json` (the batch's `fork` and each repo's `base` and `tip`).

Work in the workspace, which `sandfactory group open <group>` prepares and whose newest batch pages it prints. The newest folder holding a `testbook.html` is the **results** target, and `open-points.md` goes beside it. Its criteria come from the batch's tickets: read those, and the spec as context, in place of `sourceRef`.

## Generating one by hand

When no valid testbook exists for the newest batch, generate one for the batch, never for every ticket in the group: take each repo's `base` from the newest `testbook.json` `tip`, or the group's fork when there is none, and `tip` from the workspace's current tip. The batch's tickets are the issues `closed` at the tip and not `closed` at the base. Draw criteria only from them, with the spec as context. Write the page into a new `.sandcastle/reviews/<tip>/` folder, with a `testbook.json` in the same shape.

## Which repos

Read `topology` in `.sandcastle/sandfactory.json`. Under `single`, the app is this repo. Under `superproject`, tickets live in the superproject and code lives in the submodules: an issue's `Repo:` field names the one it changed.

## Fixes and edits

- **Fix now** commits go on the group branch in the workspace: in a superproject, in the submodule's checkout, which `group open` leaves on its group branch.
- **Change the spec or criteria** edits go to the group's spec and issues in the workspace. Commit them there, so the next run reads them from the group branch.

## Close-out

`open-points.md` and the batch folder go when the group lands, so hand the build-later points to `/to-tickets` first. Under `superproject`, each new ticket needs a `Repo:`, so the next run routes it to the right submodule.
