import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { resolveTitle } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageId: string }>;
}): Promise<Metadata> {
  const { pageId } = await params;

  return resolveTitle(async (client) => {
    const detail = await client.query(api.inventory.getPageDetail, {
      pageId: pageId as Id<"auditPages">,
    });
    return detail ? `${detail.page.name} — audit page` : null;
  }, "Audit page");
}

export default function AuditPageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
