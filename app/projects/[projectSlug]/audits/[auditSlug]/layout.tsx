import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { resolveTitle } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectSlug: string; auditSlug: string }>;
}): Promise<Metadata> {
  const { projectSlug, auditSlug } = await params;

  return resolveTitle(
    async (client) =>
      (await client.query(api.audits.getBySlug, { projectSlug, auditSlug }))?.audit.name,
    "Audit",
  );
}

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
