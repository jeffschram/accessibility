/**
 * Argument validation shared by the CLI workers.
 *
 * These scripts do minutes of network work before they touch Convex, so a
 * malformed argument must fail on the first line rather than after the run.
 */

/** Convex IDs are 32 lowercase base32-ish characters. */
const CONVEX_ID = /^[0-9a-z]{32}$/;

/** A mistake in how the command was typed, rather than a fault in the run. */
export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
}

/**
 * Reads the value following a flag.
 *
 * A missing space — `--audit abc--cluster` — otherwise swallows the next flag
 * as this one's value, and the mistake only surfaces much later as a server
 * validation error. Treating a flag-looking value as an error catches it here.
 */
export function takeValue(argv, index, flag) {
  const value = argv[index];

  if (value === undefined) {
    throw new UsageError(`${flag} expects a value.`);
  }

  if (value.startsWith("--")) {
    throw new UsageError(
      `${flag} expects a value but got the flag ${value}.\n` +
        `Did you mean:  ${flag} <value> ${value}`,
    );
  }

  return value;
}

/**
 * Checks an ID looks like a Convex ID before any work is done.
 *
 * Catches the missing-space case even when the run-on text is not itself a
 * flag, e.g. `--audit abc123https://example.com`.
 */
export function requireConvexId(value, flag) {
  if (CONVEX_ID.test(value)) {
    return value;
  }

  const flagIndex = value.indexOf("--");
  const hint =
    flagIndex > 0
      ? ` It looks like a missing space: "${flag} ${value.slice(0, flagIndex)} ${value.slice(flagIndex)}".`
      : "";

  throw new UsageError(
    `${flag} expects a 32-character Convex ID, got "${value}".${hint}`,
  );
}
