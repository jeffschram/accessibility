import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { resolveTitle } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}): Promise<Metadata> {
  const { projectSlug } = await params;

  return resolveTitle(
    async (client) => (await client.query(api.projects.getBySlug, { slug: projectSlug }))?.name,
    "Project",
  );
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
