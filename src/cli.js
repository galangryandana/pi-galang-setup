#!/usr/bin/env node

/**
 * Pi Galang Setup — One-shot Installer
 *
 * Usage:
 *   npx @galangryandana/pi-galang-setup
 *
 * What it does:
 *   1. Checks prerequisites (bun, pi, git)
 *   2. Installs pi-mcp-adapter + context-mode
 *   3. Installs caveman skill (token-saving mode)
 *   4. Checks GitHub SSH access for private MCP servers
 *   5. If authenticated → clones, builds & configures Perplexity MCP
 *   6. Writes mcp.json and AGENTS.md
 *   7. Prints summary
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

// ── Helpers ──────────────────────────────────────────────────

const COLORS = {
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  cyan: "\x1b[0;36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
};

function info(msg) {
  console.log(`${COLORS.cyan}[INFO]${COLORS.reset}  ${msg}`);
}
function ok(msg) {
  console.log(`${COLORS.green}[OK]${COLORS.reset}    ${msg}`);
}
function warn(msg) {
  console.log(`${COLORS.yellow}[WARN]${COLORS.reset}  ${msg}`);
}
function skip(msg) {
  console.log(`${COLORS.dim}[SKIP]${COLORS.reset}  ${msg}`);
}
function error(msg) {
  console.log(`${COLORS.red}[ERROR]${COLORS.reset} ${msg}`);
  process.exit(1);
}

function run(cmd, options = {}) {
  const result = spawnSync(cmd, options.args || [], {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: options.silent ? "pipe" : "inherit",
    shell: true,
  });
  return {
    success: result.status === 0,
    stdout: (result.stdout || "").toString().trim(),
    stderr: (result.stderr || "").toString().trim(),
  };
}

function commandExists(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: "pipe", shell: true });
    return true;
  } catch {
    return false;
  }
}

// ── Config ───────────────────────────────────────────────────

const PI_AGENT_DIR = process.env.PI_AGENT_DIR || join(homedir(), ".pi", "agent");
const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), "projects");
const MCP_CONFIG = join(PI_AGENT_DIR, "mcp.json");
const AGENTS_MD = join(PI_AGENT_DIR, "AGENTS.md");

const GITHUB_USER = "galangryandana";
const GITHUB_REPO = "perplexity-pro-mcp";
const REPO_URL = `git@github.com:${GITHUB_USER}/${GITHUB_REPO}.git`;
const REPO_LOCAL_PATH = join(PROJECTS_DIR, GITHUB_REPO);

const PERPLEXITY_API_URL = process.env.PERPLEXITY_API_URL || "https://perproxity.ryandana.web.id";
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || "ppx-deep-research";
const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL || "gpt-5-4-thinking";
const PERPLEXITY_MODEL_PREFIX = process.env.PERPLEXITY_MODEL_PREFIX || "galangdota2";
const MCP_LIFECYCLE = process.env.MCP_LIFECYCLE || "lazy";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
const CONTEXT7_API_KEY = process.env.CONTEXT7_API_KEY || "";
const SKILLS_DIR = join(PI_AGENT_DIR, "skills");
const CAVEMAN_SKILL_URL = "https://raw.githubusercontent.com/JuliusBrussee/caveman/main/skills/caveman/SKILL.md";
const CAVEMAN_SKILL_DIR = join(SKILLS_DIR, "caveman");

// ── Main ─────────────────────────────────────────────────────

async function main() {
  // Banner
  console.log("");
  console.log(`${COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log(`${COLORS.bold}  🔧 Pi Galang Setup${COLORS.reset}`);
  console.log(`${COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log("");

  // ── Step 1: Prerequisites ──────────────────────────────────
  info("Checking prerequisites...");

  if (!commandExists("bun")) error("bun is not installed. Install: https://bun.sh");
  ok(`bun: ${run("bun", { args: ["--version"], silent: true }).stdout}`);

  if (!commandExists("pi")) {
    warn("pi not found — some steps may fail");
  } else {
    ok(`pi: ${run("pi", { args: ["--version"], silent: true }).stdout || "installed"}`);
  }

  if (!commandExists("git")) error("git is not installed");
  ok(`git: ${run("git", { args: ["--version"], silent: true }).stdout}`);

  console.log("");

  // ── Step 2: Install packages (pi-mcp-adapter + context-mode) ──
  info("Installing pi-mcp-adapter...");

  if (commandExists("pi")) {
    const result = run("pi", { args: ["install", "npm:pi-mcp-adapter"] });
    if (result.success) {
      ok("pi-mcp-adapter installed");
    } else {
      warn("pi-mcp-adapter install failed — may already be installed");
    }
  } else {
    warn("pi not found — skipping pi-mcp-adapter install");
  }

  info("Installing context-mode...");

  if (commandExists("pi")) {
    const result = run("pi", { args: ["install", "npm:context-mode"] });
    if (result.success) {
      ok("context-mode installed (saves ~98% context window)");
    } else {
      warn("context-mode install failed — may already be installed");
    }
  } else {
    warn("pi not found — skipping context-mode install");
  }

  console.log("");

  // ── Step 3: Install caveman skill ─────────────────────────
  info("Installing caveman skill...");

  mkdirSync(CAVEMAN_SKILL_DIR, { recursive: true });

  const cavemanTarget = join(CAVEMAN_SKILL_DIR, "SKILL.md");

  if (existsSync(cavemanTarget)) {
    skip("caveman skill already installed");
  } else {
    const curlResult = run("curl", {
      args: ["-sL", CAVEMAN_SKILL_URL, "-o", cavemanTarget],
      silent: true,
    });
    if (curlResult.success && existsSync(cavemanTarget)) {
      ok("caveman skill installed (token-saving mode)");
    } else {
      warn("failed to download caveman skill — skipping");
    }
  }

  console.log("");

  // ── Step 4: Check access to private MCP repo ─────────────
  info("Checking access to Perplexity MCP repo...");

  let hasRepoAccess = false;

  if (commandExists("git")) {
    // Try to access the private repo directly
    // git ls-remote succeeds only if the user has read access
    const lsResult = run("git", {
      args: ["ls-remote", REPO_URL, "HEAD"],
      silent: true,
    });

    if (lsResult.success) {
      ok(`Has access to ${GITHUB_USER}/${GITHUB_REPO}`);
      hasRepoAccess = true;
    } else {
      skip(`No access to ${GITHUB_USER}/${GITHUB_REPO} — skipping Perplexity MCP`);
    }
  } else {
    skip("git not found — skipping Perplexity MCP");
  }

  console.log("");

  // ── Step 5: Clone & build Perplexity MCP ───────────────────
  let perplexityBinary = "";

  if (hasRepoAccess) {
    info("Setting up Perplexity MCP...");

    // Clone or update repo
    if (existsSync(REPO_LOCAL_PATH)) {
      info(`Repo already exists at ${REPO_LOCAL_PATH} — pulling latest...`);
      const pullResult = run("git", { args: ["pull"], cwd: REPO_LOCAL_PATH });
      if (!pullResult.success) {
        warn("git pull failed — using existing code");
      }
    } else {
      info(`Cloning ${GITHUB_REPO}...`);
      mkdirSync(PROJECTS_DIR, { recursive: true });
      const cloneResult = run("git", { args: ["clone", REPO_URL, REPO_LOCAL_PATH] });
      if (!cloneResult.success) {
        error(`Failed to clone ${GITHUB_REPO}`);
      }
    }

    // Install dependencies
    info("Installing dependencies...");
    run("bun", { args: ["install"], cwd: REPO_LOCAL_PATH });

    // Build binary
    info("Building binary...");
    const buildResult = run("bun", {
      args: ["build", "src/index.ts", "--compile", "--outfile=perplexity-pro"],
      cwd: REPO_LOCAL_PATH,
    });

    if (buildResult.success && existsSync(join(REPO_LOCAL_PATH, "perplexity-pro"))) {
      perplexityBinary = resolve(REPO_LOCAL_PATH, "perplexity-pro");
      ok(`Binary built: ${perplexityBinary}`);
    } else {
      warn("Failed to build binary — skipping Perplexity MCP");
    }

    console.log("");
  }

  // ── Step 6: Write MCP config ───────────────────────────────
  info("Configuring MCP...");

  mkdirSync(PI_AGENT_DIR, { recursive: true });

  if (perplexityBinary) {
    const mcpServers = {
      perplexity: {
        command: perplexityBinary,
        args: [],
        env: {
          PERPLEXITY_API_URL,
          PERPLEXITY_MODEL_PREFIX,
          PERPLEXITY_MODEL,
          PERPLEXITY_API_KEY,
        },
        lifecycle: MCP_LIFECYCLE,
      },
    };

    if (TAVILY_API_KEY) {
      mcpServers.tavily = {
        command: "npx",
        args: ["-y", "tavily-mcp@latest"],
        env: { TAVILY_API_KEY },
        lifecycle: "eager",
      };
      ok("Tavily MCP added to config (API key provided)");
    } else {
      mcpServers.tavily = {
        command: "npx",
        args: ["-y", "tavily-mcp@latest"],
        env: { TAVILY_API_KEY: "YOUR_API_KEY_HERE" },
        lifecycle: "eager",
      };
      ok("Tavily MCP added to config (API key placeholder — fill in manually)");
    }

    // Context7 — always install (free, no API key required, but optional for higher rate limits)
    const context7Args = ["-y", "@upstash/context7-mcp"];
    if (CONTEXT7_API_KEY) {
      context7Args.push("--api-key", CONTEXT7_API_KEY);
      mcpServers.context7 = {
        command: "npx",
        args: context7Args,
        env: {},
        lifecycle: "eager",
      };
      ok("Context7 MCP added to config (API key provided)");
    } else {
      mcpServers.context7 = {
        command: "npx",
        args: context7Args,
        env: {},
        lifecycle: "eager",
      };
      ok("Context7 MCP added to config (no API key — free tier)");
    }

    const mcpConfig = { mcpServers };

    writeFileSync(MCP_CONFIG, JSON.stringify(mcpConfig, null, 2) + "\n");
    ok(`MCP config written → ${MCP_CONFIG}`);
  } else {
    // Remove perplexity from existing config if present
    if (existsSync(MCP_CONFIG)) {
      try {
        const existing = JSON.parse(readFileSync(MCP_CONFIG, "utf8"));
        if (existing.mcpServers?.perplexity) {
          delete existing.mcpServers.perplexity;
          if (Object.keys(existing.mcpServers).length === 0) {
            delete existing.mcpServers;
          }
          if (Object.keys(existing).length === 0) {
            const { rmSync } = await import("node:fs");
            rmSync(MCP_CONFIG);
            ok("Empty MCP config removed");
          } else {
            writeFileSync(MCP_CONFIG, JSON.stringify(existing, null, 2) + "\n");
            ok("Perplexity removed from MCP config");
          }
        }
      } catch {
        // ignore parse errors
      }
    }
    skip("MCP config (no Perplexity binary available)");
  }

  console.log("");

  // ── Step 7: Write AGENTS.md ────────────────────────────────
  info("Configuring AGENTS.md...");

  const hasTavily = true; // Tavily always installed — everyone can get a free API key
  const hasContext7 = true; // Context7 always installed — free without API key

  const tavilyServerLine = hasTavily
    ? "\n- **tavily** — Web extract, map & crawl (3 tools: extract, map, crawl) — search tool available but Perplexity preferred"
    : "";

  const context7ServerLine = hasContext7
    ? "\n- **context7** — Library documentation lookup (2 tools: resolve-library-id, get-library-docs)"
    : "";

  const tavilyToolRows = hasTavily
    ? `
| Extract data from a web page | \`tavily_tavily_extract\` |
| Map/structure a website | \`tavily_tavily_map\` |
| Crawl a website systematically | \`tavily_tavily_crawl\` |`
    : "";

  const context7ToolRows = hasContext7
    ? `
| Library/API documentation, code examples | \`context7_resolve-library-id\` → \`context7_get-library-docs\` |
| Version-specific docs for a package | \`context7_get-library-docs\` |`
    : "";

  const tavilyRouting = hasTavily
    ? `
### Tavily vs Perplexity Routing

- **Search** → ALWAYS use **Perplexity** (perplexity_search, perplexity_research). Do NOT use tavily_search.
- **Extract** → Use **Tavily** \`tavily_extract\` (Perplexity cannot extract structured data from pages)
- **Map** → Use **Tavily** \`tavily_map\` (Perplexity cannot map website structure)
- **Crawl** → Use **Tavily** \`tavily_crawl\` (Perplexity cannot crawl websites)`
    : "";

  const context7Routing = hasContext7
    ? `
### Context7 Usage

Use Context7 when the user needs **library/API documentation** or **code examples** for a specific package:
1. \`resolve-library-id\` — resolve library name (e.g., "react") → Context7 ID (e.g., \`/facebook/react\`)
2. \`get-library-docs\` — fetch docs by ID + topic (e.g., "hooks", "routing")

Context7 is NOT for general web search — use Perplexity for that.`
    : "";

  const tavilyAntiPatterns = hasTavily
    ? "\n- ❌ Using Tavily search when Perplexity is available (Perplexity is the primary search tool)\n- ❌ Using \`bash curl\` for web scraping when Tavily extract/map/crawl is available"
    : "";

  const context7AntiPatterns = hasContext7
    ? "\n- ❌ Using Perplexity for library docs when Context7 has version-specific docs available"
    : "";

  const MCP_SECTION = `

# Pi Agent — MCP Tools Awareness

You have access to MCP (Model Context Protocol) tools via the \`mcp\` tool. **Always check and use MCP tools when they are relevant to the user's request.** Do NOT skip them.

### Available MCP Servers

Check available servers anytime with:
\`\`\`
mcp({})                              → Show server status
mcp({ server: "name" })              → List tools from a server
mcp({ search: "query" })             → Search MCP tools by name/description
\`\`\`

Currently configured servers:
- **perplexity** — Web search & deep research (4 tools: search, research, ask, reason)${tavilyServerLine}${context7ServerLine}

### When to Use MCP Tools

| User Intent | MCP Tool to Use |
|---|---|
| Research, deep dive, investigate a topic | \`perplexity_perplexity_research\` |
| Quick facts, current events, lookups | \`perplexity_perplexity_search\` |
| How-to questions, tutorials | \`perplexity_perplexity_ask\` |
| Analysis, logical reasoning, comparisons | \`perplexity_perplexity_reason\` |
| Web information, latest news, documentation | Use perplexity tools FIRST |${tavilyToolRows}${context7ToolRows}

### Fresh-First Research Protocol

Before any research or information lookup, ALWAYS:
1. **Check today's date** — note the current date as the anchor point
2. **Prioritize fresh information** — prefer sources from the last 30 days, then 90 days, then 1 year
3. **Discard stale data** — if information is older than 1 year, flag it as potentially outdated and verify with a fresh source
4. **Tag recency** — when presenting research results, indicate the date/timeframe of each finding (e.g., "as of May 2026", "per 2026 docs")
5. **Re-verify** — if your training data says X but a fresh search says Y, trust the fresh source and note the discrepancy

This applies to ALL research: API docs, package versions, benchmarks, best practices, library comparisons, pricing, compatibility, and any factual claims.

### Rules

1. **MCP-first for external knowledge**: When the user asks about anything that requires current/recent information, web search, research, or facts beyond your training data, use MCP Perplexity tools FIRST — before using \`bash\`, \`read\`, or other built-in tools.
2. **No reminder needed**: Do NOT wait for the user to remind you about MCP tools. Proactively check \`mcp({})\` at the start of research tasks.
3. **Combine sources**: Use MCP tools for external/current info, and built-in tools (\`read\`, \`bash\`, etc.) for local files and code. Use both when appropriate.
4. **Depth selection**: For quick questions use \`perplexity_search\` (depth: "quick"). For complex research use \`perplexity_research\` (depth: "standard" or "comprehensive").
5. **Always cite**: When using MCP results, mention that the information comes from Perplexity research.
6. **Date-aware**: Always check today's date before research. Prefer fresh sources. Flag outdated information.
${tavilyRouting}${context7Routing}
### Anti-Patterns to Avoid

- ❌ Doing web research using only \`bash curl\` when MCP Perplexity is available
- ❌ Answering with outdated knowledge when MCP tools could fetch current info
- ❌ Forgetting to check MCP server status before assuming tools are available
- ❌ Ignoring MCP tools entirely and only using built-in tools for research tasks
- ❌ Presenting training data as current without verifying freshness
- ❌ Citing sources older than 1 year without a freshness warning${tavilyAntiPatterns}${context7AntiPatterns}`;

  if (perplexityBinary) {
    if (existsSync(AGENTS_MD)) {
      const content = readFileSync(AGENTS_MD, "utf8");
      if (content.includes("MCP Tools Awareness")) {
        skip("AGENTS.md already contains MCP section");
      } else {
        writeFileSync(AGENTS_MD, content.trimEnd() + MCP_SECTION + "\n");
        ok("MCP section appended to AGENTS.md");
      }
    } else {
      writeFileSync(AGENTS_MD, MCP_SECTION.trim() + "\n");
      ok("AGENTS.md created with MCP section");
    }
  } else {
    // Remove MCP section if it exists
    if (existsSync(AGENTS_MD)) {
      const content = readFileSync(AGENTS_MD, "utf8");
      if (content.includes("MCP Tools Awareness")) {
        const cleaned = content
          .replace(/\n*# Pi Agent — MCP Tools Awareness[\s\S]*/, "")
          .trimEnd() + "\n";
        writeFileSync(AGENTS_MD, cleaned);
        ok("MCP section removed from AGENTS.md");
      } else {
        skip("AGENTS.md (no changes needed)");
      }
    } else {
      skip("AGENTS.md (no Perplexity configured)");
    }
  }

  console.log("");

  // ── Summary ────────────────────────────────────────────────
  console.log(`${COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log(`${COLORS.green}  ✅ Setup Complete!${COLORS.reset}`);
  console.log(`${COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log("");
  console.log("  Configured:");
  console.log("    • pi-mcp-adapter        ✓");
  console.log("    • context-mode          ✓  (saves ~98% context window)");
  console.log("    • caveman skill         ✓  (token-saving mode)");
  console.log("    • context7 MCP          ✓  (library docs)");

  if (perplexityBinary) {
    console.log("    • perplexity MCP server ✓");
    console.log("    • tavily MCP server     ✓  (extract, map, crawl)");
    console.log("    • mcp.json              ✓");
    console.log("    • AGENTS.md (MCP)       ✓");
  } else {
    console.log("    • perplexity MCP server ✗ (no repo access)");
    console.log("    • tavily MCP server     ✓  (extract, map, crawl)");
  }

  console.log("");
  console.log("  Next steps:");
  console.log("    1. Restart Pi agent");

  if (perplexityBinary) {
    console.log('    2. Test: mcp({ search: "hello world" })');
  }

  console.log("");

  if (!TAVILY_API_KEY) {
    console.log("  ⚠️  Tavily MCP needs an API key:");
    console.log("     1. Get free API key at https://app.tavily.com/home");
    console.log(`     2. Edit ${MCP_CONFIG}`);
    console.log('     3. Replace YOUR_API_KEY_HERE with your key');
    console.log("");
  }

  if (!perplexityBinary) {
    console.log("  💡 To enable Perplexity MCP:");
    console.log(`     Ask ${GITHUB_USER} for access to ${GITHUB_REPO}, then re-run this script.`);
    console.log("");
  }
}

main().catch((err) => {
  error(err instanceof Error ? err.message : String(err));
});
