import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { resolveTitle } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ auditId: string }>;
}): Promise<Metadata> {
  const { auditId } = await params;

  return resolveTitle(async (client) => {
    const audit = await client.query(api.audits.get, { auditId: auditId as Id<"audits"> });
    return audit ? `Triage queue — ${audit.name}` : null;
  }, "Triage queue");
}

export default function TriageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
