#!/usr/bin/env node
import { createRouter } from "../lib/router.mjs";

const router = createRouter();
const [command = "status", ...args] = process.argv.slice(2);

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

try {
  switch (command) {
    case "status":
      {
        const status = router.status();
        print(status);
        if (!status.catalog.integrity) process.exitCode = 1;
      }
      break;
    case "route":
      print(router.routeTask({ task: args.join(" ") }));
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
    default:
      throw new Error(`unknown command: ${command}`);
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
