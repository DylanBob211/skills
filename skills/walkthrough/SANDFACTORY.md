# Walkthrough under sandfactory

The repo has a `.sandcastle/` directory: its tickets are issues of a sandfactory **group**, implemented by sandcastle runs, and reviewed in the group's **workspace** before it lands. Where it differs from [SKILL.md](SKILL.md), it wins. A factory stage that hands you its own ranges and output paths follows those instead.

## Where a walkthrough lives

The factory generates one walkthrough per **batch**: the group's issues closed since its last walkthrough, or since the group forked. Each sits in its own folder of the workspace, `.sandcastle/reviews/<tip>/`, holding `walkthrough.html`, its record `walkthrough.json` (the batch's `fork` and each repo's `base` and `tip`), and `walkthrough-outline.json` with the hunks files it names.

Work in the workspace, which `sandfactory group open <group>` prepares and whose newest batch pages it prints. That newest folder is the **resume** target: its outline is the outline, and `open-points.md` goes beside it. A folder with no outline is from before the factory kept one: tell the human to generate the walkthrough again rather than resume it.

## Generating one by hand

When no valid walkthrough exists for the newest batch, generate one for the batch, never for every ticket in the group: take each repo's `base` from the newest `walkthrough.json` `tip`, or the group's fork when there is none, and `head` from the workspace's current tip. The covered tickets are the batch's issues: `closed` at `head`, not `closed` at `base`. Write the outline and page into a new `.sandcastle/reviews/<tip>/` folder, with a `walkthrough.json` in the same shape.

## Which repos

Read `topology` in `.sandcastle/sandfactory.json`. Under `single`, there is one range, in this repo. Under `superproject`, tickets live in the superproject and code lives in the submodules, so take one range per submodule the group touched: an issue's `Repo:` field names it.

## Which commits

- Implementer commits are subjects like `RALPH: complete issue #48`, and each ticket's work merges as `Merge branch 'sandcastle/<group>-<NN>-<slug>'`. `walkthrough.mjs hunks` already traces both to their tickets.
- In a superproject, the superproject's `sandcastle(<group>): advance <repo>, close <tickets>` commits say which tickets each run closed and in which repo.

## Fixes and edits

- **Fix now** commits go on the group branch in the workspace: in a superproject, in the submodule's checkout, which `group open` leaves on its group branch.
- **Change the spec or criteria** edits go to the group's spec and issues in the workspace. Commit them there, so the next run reads them from the group branch.
- After each rebuild, set every `tip` in that batch's `walkthrough.json` to the repo's new `HEAD`. The next batch starts from those tips, so your fixes don't come back as Untraced in the next walkthrough.

## Close-out

`open-points.md` and the batch folder go when the group lands, so hand the build-later points to `/to-tickets` first. Under `superproject`, each new ticket needs a `Repo:`, so the next run routes it to the right submodule.
