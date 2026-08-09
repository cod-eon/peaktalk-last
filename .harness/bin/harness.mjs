#!/usr/bin/env node
import { createRouter } from "../lib/router.mjs";

const router = createRouter();
const [command = "status", ...args] = process.argv.slice(2);

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function parseRouteArgs(values) {
  const taskParts = [];
  const paths = [];
  let mode;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--") {
      taskParts.push(...values.slice(index + 1));
      break;
    }
    if (value === "--mode" || value === "-m") {
      mode = values[++index];
      if (!mode) throw new Error("--mode requires a value");
      continue;
    }
    if (value.startsWith("--mode=")) {
      mode = value.slice("--mode=".length);
      continue;
    }
    if (value === "--path" || value === "-p") {
      const pathValue = values[++index];
      if (!pathValue) throw new Error("--path requires a value");
      paths.push(pathValue);
      continue;
    }
    if (value.startsWith("--path=")) {
      paths.push(value.slice("--path=".length));
      continue;
    }
    if (value.startsWith("-")) throw new Error(`unknown route flag: ${value}`);
    taskParts.push(value);
  }
  return { task: taskParts.join(" ").trim(), mode, paths };
}

function parseJsonArgs(values, command) {
  const json = values[0] === "--json" ? values.slice(1).join(" ") : values.join(" ");
  if (!json) throw new Error(`${command} requires a JSON object`);
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error(`${command} received invalid JSON: ${error.message}`);
  }
}

function printHelp() {
  process.stdout.write(`PeakTalk harness CLI\n\nCommands:\n  status\n  route <task> [--mode <mode>] [--path <path>]\n  context <query>\n  codegraph-health\n  search <query>\n  inspect <skill-id> [--content]\n  audit\n  start-task <json>\n  get-task <task-id>\n  begin-task <task-id>\n  record-decision <json>\n  record-check <json>\n  complete-task <json>\n  record-outcome <json>\n`);
}

try {
  switch (command) {
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    case "status":
      {
        const status = router.status();
        print(status);
        if (!status.catalog.integrity) process.exitCode = 1;
      }
      break;
    case "route":
      print(router.routeTask(parseRouteArgs(args)));
      break;
    case "context":
      print(router.codeContext({ query: args.join(" ") }));
      break;
    case "codegraph-health":
      {
        const health = router.codegraphHealth();
        print(health);
        if (!health.ok) process.exitCode = 1;
      }
      break;
    case "search":
      print(router.searchSkills({ query: args.join(" ") }));
      break;
    case "inspect":
      print(router.inspectSkill({ id: args[0], includeContent: args.includes("--content") }));
      break;
    case "audit":
      {
        const audit = router.auditApprovedSkills();
        print(audit);
        if (!audit.ok) process.exitCode = 1;
      }
      break;
    case "record":
      print(router.recordOutcome(JSON.parse(args.join(" "))));
      break;
    case "start-task":
      print(router.startTask(parseJsonArgs(args, command)));
      break;
    case "get-task":
      print(router.getTask({ taskId: args[0] }));
      break;
    case "begin-task":
      print(router.beginTask({ taskId: args[0] }));
      break;
    case "record-decision":
      print(router.recordDecision(parseJsonArgs(args, command)));
      break;
    case "record-check":
      print(router.recordCheck(parseJsonArgs(args, command)));
      break;
    case "complete-task":
      print(router.completeTask(parseJsonArgs(args, command)));
      break;
    case "record-outcome":
      print(router.recordOutcome(parseJsonArgs(args, command)));
      break;
    default:
      throw new Error(`unknown command: ${command}`);
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
