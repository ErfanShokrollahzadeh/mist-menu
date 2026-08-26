#!/usr/bin/env node
/**
 * Runs every API-level suite.
 *
 * Order is deliberate:
 *  - palette needs no API at all
 *  - kds/cms/tables assert against live orders and the seeded menu
 *  - analytics reseeds the order tables to get a clean window, so it follows them
 *  - auth runs LAST because its final assertion deliberately exhausts the API's
 *    5/min login budget; anything after it would be starved of a session
 */
import { execFileSync } from "node:child_process";

const SUITES = [
  "palette-check", "kds-check", "cms-check",
  "tables-check", "analytics-check", "auth-check",
];

let failed = 0;
for (const suite of SUITES) {
  process.stdout.write(`\n──── ${suite} ────\n`);
  try {
    execFileSync("node", [`scripts/e2e/${suite}.mjs`], { stdio: "inherit" });
  } catch {
    failed++;
  }
}
console.log(failed === 0 ? "\nALL SUITES PASS\n" : `\n${failed} SUITE(S) FAILED\n`);
process.exit(failed === 0 ? 0 : 1);
