# Hooks — Real Enforcement (not just instructions in text)

## Why this exists

Every rule written as prose inside AGENTS.md, `docs/` or `05-guides/` is
**context**, not **enforcement**. Hooks are different: they're real shell
commands triggered automatically by lifecycle events, and they run regardless
of what the AI decides to do.

## What this hook does

Before any `git commit` (the `PreToolUse` event on the Bash tool), it runs
lint + typecheck and **blocks the commit if either fails**. The AI gets the
error back and must fix it before retrying.

## Setup (already done)

The hook is configured in `.claude/settings.json` with this project's real
commands:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'git commit'; then npm run lint && npm run typecheck || exit 1; fi"
          }
        ]
      }
    ]
  }
}
```

- `npm run lint` → ESLint (flat config)
- `npm run typecheck` → `tsc -b --noEmit`

These are the same commands documented in `AGENTS.md` → Commands. Keep them in
sync if the scripts change.

## Note

This hook fires under Claude Code. If you're using another tool (OpenCode,
Cursor, etc.), that tool has its own hook/validation mechanism — the commands
to run (`npm run lint && npm run typecheck`) stay the same.

## This is just the start

This is **one** hook on the most critical event (pre-commit). Full hook
systems (multiple events, slash commands, subagent orchestration) are out of
scope for this kit.
