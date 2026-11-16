# Ask Factory under sandfactory

The repo has a `.sandcastle/` directory: big work is built by sandcastle agents in a **group**, not by `/implement`. This replaces steps 6 and 7 of the main flow in [SKILL.md](SKILL.md); small work still goes to `/implement` in your own checkout.

## Build

1. Commit the spec and tickets under `.scratch/<group>/` on your branch: a group reads them from there.
2. `sandfactory group new <group>` forks the `group/<group>` branch.
3. `sandfactory queue add <group>` runs it: agents build the tickets, then the final review, testbook and walkthrough stages run. A run stopped by a usage limit resumes from the queue and builds only what is missing. `sandfactory queue list` shows where it is.

## Review

All of it happens in the group's **workspace**, on the group branch. `sandfactory group open <group>` prepares it and prints the newest batch's pages. Start a fresh session there.

1. Read `.scratch/<group>/final-review.md`: the final reviewer's fixes, and the spec findings it left for a human.
2. Open the testbook, check the batch by hand, then **`/to-testbook`** with the exported results.
3. Open the walkthrough, then **`/walkthrough`** to talk through it.
4. **`/blueprint drift`**, when the group has a blueprint.

Each settles its **open points** in grilling rounds. Fixes are committed in the workspace. Points to build later go to **`/to-tickets`** and are committed there too, then `sandfactory queue add <group>` again: the next testbook and walkthrough cover only the new **batch**.

## Land

`sandfactory land <group>` once the review is done, as the last action: it refuses while the workspace holds uncommitted work, and it deletes the workspace's review pages and open points. Then **`/retro`**.
