# skills

Agent skills for planning and reviewing work an agent builds from a spec and its tickets. They work in Claude Code, Codex, and any agent the [`skills` CLI](https://github.com/vercel-labs/skills) installs into.

| Skill | When | What it does |
| --- | --- | --- |
| [`blueprint`](skills/blueprint/SKILL.md) | After the tickets, before implementation | Previews the architecture the spec and tickets will produce, agrees it with you, and saves it. Later, `/blueprint drift` compares what was built against it. |
| [`preflight`](skills/preflight/SKILL.md) | Just before implementation | Reads a spec and its tickets as a set, and settles every contradiction or divergence that would stall the agents. |
| [`to-testbook`](skills/to-testbook/SKILL.md) | After implementation | Turns a spec, tickets, or the conversation into a self-contained HTML page for verifying the feature by hand. Paste its exported results back and each failure or note is settled in grilling rounds. |
| [`walkthrough`](skills/walkthrough/SKILL.md) | After implementation | Walks you through the changes as a story: diffs grouped by purpose, each beside the ticket it came from, with every unit addressable by ID in chat. |

All four are invoked by name only (`/blueprint`, `/preflight`, …); the agent never starts them on its own.

## Install

```sh
npx skills add DylanBob211/skills -g                       # all four, for every project
npx skills add DylanBob211/skills -g --skill walkthrough   # just one
npx skills update                                           # later, to pull new versions
```

`walkthrough` runs a small helper script, so it needs Node 18 or later and `git`.

## What they expect

They assume the planning flow of [`mattpocock/skills`](https://github.com/mattpocock/skills): a spec and tickets in an issue tracker (local Markdown under `.scratch/<group>/` works), described for the agent by `docs/agents/issue-tracker.md` and `docs/agents/domain.md`. Run `/setup-matt-pocock-skills` once per repo to write those. The skills hand off to `/to-spec`, `/to-tickets`, `/code-review` and `/diagnosing-bugs` from that set. `blueprint` presents its views with `/show-me` from [`humanlayer/skills`](https://github.com/humanlayer/skills).

None of that is required to read the skills, but without it the handoffs point nowhere.

## sandfactory

`preflight` and `walkthrough` each carry a `SANDFACTORY.md`. They read it only when the repo has a `.sandcastle/` directory, so in any other repo it is never loaded.

## License

[MIT](LICENSE)
