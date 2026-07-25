import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { resolveTitle } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ componentId: string }>;
}): Promise<Metadata> {
  const { componentId } = await params;

  return resolveTitle(async (client) => {
    const detail = await client.query(api.inventory.getComponentDetail, {
      componentId: componentId as Id<"auditComponents">,
    });
    return detail ? `${detail.component.name} — component checks` : null;
  }, "Component checks");
}

export default function ComponentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
