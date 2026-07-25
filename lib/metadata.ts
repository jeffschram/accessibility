import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";

export const SITE_NAME = "Accessibility Audit Tracker";

/**
 * Builds a full document title. Next's `title.template` only cascades to the
 * immediately nested segment, so deeper routes silently lost the product name;
 * composing the title explicitly keeps every route consistent.
 */
export function pageTitle(topic: string): string {
  return `${topic} — ${SITE_NAME}`;
}

/**
 * Builds a document title for a data-driven route.
 *
 * Screens are client components and cannot export metadata, so titles come
 * from a server layout that reads the record's name over HTTP. A page must
 * still get a usable title when Convex is unreachable, so any failure falls
 * back to the generic name for that route.
 */
export async function resolveTitle(
  resolve: (client: ConvexHttpClient) => Promise<string | null | undefined>,
  fallback: string,
): Promise<Metadata> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!url) {
    return { title: pageTitle(fallback) };
  }

  try {
    const name = await resolve(new ConvexHttpClient(url));
    return { title: pageTitle(name?.trim() || fallback) };
  } catch {
    return { title: pageTitle(fallback) };
  }
}
