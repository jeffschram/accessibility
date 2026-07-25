import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { resolveTitle } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectSlug: string; auditSlug: string }>;
}): Promise<Metadata> {
  const { projectSlug, auditSlug } = await params;

  return resolveTitle(async (client) => {
    const result = await client.query(api.audits.getBySlug, { projectSlug, auditSlug });
    return result ? `Triage queue — ${result.audit.name}` : null;
  }, "Triage queue");
}

export default function TriageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
