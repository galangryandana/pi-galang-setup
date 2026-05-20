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
       ├─ 3. Check access to private Perplexity MCP repo:
       │      │
       │      ├─ ✅ Has access (repo owner or invited collaborator)
       │      │   ├─ git clone perplexity-pro-mcp (private repo)
       │      │   ├─ bun build binary
       │      │   ├─ Write ~/.pi/agent/mcp.json
       │      │   └─ Write ~/.pi/agent/AGENTS.md (MCP section)
       │      │
       │      └─ ❌ No access
       │          └─ Skip Perplexity, other setup still runs
       │
       └─ 4. Print summary
```

## Prerequisites

### Required (must have)

| Tool | How to Install | Why |
|------|----------------|-----|
| **Node.js** ≥ 18 | [nodejs.org](https://nodejs.org) or `nvm install 18` | Required for `npx` to run the installer |
| **Git** | Package manager (`apt`, `brew`, etc.) | Required for cloning repos |
| **Bun** | `curl -fsSL https://bun.sh/install \| bash` | Required for building MCP server binary |
| **Pi agent** | `bun add -g @earendil-works/pi-coding-agent` | This is what we're setting up! |

### Optional (for Perplexity MCP)

> ❌ **No `gh` CLI needed!** The installer uses plain `git` + SSH.

| Requirement | How to Setup | Why |
|-------------|-------------|-----|
| **SSH key** | See [Setup SSH Key](#setup-ssh-key) below | Used by `git` to access private GitHub repo |
| **Repo access** | Ask repo owner for invite | The installer checks if you can access `galangryandana/perplexity-pro-mcp` |

If you don't have these, the installer will still run — it just skips the Perplexity MCP setup.

### Setup SSH Key

If you don't have an SSH key yet:

```bash
# 1. Generate a new SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter 3x to accept defaults

# 2. Add to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 3. Copy your public key
cat ~/.ssh/id_ed25519.pub
```

Then add it to your GitHub account:
- Go to **https://github.com/settings/keys**
- Click **New SSH key**
- Paste your public key
- Click **Add SSH key**

Verify it works:
```bash
ssh -T git@github.com
# Should show: Hi <username>! You've successfully authenticated...
```

### Setup Repo Access

If you're **not** the repo owner:
1. Ask `galangryandana` to invite your GitHub account as a collaborator to `perplexity-pro-mcp`
2. Accept the invitation via email or GitHub notification
3. Run `npx @galangryandana/pi-galang-setup` — it will auto-detect your access

## Perplexity MCP

The Perplexity MCP server source lives in a **private GitHub repo**. The installer checks repo access via `git ls-remote`:

- **Has access** (owner or collaborator) → clones, builds & configures everything
- **No access** → skips silently, other setup still runs
- **Re-run anytime** → will pick up new access automatically

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

## Quick Start on a Fresh Machine

```bash
# 1. Install prerequisites
curl -fsSL https://bun.sh/install | bash    # Bun
bun add -g @earendil-works/pi-coding-agent   # Pi agent

# 2. Setup SSH key (for Perplexity MCP)
ssh-keygen -t ed25519 && ssh-add ~/.ssh/id_ed25519
# Add the public key to https://github.com/settings/keys

# 3. Run the installer
npx @galangryandana/pi-galang-setup

# 4. Start Pi
pi
```

## Uninstall

```bash
rm ~/.pi/agent/mcp.json
# Edit or remove MCP section from AGENTS.md
pi uninstall npm:pi-mcp-adapter
rm -rf ~/projects/perplexity-pro-mcp
```

## License

MIT
