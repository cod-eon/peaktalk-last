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

export function createRouter(options = {}) {
  const config = readJson(options.configPath ?? path.join(harnessRoot, "config/harness.json"));
  const policy = readJson(options.policyPath ?? path.join(harnessRoot, "config/skills-policy.json"));
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
    if (/(review|ревью|аудит|проверь\s+(код|diff)|code review)/u.test(text)) return "review";
    if (/(debug|diagnos|root cause|bug|ошиб|сломал|не работает|регресс)/u.test(text)) return "debug";
    if (/(test|qa|playwright|e2e|тест|провер)/u.test(text)) return "test";
    if (/(plan|architect|design decision|prd|roadmap|спроект|архитект|продуктов.*решен|обсуд|соглас|выбрать)/u.test(text)) return "plan";
    return "implement";
  }

  function detectDomains(text, paths = []) {
    const joined = `${text} ${paths.join(" ")}`;
    const rules = {
      product: /(product|prd|roadmap|position|pricing|onboarding|paywall|persona|scenario|продукт|позиционир|онбординг|пейвол|сценари)/u,
      architecture: /(architect|adr|system design|migration strategy|архитект|системн.*дизайн)/u,
      ui: /(ui|ux|layout|responsive|visual|screen|page|component|mobile|desktop|интерфейс|экран|дизайн|верст)/u,
      frontend: /(frontend|next\.?js|react|tailwind|zustand|tanstack|frontend\/|src\/app|src\/components|фронтенд)/u,
      backend: /(backend|fastapi|python|sqlalchemy|celery|backend\/|бэкенд)/u,
      api: /(^|\W)(api|endpoint|router|webhook)(\W|$)|контракт.*api/u,
      database: /(database|postgres|sql|alembic|schema|migration|rls|таблиц|баз.*данн)/u,
      auth: /(auth|login|register|session|jwt|oauth|logto|supabase auth|авторизац|аутентиф)/u,
      security: /(security|secret|permission|authorization|vulnerab|idor|безопас|секрет|доступ)/u,
      deploy: /(deploy|production|docker|nginx|ci\/cd|workflow|infra|депло|продакшн)/u,
      code: /(code|diff|refactor|implement|bug|код|рефактор|реализ)/u
    };
    return Object.entries(rules).filter(([, regex]) => regex.test(joined)).map(([domain]) => domain);
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

  function routeTask(input) {
    const task = String(input.task ?? "").trim();
    if (!task) throw new Error("task is required");
    const paths = Array.isArray(input.paths) ? input.paths.map(String) : [];
    const text = normalize(`${task} ${paths.join(" ")}`);
    const mode = input.mode ?? detectMode(text);
    const domains = detectDomains(text, paths);
    const gates = decisionGates(text, mode, domains);
    const baseRisk = classifyRisk(text, domains);
    const risk = gates.some((gate) => gate.id === "product" || gate.id === "costlyArchitecture") ? "high" : baseRisk;
    const byId = catalogById();

    const selectedSkills = policy.approved
      .map((entry) => ({ entry, ...scoreSkill(entry, text, mode, domains) }))
      .filter((candidate) => candidate.score >= 7)
      .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
      .slice(0, config.maxSelectedSkills)
      .map(({ entry, score, reasons }) => {
        const metadata = byId.get(entry.id);
        return {
          id: entry.id,
          score,
          reasons,
          available: Boolean(metadata),
          risk: metadata?.risk ?? "catalog-unavailable",
          path: metadata ? path.join(aasRoot, metadata.path, "SKILL.md") : null,
          scriptsAllowed: false
        };
      });

    return {
      task,
      classification: { mode, domains, risk },
      autonomy: gates.length ? "pause-at-decision-gate" : risk === "high" ? "controlled-with-explicit-risk-review" : "autonomous",
      decisionGates: gates,
      selectedSkills,
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
    try {
      actualCommit = execFileSync("git", ["-C", aasRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
      gitTreeClean = execFileSync("git", ["-C", aasRoot, "status", "--porcelain"], { encoding: "utf8" }).trim() === "";
    } catch {
      actualCommit = null;
    }
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
    return writeTask({
      schemaVersion: 1,
      taskId,
      task: route.task,
      status: route.decisionGates.length ? "awaiting-decision" : "ready",
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

  function getTask(input) {
    return readTask(validateTaskId(input.taskId));
  }

  function recordDecision(input) {
    const contract = readTask(validateTaskId(input.taskId));
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
    contract.status = "verifying";
    contract.updatedAt = new Date().toISOString();
    return writeTask(contract);
  }

  function completeTask(input) {
    const contract = readTask(validateTaskId(input.taskId));
    const unresolved = contract.route.decisionGates.filter((gate) => !contract.decisions.some((item) => item.gateId === gate.id));
    if (unresolved.length) throw new Error(`unresolved decision gates: ${unresolved.map((gate) => gate.id).join(", ")}`);
    const failed = contract.checks.filter((check) => check.result === "fail");
    if (failed.length) throw new Error(`failed checks: ${failed.map((check) => check.checkId).join(", ")}`);
    const missing = contract.route.requiredCheckIds.filter((required) => !contract.checks.some((check) => check.checkId === required && check.result === "pass"));
    if (missing.length) throw new Error(`missing passing checks: ${missing.join(", ")}`);
    contract.status = "complete";
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
    recordOutcome,
    startTask,
    getTask,
    recordDecision,
    recordCheck,
    completeTask
  };
}

export { harnessRoot, workspaceRoot };
