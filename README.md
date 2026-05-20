# Pi Galang Setup

One-shot setup for [Pi coding agent](https://pi.dev) — with auto-detect Perplexity MCP.

## Install

```bash
npx @galangryandana/pi-galang-setup
```

That's it. One command.

## What It Does

```
npx @galangryandana/pi-galang-setup
       │
       ├─ 1. Check prerequisites (bun, pi, git)
       ├─ 2. Install pi-mcp-adapter
       ├─ 3. Test GitHub SSH access:
       │      │
       │      ├─ ✅ Authenticated as galangryandana
       │      │   ├─ git clone perplexity-pro-mcp (private repo)
       │      │   ├─ bun build binary
       │      │   ├─ Write ~/.pi/agent/mcp.json
       │      │   └─ Write ~/.pi/agent/AGENTS.md (MCP section)
       │      │
       │      └─ ❌ No access / different account
       │          └─ Skip Perplexity, other setup still runs
       │
       └─ 4. Print summary
```

## Perplexity MCP

The Perplexity MCP server source lives in a **private GitHub repo**. The installer auto-detects SSH access:

- **Has access** → clones, builds & configures everything
- **No access** → skips silently, other setup still runs
- **Re-run anytime** → will pick up new SSH keys automatically

## MCP Tools Available

| Tool | When to Use |
|------|-------------|
| `perplexity_search` | Quick facts, prices, news, definitions |
| `perplexity_research` | Deep research, multi-source analysis |
| `perplexity_ask` | How-to questions, tutorials, troubleshooting |
| `perplexity_reason` | Logical analysis, comparisons, pros/cons |

## Custom Configuration

Override defaults with environment variables:

```bash
PERPLEXITY_API_URL="https://your-api.example.com" \
PERPLEXITY_API_KEY="your-key" \
npx @galangryandana/pi-galang-setup
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PERPLEXITY_API_URL` | `https://perproxity.ryandana.web.id` | Perplexity API endpoint |
| `PERPLEXITY_API_KEY` | `ppx-deep-research` | API key |
| `PERPLEXITY_MODEL` | `gpt-5-4-thinking` | Model to use |
| `PERPLEXITY_MODEL_PREFIX` | `galangdota2` | Model prefix |
| `MCP_LIFECYCLE` | `lazy` | `lazy`, `eager`, or `keep-alive` |
| `PI_AGENT_DIR` | `~/.pi/agent` | Pi agent config directory |
| `PROJECTS_DIR` | `~/projects` | Where to clone repos |

## Prerequisites

| Tool | Install |
|------|---------|
| [Node.js](https://nodejs.org) ≥ 18 | Required for `npx` |
| [Bun](https://bun.sh) | `curl -fsSL https://bun.sh/install \| bash` |
| [Pi](https://pi.dev) | `bun add -g @earendil-works/pi-coding-agent` |
| [Git](https://git-scm.com) | Package manager |
| SSH key (for Perplexity) | `ssh-keygen` + add to GitHub |

## Uninstall

```bash
rm ~/.pi/agent/mcp.json
# Edit or remove MCP section from AGENTS.md
pi uninstall npm:pi-mcp-adapter
rm -rf ~/projects/perplexity-pro-mcp
```

## License

MIT
