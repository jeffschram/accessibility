/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as audits from "../audits.js";
import type * as componentTemplates from "../componentTemplates.js";
import type * as componentTypes from "../componentTypes.js";
import type * as dashboard from "../dashboard.js";
import type * as defaultWcag from "../defaultWcag.js";
import type * as evidence from "../evidence.js";
import type * as findings from "../findings.js";
import type * as guidance from "../guidance.js";
import type * as inventory from "../inventory.js";
import type * as observations from "../observations.js";
import type * as projects from "../projects.js";
import type * as scope from "../scope.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as slugs from "../slugs.js";
import type * as wcag from "../wcag.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  audits: typeof audits;
  componentTemplates: typeof componentTemplates;
  componentTypes: typeof componentTypes;
  dashboard: typeof dashboard;
  defaultWcag: typeof defaultWcag;
  evidence: typeof evidence;
  findings: typeof findings;
  guidance: typeof guidance;
  inventory: typeof inventory;
  observations: typeof observations;
  projects: typeof projects;
  scope: typeof scope;
  seed: typeof seed;
  seedData: typeof seedData;
  slugs: typeof slugs;
  wcag: typeof wcag;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
