import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { resolveTitle } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;

  return resolveTitle(
    async (client) =>
      (await client.query(api.projects.get, { projectId: projectId as Id<"projects"> }))?.name,
    "Project",
  );
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
