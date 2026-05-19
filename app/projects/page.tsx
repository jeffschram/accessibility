"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FolderKanban, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { audits, projects } from "@/lib/accessibility/sample-data";

export default function ProjectsPage() {
  const liveProjects = useQuery(api.projects.list) ?? projects;
  const liveAudits = useQuery(api.audits.list) ?? audits;
  const createProject = useMutation(api.projects.create);
  const deleteProject = useMutation(api.projects.remove);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<Id<"projects"> | null>(null);
  const [deleteProjectName, setDeleteProjectName] = useState("");
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProject({
        name: trimmedName,
        slug: slugify(trimmedName),
        description: description.trim() || undefined,
        clientName: clientName.trim() || undefined,
        defaultWcagVersion: "2.2",
        defaultConformanceLevel: "AA",
      });
      setName("");
      setClientName("");
      setDescription("");
      setDialogOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create project.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteProject() {
    if (!deleteProjectId) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProject({ projectId: deleteProjectId });
      setDeleteProjectId(null);
      setDeleteProjectName("");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-sky-700">Projects</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
              Organize audit work by product, client, or application.
            </h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FolderKanban className="size-4" aria-hidden="true" />
                New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>
                  Start a workspace for a product, site, client, or internal audit program.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCreateProject}>
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project name</Label>
                  <Input
                    autoComplete="off"
                    id="project-name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Example: Checkout redesign"
                    value={name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client or team</Label>
                  <Input
                    autoComplete="organization"
                    id="client-name"
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="Optional"
                    value={clientName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Input
                    id="project-description"
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Optional audit context"
                    value={description}
                  />
                </div>
                {error ? (
                  <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button
                    disabled={isSubmitting}
                    onClick={() => setDialogOpen(false)}
                    type="button"
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Creating..." : "Create project"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <section aria-label="Project list" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">Active audit</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {liveProjects.map((project) => {
                  const projectId = getItemId(project);
                  const convexProjectId = getConvexProjectId(project);
                  const audit = liveAudits.find((item) => getProjectId(item) === projectId);
                  const conformanceTarget =
                    "conformanceTarget" in project
                      ? project.conformanceTarget
                      : `WCAG ${project.defaultWcagVersion} ${project.defaultConformanceLevel}`;

                  return (
                    <tr key={projectId} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-950">{project.name}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {project.clientName || "No client or team set"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="info">{conformanceTarget}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        {audit ? (
                          <div>
                            <div className="font-medium text-slate-950">{audit.name}</div>
                            <div className="mt-1 text-sm text-slate-600">
                              {audit.environmentUrl || "No environment URL"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">No audits yet</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {audit ? <Badge>{audit.status}</Badge> : <Badge>not started</Badge>}
                      </td>
                      <td className="px-4 py-4">
                        {audit ? (
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full bg-sky-600"
                                style={{ width: `${getProgress(audit)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-600">{getProgress(audit)}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={convexProjectId ? `/projects/${convexProjectId}` : "/projects"}>
                              Open
                              <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                          </Button>
                          <Button
                            aria-label={`Delete ${project.name}`}
                            onClick={() => {
                              setDeleteProjectId(convexProjectId);
                              setDeleteProjectName(project.name);
                            }}
                            disabled={!convexProjectId}
                            size="icon"
                            type="button"
                            variant="danger"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <Dialog
          open={Boolean(deleteProjectId)}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteProjectId(null);
              setDeleteProjectName("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete project?</DialogTitle>
              <DialogDescription>
                This will delete {deleteProjectName ? <strong>{deleteProjectName}</strong> : "this project"} and its audits, scope items, findings, evidence, observations, test runs, and reports.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button disabled={isDeleting} type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={isDeleting} onClick={handleDeleteProject} type="button" variant="danger">
                {isDeleting ? "Deleting..." : "Delete project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function getItemId(item: object | undefined) {
  if (!item) {
    return "";
  }

  if ("_id" in item && typeof item._id === "string") {
    return item._id;
  }

  if ("id" in item && typeof item.id === "string") {
    return item.id;
  }

  return "";
}

function getConvexProjectId(item: object): Id<"projects"> | null {
  return "_id" in item && typeof item._id === "string"
    ? (item._id as Id<"projects">)
    : null;
}

function getProjectId(item: object) {
  return "projectId" in item && typeof item.projectId === "string" ? item.projectId : "";
}

function getProgress(audit: { progress?: number; status?: string }) {
  if (typeof audit.progress === "number") {
    return audit.progress;
  }

  return audit.status === "testing" ? 42 : 14;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
