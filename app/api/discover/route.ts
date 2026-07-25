import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { discoverFromSitemap } from "@/scripts/lib/sitemap.mjs";

/**
 * Runs sitemap discovery for an audit.
 *
 * Server-side because the browser cannot fetch another origin's sitemap, and
 * because this shares the exact module the `discover` CLI uses — one
 * implementation, so the button and the command agree.
 *
 * Only the sitemap source is available here. Crawling and structural
 * fingerprinting need a real browser and remain CLI-only.
 */
export async function POST(request: Request) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return Response.json({ error: "Convex is not configured." }, { status: 500 });
  }

  let body: { auditId?: string; origin?: string; max?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const { auditId, origin } = body;

  if (!auditId || !origin) {
    return Response.json(
      { error: "auditId and origin are both required." },
      { status: 400 },
    );
  }

  let target: URL;
  try {
    target = new URL(/^https?:\/\//i.test(origin) ? origin : `https://${origin}`);
  } catch {
    return Response.json(
      { error: `"${origin}" is not a valid URL.` },
      { status: 400 },
    );
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return Response.json({ error: "Only http and https are supported." }, { status: 400 });
  }

  const client = new ConvexHttpClient(convexUrl);

  const audit = await client.query(api.audits.get, {
    auditId: auditId as Id<"audits">,
  });
  if (!audit) {
    return Response.json({ error: "Audit not found." }, { status: 404 });
  }

  const { items, notes, stats } = await discoverFromSitemap(target.origin, {
    max: Math.min(body.max ?? 2000, 5000),
  });

  if (!items.length) {
    return Response.json({ stats, notes, created: 0, updated: 0 });
  }

  const result = await client.mutation(api.scope.createBatch, {
    auditId: auditId as Id<"audits">,
    items: items.map(
      (item: {
        name: string;
        url: string;
        normalizedUrl: string;
        routePattern?: string;
        clusterKey?: string;
        clusterSize?: number;
        isRepresentative?: boolean;
      }) => ({
        name: item.name,
        url: item.url,
        normalizedUrl: item.normalizedUrl,
        routePattern: item.routePattern,
        clusterKey: item.clusterKey ?? item.routePattern,
        clusterSize: item.clusterSize,
        isRepresentative: item.isRepresentative,
        discoverySource: "sitemap" as const,
      }),
    ),
  });

  // The mutation returns every created ID; the UI only needs the tallies.
  return Response.json({
    stats,
    notes,
    created: result.created,
    updated: result.updated,
  });
}
