import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const harnessRoot = path.join(workspaceRoot, ".harness");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalize(value) {
  return String(value ?? "").toLocaleLowerCase("ru-RU");
}

function unique(values) {
  return [...new Set(values)];
}

function includesAny(text, signals) {
  return signals.some((signal) => text.includes(normalize(signal)));
}

function runBounded(command, args, options = {}) {
  try {
    const output = execFileSync(command, args, {
      cwd: options.cwd,
      encoding: "utf8",
      timeout: options.timeoutMs ?? 1200,
      maxBuffer: options.maxBuffer ?? 512_000,
      stdio: ["ignore", "pipe", "pipe"]
    });
    return { ok: true, output: output.trim(), error: null };
  } catch (error) {
    return {
      ok: false,
      output: String(error.stdout ?? "").trim(),
      error: String(error.stderr ?? error.message ?? "command failed").trim()
    };
  }
}

export function createRouter(options = {}) {
  const config = readJson(options.configPath ?? path.join(harnessRoot, "config/harness.json"));
  const policy = readJson(options.policyPath ?? path.join(harnessRoot, "config/skills-policy.json"));
  const projectPolicy = readJson(options.projectPolicyPath ?? path.join(harnessRoot, "config/project-skills.json"));
  const lock = readJson(options.lockPath ?? path.join(harnessRoot, "catalogs/aas.lock.json"));
  const aasRoot = path.resolve(options.aasRoot ?? process.env.PEAKTALK_AAS_ROOT ?? path.join(harnessRoot, "vendor/aas"));
  const runtimeRoot = path.resolve(options.runtimeRoot ?? path.join(harnessRoot, "runtime"));
  const indexPath = path.join(aasRoot, lock.indexPath);

  function catalog() {
    if (!fs.existsSync(indexPath)) return [];
    const data = readJson(indexPath);
    return Array.isArray(data) ? data : data.skills ?? [];
  }

  function catalogById() {
    return new Map(catalog().map((skill) => [skill.id, skill]));
  }

  function detectMode(text) {
    if (/(review|ревью|аудит|проверь\s+(код|diff|измен)|code review|код-ревью)/u.test(text)) return "review";
    if (/(debug|diagnos|root cause|bug|ошиб|сломал|не работает|регресс|исправь дефект)/u.test(text)) return "debug";
    if (/(\btest\b|\bqa\b|playwright|e2e|unit test|integration test|тест(?:ы|ирование)?|покрыти[ея])/u.test(text)) return "test";
    if (/(plan|architect|design decision|prd|roadmap|спроект|архитект|продуктов.*решен|обсуд|соглас|выбрать|решить)/u.test(text)) return "plan";
    return "implement";
  }

  function detectDomains(text, paths = []) {
    const taskText = normalize(text);
    const pathText = normalize(paths.join(" "));
    const joined = `${taskText} ${pathText}`;
    const hasHarnessScope = /(agent harness|harness|skill router|task contract|completion gate|codegraph|mcp server|bootstrap|doctor|eval fixture|\.harness|\.agents\/skills|\.codex\/config)/u.test(joined);
    const hasProductSignal = /(product|prd|roadmap|position|pricing|onboarding|paywall|persona|scenario|продукт|позиционир|онбординг|пейвол|сценари)/u.test(taskText);
    const hasCopySignal = /(copy|microcopy|headline|cta|tone|текст|копирайт|заголовок|кнопк|формулировк)/u.test(taskText);
    const hasArchitectureSignal = /(architect|adr|system design|migration strategy|migration plan|migration.*strategy|архитект|системн.*дизайн|план миграц|стратег.*миграц)/u.test(taskText);
    const hasUiSignal = /(\bui\b|\bux\b|layout|responsive|visual|screen|page|component|mobile|desktop|интерфейс|экран|дизайн|верст|адаптив)/u.test(taskText);
    const hasFrontendPath = /(frontend\/(src\/)?(app|components|hooks|lib)|\.(tsx|jsx|css|scss)$)/u.test(pathText);
    const hasFrontendSignal = /(frontend|next\.?js|react|tailwind|zustand|tanstack|фронтенд)/u.test(joined);
    const hasBackendPath = /(^|\s)backend\//u.test(pathText);
    const hasBackendSignal = /(backend|fastapi|python|sqlalchemy|celery|бэкенд)/u.test(joined);
    const hasApiSignal = /(^|[^a-zа-я])(api|endpoint|webhook)([^a-zа-я]|$)|контракт.*api/u.test(taskText);
    const hasApiPath = /backend\/app\/routers\//u.test(pathText);
    const hasDatabaseSignal = /(database|postgres|sql|alembic|schema|migration|rls|таблиц|баз.*данн)/u.test(joined);
    const hasAuthSignal = /(auth|login|register|session|jwt|oauth|logto|supabase auth|авторизац|аутентиф)/u.test(joined);
    const hasSecuritySignal = /(security|secret|permission|authorization|vulnerab|idor|безопас|секрет|доступ)/u.test(joined);
    const hasDeploySignal = /(deploy|production|docker|nginx|ci\/cd|workflow|infra|депло|продакшн)/u.test(joined);
    const hasCodeSignal = /(\bcode\b|\bdiff\b|refactor|implement|review|bug|код|рефактор|реализ|исправ)/u.test(taskText) || /\.(mjs|js|ts|tsx|py|css|json)$/u.test(pathText);

    const domains = [];
    if (hasHarnessScope) domains.push("harness");
    if (hasProductSignal) domains.push("product");
    if (hasCopySignal) domains.push("copy");
    if (hasArchitectureSignal) domains.push("architecture");
    if (hasUiSignal || (hasFrontendPath && /\b(page|component|layout|screen)\b/u.test(taskText))) domains.push("ui");
    if (hasFrontendSignal || hasFrontendPath) domains.push("frontend");
    if (hasBackendSignal || hasBackendPath) domains.push("backend");
    if (hasApiSignal || hasApiPath) domains.push("api");
    if (hasDatabaseSignal) domains.push("database");
    if (hasAuthSignal) domains.push("auth");
    if (hasSecuritySignal) domains.push("security");
    if (hasDeploySignal) domains.push("deploy");
    if (hasCodeSignal) domains.push("code");

    // Harness vocabulary is not evidence of product API/UI work. Keep explicit
    // technical signals, but discard accidental matches from generic prose.
    if (hasHarnessScope) {
      return unique(domains.filter((domain) => ["harness", "architecture", "product", "database", "auth", "security", "deploy", "code"].includes(domain)));
    }
    return unique(domains);
  }

  function classifyRisk(text, domains) {
    if (includesAny(text, config.highRiskSignals) || domains.some((d) => ["auth", "security", "deploy"].includes(d))) return "high";
    if (includesAny(text, config.mediumRiskSignals) || domains.some((d) => ["frontend", "backend", "api", "database", "ui"].includes(d))) return "medium";
    return "low";
  }

  function decisionGates(text, mode, domains) {
    const changeVerb = /(add|remove|change|replace|choose|decide|launch|new|добав|убра|измен|замен|выб|реш|запус|нов)/u.test(text);
    const product = domains.includes("product") && (mode === "plan" || changeVerb);
    const costlyArchitecture = domains.includes("architecture") && (
      includesAny(text, ["migration", "replace", "rewrite", "public api", "data model", "auth", "billing", "миграц", "перепис", "замен", "модель данных"]) || changeVerb
    );
    const externalOrDestructive = /(deploy|publish|production|send|delete|drop|truncate|force push|депло|опубликов|отправ|удал|дроп)/u.test(text);
    return [
      product ? { id: "product", required: true, approval: config.decisionGates.product.approval, brief: config.decisionGates.product.brief } : null,
      costlyArchitecture ? { id: "costlyArchitecture", required: true, approval: config.decisionGates.costlyArchitecture.approval, brief: config.decisionGates.costlyArchitecture.brief } : null,
      externalOrDestructive ? { id: "externalOrDestructive", required: true, approval: config.decisionGates.externalOrDestructive.approval } : null
    ].filter(Boolean);
  }

  function evidenceFor(domains, risk) {
    const profiles = [];
    for (const domain of domains) {
      if (config.evidenceProfiles[domain]) profiles.push(...config.evidenceProfiles[domain]);
    }
    if (profiles.length === 0) profiles.push(...config.evidenceProfiles.default);
    if (risk === "high") profiles.push("explicit risk review and rollback or recovery path");
    return unique(profiles);
  }

  function checksFor(domains, risk) {
    const checks = [];
    for (const domain of domains) {
      if (config.checkProfiles[domain]) checks.push(...config.checkProfiles[domain]);
    }
    if (checks.length === 0) checks.push(...config.checkProfiles.default);
    if (risk === "high") checks.push(...config.checkProfiles.highRisk);
    return unique(checks);
  }

  function contextFor(domains, paths) {
    const keys = new Set(["spec"]);
    if (domains.includes("harness")) keys.add("harness");
    if (domains.includes("product")) keys.add("product");
    if (domains.some((domain) => ["architecture", "frontend", "backend", "api", "database", "auth", "security"].includes(domain))) keys.add("architecture");
    if (domains.includes("deploy")) keys.add("operations");
    const documents = unique([...keys].flatMap((key) => config.context?.documents?.[key] ?? []));
    return {
      strategy: "minimal-first",
      documents: documents.map((document) => ({ path: document, exists: fs.existsSync(path.join(workspaceRoot, document)) })),
      codeNavigation: {
        providerOrder: config.context?.codeNavigation?.providerOrder ?? ["mcp", "codegraph-cli", "rg"],
        timeoutMs: config.context?.codeNavigation?.timeoutMs ?? 1200,
        maxFiles: config.context?.codeNavigation?.maxFiles ?? 5,
        paths: paths.length ? paths : ["."],
        query: "Use the task wording and affected paths; avoid generic symbol names."
      }
    };
  }

  function scoreSkill(entry, text, mode, domains) {
    let score = 0;
    const reasons = [];
    if ((entry.modes ?? []).includes(mode)) {
      score += 3;
      reasons.push(`mode:${mode}`);
    }
    const matchedDomains = (entry.domains ?? []).filter((domain) => domains.includes(domain));
    if (matchedDomains.length) {
      score += matchedDomains.length * 5;
      reasons.push(`domain:${matchedDomains.join(",")}`);
    }
    const matchedKeywords = (entry.keywords ?? []).filter((keyword) => text.includes(normalize(keyword)));
    if (matchedKeywords.length) {
      score += Math.min(8, matchedKeywords.length * 4);
      reasons.push(`signal:${matchedKeywords.slice(0, 2).join(",")}`);
    }
    return { score, reasons };
  }

  function projectSkillCandidates(text, mode, domains, gates = []) {
    return projectPolicy.skills
      .map((entry) => ({ entry, ...scoreSkill(entry, text, mode, domains) }))
      .filter((candidate) => candidate.score >= 7)
      .sort((a, b) => {
        const aDecision = a.entry.id === "product-decision" && gates.some((gate) => ["product", "costlyArchitecture"].includes(gate.id));
        const bDecision = b.entry.id === "product-decision" && gates.some((gate) => ["product", "costlyArchitecture"].includes(gate.id));
        return Number(bDecision) - Number(aDecision) || b.score - a.score || a.entry.id.localeCompare(b.entry.id);
      });
  }

  function systemSkillCandidates(domains) {
    const ids = [];
    for (const domain of ["ui", "frontend", "backend", "deploy"]) {
      if (domains.includes(domain) && projectPolicy.trustedSystemSkills?.[domain]) ids.push(projectPolicy.trustedSystemSkills[domain]);
    }
    return unique(ids).slice(0, 1);
  }

  function routeTask(input) {
    const task = String(input.task ?? "").trim();
    if (!task) throw new Error("task is required");
    const paths = Array.isArray(input.paths) ? input.paths.map(String) : [];
    const text = normalize(`${task} ${paths.join(" ")}`);
    const mode = input.mode ?? detectMode(text);
    if (!["plan", "implement", "debug", "test", "review"].includes(mode)) throw new Error(`unsupported mode: ${mode}`);
    const domains = detectDomains(text, paths);
    const gates = decisionGates(text, mode, domains);
    const baseRisk = classifyRisk(text, domains);
    const risk = gates.some((gate) => gate.id === "product" || gate.id === "costlyArchitecture") ? "high" : baseRisk;
    const byId = catalogById();
    const selectedSkills = [];
    const projectCandidates = projectSkillCandidates(text, mode, domains, gates);
    if (projectCandidates[0]) {
      const { entry, score, reasons } = projectCandidates[0];
      selectedSkills.push({ id: entry.id, source: "project", score, reasons, available: true, scriptsAllowed: false });
    }
    for (const id of systemSkillCandidates(domains)) {
      selectedSkills.push({ id, source: "system", score: null, reasons: [`domain:${domains.find((domain) => projectPolicy.trustedSystemSkills?.[domain] === id)}`], available: true, scriptsAllowed: false });
    }
    const aasSkills = policy.approved
      .map((entry) => ({ entry, ...scoreSkill(entry, text, mode, domains) }))
      .filter((candidate) => candidate.score >= 7)
      .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
      .filter(({ entry }) => !selectedSkills.some((skill) => skill.id === entry.id))
      .slice(0, config.maxAasSkills ?? 1)
      .map(({ entry, score, reasons }) => {
        const metadata = byId.get(entry.id);
        return {
          id: entry.id,
          source: "aas",
          score,
          reasons,
          available: Boolean(metadata),
          risk: metadata?.risk ?? "catalog-unavailable",
          path: metadata ? path.join(aasRoot, metadata.path, "SKILL.md") : null,
          scriptsAllowed: false
        };
      });
    selectedSkills.push(...aasSkills);

    const context = contextFor(domains, paths);
    return {
      task,
      classification: { mode, domains, risk },
      autonomy: gates.length ? "pause-at-decision-gate" : risk === "high" ? "controlled-with-explicit-risk-review" : "autonomous",
      decisionGates: gates,
      selectedSkills: selectedSkills.slice(0, config.maxSelectedSkills),
      context,
      requiredContext: context.documents,
      coreProtocol: {
        beforeWork: ["inspect current state", "state acceptance criteria", "identify blast radius and risk"],
        productDecisionStyle: "critical, explanatory, options-first, realistic; recommendation must include trade-offs and non-goals",
        completionRule: "fresh evidence is required; a plausible narrative is not evidence"
      },
      requiredEvidence: evidenceFor(domains, risk),
      requiredCheckIds: checksFor(domains, risk),
      warnings: selectedSkills.some((skill) => !skill.available)
        ? ["Pinned AAS catalog is unavailable. Run ./.harness/scripts/setup-aas.sh before loading skill content."]
        : []
    };
  }

  function codeContext(input) {
    const query = String(input.query ?? "").trim();
    if (!query) throw new Error("query is required");
    const timeoutMs = Math.max(250, Math.min(Number(input.timeoutMs ?? config.context?.codeNavigation?.timeoutMs ?? 1200), 5000));
    const failures = [];
    if (typeof options.mcpExplore === "function") {
      try {
        const result = options.mcpExplore({ query, paths: input.paths ?? [] });
        if (result) return { provider: "mcp", query, result, failures };
      } catch (error) {
        failures.push({ provider: "mcp", error: error.message });
      }
    } else {
      failures.push({ provider: "mcp", error: "MCP connector is not injectable into the local CLI process" });
    }
    const cli = runBounded(options.codegraphBin ?? process.env.PEAKTALK_CODEGRAPH_BIN ?? "codegraph", ["explore", "--path", workspaceRoot, "--max-files", String(config.context?.codeNavigation?.maxFiles ?? 5), query], { cwd: workspaceRoot, timeoutMs });
    if (cli.ok && cli.output) return { provider: "codegraph-cli", query, result: cli.output, failures };
    failures.push({ provider: "codegraph-cli", error: cli.error || "empty result" });
    const searchPaths = Array.isArray(input.paths) && input.paths.length ? input.paths : ["."];
    const rgArgs = ["-n", "-S", "--hidden", "--glob", "!.git", "--glob", "!.harness/vendor/**", "--glob", "!.codegraph/**", "--", query, ...searchPaths];
    const rg = runBounded(options.rgBin ?? "rg", rgArgs, { cwd: workspaceRoot, timeoutMs });
    if (rg.ok) return { provider: "rg", query, result: rg.output, failures };
    failures.push({ provider: "rg", error: rg.error || "empty result" });
    return { provider: "none", query, result: "", failures };
  }

  function codegraphHealth(input = {}) {
    const timeoutMs = Math.max(250, Math.min(Number(input.timeoutMs ?? config.context?.codeNavigation?.timeoutMs ?? 1200), 5000));
    const binary = options.codegraphBin ?? process.env.PEAKTALK_CODEGRAPH_BIN ?? "codegraph";
    const statusResult = runBounded(binary, ["status", workspaceRoot], { cwd: workspaceRoot, timeoutMs });
    const smokeResult = statusResult.ok
      ? runBounded(binary, ["explore", "--path", workspaceRoot, "--max-files", "2", "routeTask"], { cwd: workspaceRoot, timeoutMs })
      : { ok: false, output: "", error: "status failed; semantic smoke was not attempted" };
    const psResult = runBounded("ps", ["-axo", "pid=,command="], { cwd: workspaceRoot, timeoutMs: 500 });
    const workspaceMcpProcesses = psResult.ok
      ? psResult.output.split("\n").filter((line) => line.includes("codegraph") && line.includes("serve --mcp") && line.includes(workspaceRoot)).length
      : null;
    return {
      ok: statusResult.ok && /Index is up to date/u.test(statusResult.output) && smokeResult.ok && Boolean(smokeResult.output) && (workspaceMcpProcesses === null || workspaceMcpProcesses <= 1),
      binary,
      timeoutMs,
      status: { ok: statusResult.ok && /Index is up to date/u.test(statusResult.output), output: statusResult.output, error: statusResult.error },
      semanticSmoke: { ok: smokeResult.ok && Boolean(smokeResult.output), output: smokeResult.output.slice(0, 1000), error: smokeResult.error },
      mcpProcesses: { workspaceScoped: workspaceMcpProcesses, duplicate: workspaceMcpProcesses !== null && workspaceMcpProcesses > 1 },
      fallbackOrder: ["mcp", "codegraph-cli", "rg"]
    };
  }

  function searchSkills(input) {
    const query = normalize(input.query).trim();
    if (!query) throw new Error("query is required");
    const limit = Math.max(1, Math.min(Number(input.limit ?? 10), 25));
    const includeUnapproved = input.includeUnapproved === true;
    const approved = new Set(policy.approved.map((entry) => entry.id));
    const terms = query.split(/\s+/u).filter(Boolean);
    return catalog()
      .filter((skill) => includeUnapproved || approved.has(skill.id))
      .map((skill) => {
        const haystack = normalize(`${skill.id} ${skill.name} ${skill.description} ${skill.category ?? ""}`);
        const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
        return { skill, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id))
      .slice(0, limit)
      .map(({ skill, score }) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        category: skill.category ?? null,
        risk: skill.risk ?? "unknown",
        approved: approved.has(skill.id),
        contentLoadable: approved.has(skill.id) && !policy.blockedCatalogRisks.includes(skill.risk),
        score
      }));
  }

  function skillMetadata(id) {
    const skill = catalogById().get(id);
    if (!skill) throw new Error(`unknown skill: ${id}`);
    const approvedEntry = policy.approved.find((entry) => entry.id === id) ?? null;
    return { skill, approvedEntry };
  }

  function safeSkillFile(id, relativeFile) {
    const { skill, approvedEntry } = skillMetadata(id);
    if (!approvedEntry) throw new Error(`skill is not approved for content loading: ${id}`);
    if (policy.blockedCatalogRisks.includes(skill.risk)) throw new Error(`skill risk is blocked: ${skill.risk}`);
    const skillDir = fs.realpathSync(path.join(aasRoot, skill.path));
    const target = fs.realpathSync(path.join(skillDir, relativeFile));
    if (target !== skillDir && !target.startsWith(`${skillDir}${path.sep}`)) throw new Error("path escapes skill directory");
    const stat = fs.statSync(target);
    if (!stat.isFile()) throw new Error("requested skill resource is not a file");
    if (stat.size > 40_000) throw new Error("requested skill resource exceeds 40 KB disclosure limit");
    return { skill, approvedEntry, target, stat };
  }

  function inspectSkill(input) {
    const id = String(input.id ?? "");
    const { skill, approvedEntry } = skillMetadata(id);
    const result = {
      id,
      approved: Boolean(approvedEntry),
      metadata: skill,
      policy: approvedEntry,
      scriptsAllowed: false,
      warning: approvedEntry ? null : "Metadata only. Unapproved skill content is denied by policy."
    };
    if (input.includeContent === true) {
      const { target } = safeSkillFile(id, "SKILL.md");
      result.content = fs.readFileSync(target, "utf8");
    }
    return result;
  }

  function readSkillReference(input) {
    const id = String(input.id ?? "");
    const relativeFile = String(input.path ?? "");
    if (!relativeFile) throw new Error("path is required");
    const { target } = safeSkillFile(id, relativeFile);
    return { id, path: relativeFile, content: fs.readFileSync(target, "utf8") };
  }

  function status() {
    const indexExists = fs.existsSync(indexPath);
    const actualSha256 = indexExists ? crypto.createHash("sha256").update(fs.readFileSync(indexPath)).digest("hex") : null;
    let actualCommit = null;
    let gitTreeClean = false;
    const commitResult = runBounded("git", ["-C", aasRoot, "rev-parse", "HEAD"], { cwd: workspaceRoot, timeoutMs: 700 });
    const treeResult = runBounded("git", ["-C", aasRoot, "status", "--porcelain=v1", "-uno"], { cwd: workspaceRoot, timeoutMs: 1200 });
    if (commitResult.ok) actualCommit = commitResult.output;
    gitTreeClean = treeResult.ok && treeResult.output === "";
    return {
      workspaceRoot,
      operatingModel: config.operatingModel,
      catalog: {
        root: aasRoot,
        commit: lock.commit,
        actualCommit,
        gitTreeClean,
        indexExists,
        integrity: actualSha256 === lock.indexSha256 && actualCommit === lock.commit && gitTreeClean,
        expectedSha256: lock.indexSha256,
        actualSha256,
        skillCount: indexExists ? catalog().length : 0
      },
      policy: {
        default: policy.default,
        approvedSkillCount: policy.approved.length,
        allowSkillScripts: policy.allowSkillScripts,
        maxSelectedSkills: config.maxSelectedSkills
      },
      codegraph: {
        registration: "global",
        projectRegistration: "removed; restart Codex to clear already spawned duplicate processes",
        fallbackOrder: config.context?.codeNavigation?.providerOrder ?? ["mcp", "codegraph-cli", "rg"]
      }
    };
  }

  function auditApprovedSkills() {
    const byId = catalogById();
    const findings = [];
    for (const entry of policy.approved) {
      const skill = byId.get(entry.id);
      if (!skill) {
        findings.push({ id: entry.id, severity: "error", message: "missing from pinned catalog" });
        continue;
      }
      if (policy.blockedCatalogRisks.includes(skill.risk)) findings.push({ id: entry.id, severity: "error", message: `blocked risk: ${skill.risk}` });
      const skillDir = path.join(aasRoot, skill.path);
      const files = fs.readdirSync(skillDir, { recursive: true, withFileTypes: true });
      const executableFiles = files.filter((file) => file.isFile() && /\.(sh|bash|zsh|py|js|mjs|cjs|ts|exe|bat|ps1)$/iu.test(file.name));
      if (executableFiles.length) findings.push({ id: entry.id, severity: "error", message: "contains executable files while scripts are disabled" });
      const skillMd = path.join(skillDir, "SKILL.md");
      if (!fs.existsSync(skillMd)) findings.push({ id: entry.id, severity: "error", message: "SKILL.md missing" });
    }
    return {
      ok: findings.every((finding) => finding.severity !== "error"),
      approvedSkillCount: policy.approved.length,
      findings
    };
  }

  function recordOutcome(input) {
    const taskId = String(input.taskId ?? "").trim();
    if (!/^[a-zA-Z0-9._-]{1,100}$/u.test(taskId)) throw new Error("taskId must be 1-100 safe filename characters");
    fs.mkdirSync(runtimeRoot, { recursive: true });
    const record = {
      schemaVersion: 1,
      recordedAt: new Date().toISOString(),
      taskId,
      result: input.result ?? "unknown",
      checks: Array.isArray(input.checks) ? input.checks : [],
      notes: String(input.notes ?? "")
    };
    fs.appendFileSync(path.join(runtimeRoot, "outcomes.jsonl"), `${JSON.stringify(record)}\n`, { mode: 0o600 });
    return record;
  }

  function validateTaskId(value) {
    const taskId = String(value ?? "").trim();
    if (!/^[a-zA-Z0-9._-]{1,100}$/u.test(taskId)) throw new Error("taskId must be 1-100 safe filename characters");
    return taskId;
  }

  function taskPath(taskId) {
    return path.join(runtimeRoot, "tasks", `${validateTaskId(taskId)}.json`);
  }

  function readTask(taskId) {
    const file = taskPath(taskId);
    if (!fs.existsSync(file)) throw new Error(`task contract not found: ${taskId}`);
    return readJson(file);
  }

  function writeTask(contract) {
    const file = taskPath(contract.taskId);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(contract, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temporary, file);
    return contract;
  }

  function startTask(input) {
    const taskId = validateTaskId(input.taskId);
    const file = taskPath(taskId);
    if (fs.existsSync(file)) throw new Error(`task contract already exists: ${taskId}`);
    const acceptanceCriteria = Array.isArray(input.acceptanceCriteria)
      ? input.acceptanceCriteria.map(String).map((item) => item.trim()).filter(Boolean)
      : [];
    if (acceptanceCriteria.length === 0) throw new Error("at least one acceptance criterion is required");
    const route = routeTask({ task: input.task, mode: input.mode, paths: input.paths });
    const now = new Date().toISOString();
    const initialStatus = route.decisionGates.length ? "awaiting-decision" : "ready";
    return writeTask({
      schemaVersion: 1,
      taskId,
      task: route.task,
      status: initialStatus,
      statusHistory: [
        { status: "draft", recordedAt: now },
        { status: initialStatus, recordedAt: now }
      ],
      acceptanceCriteria,
      nonGoals: Array.isArray(input.nonGoals) ? input.nonGoals.map(String) : [],
      paths: Array.isArray(input.paths) ? input.paths.map(String) : [],
      route,
      decisions: [],
      checks: [],
      createdAt: now,
      updatedAt: now
    });
  }

  function beginTask(input) {
    const contract = readTask(validateTaskId(input.taskId));
    if (contract.status !== "ready") throw new Error(`task cannot begin from status: ${contract.status}`);
    contract.status = "in-progress";
    contract.statusHistory = [...(contract.statusHistory ?? []), { status: "in-progress", recordedAt: new Date().toISOString() }];
    contract.updatedAt = new Date().toISOString();
    return writeTask(contract);
  }

  function getTask(input) {
    return readTask(validateTaskId(input.taskId));
  }

  function recordDecision(input) {
    const contract = readTask(validateTaskId(input.taskId));
    if (["in-progress", "verifying", "complete"].includes(contract.status)) throw new Error(`cannot change decisions from status: ${contract.status}`);
    const gateId = String(input.gateId ?? "");
    if (!contract.route.decisionGates.some((gate) => gate.id === gateId)) throw new Error(`decision gate is not required: ${gateId}`);
    const decisionRef = String(input.decisionRef ?? "").trim();
    if (!decisionRef.startsWith("docs/decisions/")) throw new Error("decisionRef must point under docs/decisions/");
    const absoluteRef = path.resolve(workspaceRoot, decisionRef);
    if (!absoluteRef.startsWith(`${path.join(workspaceRoot, "docs/decisions")}${path.sep}`) || !fs.existsSync(absoluteRef)) {
      throw new Error(`durable decision file does not exist: ${decisionRef}`);
    }
    const decision = String(input.decision ?? "").trim();
    if (!decision) throw new Error("decision is required");
    contract.decisions = contract.decisions.filter((item) => item.gateId !== gateId);
    contract.decisions.push({ gateId, decision, decisionRef, approvedBy: "user", recordedAt: new Date().toISOString() });
    const unresolved = contract.route.decisionGates.filter((gate) => !contract.decisions.some((item) => item.gateId === gate.id));
    contract.status = unresolved.length ? "awaiting-decision" : "ready";
    contract.statusHistory = [...(contract.statusHistory ?? []), { status: contract.status, recordedAt: new Date().toISOString() }];
    contract.updatedAt = new Date().toISOString();
    return writeTask(contract);
  }

  function recordCheck(input) {
    const contract = readTask(validateTaskId(input.taskId));
    if (contract.status === "awaiting-decision") throw new Error("cannot verify before required decisions are recorded");
    const checkId = String(input.checkId ?? "").trim();
    if (!/^[a-zA-Z0-9._-]{1,100}$/u.test(checkId)) throw new Error("checkId must be 1-100 safe characters");
    const result = String(input.result ?? "");
    if (!['pass', 'fail', 'skipped'].includes(result)) throw new Error("result must be pass, fail, or skipped");
    const evidence = String(input.evidence ?? "").trim();
    if (!evidence) throw new Error("evidence is required");
    contract.checks = contract.checks.filter((check) => check.checkId !== checkId);
    contract.checks.push({ checkId, result, evidence, command: input.command ? String(input.command) : null, recordedAt: new Date().toISOString() });
    if (!["in-progress", "verifying"].includes(contract.status)) throw new Error(`cannot record checks from status: ${contract.status}`);
    contract.status = "verifying";
    contract.statusHistory = [...(contract.statusHistory ?? []), { status: "verifying", recordedAt: new Date().toISOString() }];
    contract.updatedAt = new Date().toISOString();
    return writeTask(contract);
  }

  function completeTask(input) {
    const contract = readTask(validateTaskId(input.taskId));
    if (contract.status !== "verifying") throw new Error(`task cannot complete from status: ${contract.status}`);
    const unresolved = contract.route.decisionGates.filter((gate) => !contract.decisions.some((item) => item.gateId === gate.id));
    if (unresolved.length) throw new Error(`unresolved decision gates: ${unresolved.map((gate) => gate.id).join(", ")}`);
    const failed = contract.checks.filter((check) => check.result === "fail");
    if (failed.length) throw new Error(`failed checks: ${failed.map((check) => check.checkId).join(", ")}`);
    const missing = contract.route.requiredCheckIds.filter((required) => !contract.checks.some((check) => check.checkId === required && check.result === "pass"));
    if (missing.length) throw new Error(`missing passing checks: ${missing.join(", ")}`);
    contract.status = "complete";
    contract.statusHistory = [...(contract.statusHistory ?? []), { status: "complete", recordedAt: new Date().toISOString() }];
    contract.summary = String(input.summary ?? "").trim();
    if (!contract.summary) throw new Error("completion summary is required");
    contract.updatedAt = new Date().toISOString();
    contract.completedAt = contract.updatedAt;
    return writeTask(contract);
  }

  return {
    routeTask,
    searchSkills,
    inspectSkill,
    readSkillReference,
    status,
    auditApprovedSkills,
    codeContext,
    codegraphHealth,
    recordOutcome,
    startTask,
    beginTask,
    getTask,
    recordDecision,
    recordCheck,
    completeTask
  };
}

export { harnessRoot, workspaceRoot };
