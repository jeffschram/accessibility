"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import {
  audits,
  findings,
  projects,
  scopeItems,
} from "@/lib/accessibility/sample-data";

export default function Home() {
  const dashboard = useQuery(api.dashboard.summary);
  const liveProjects = dashboard?.projects ?? projects;
  const liveAudits = dashboard?.audits ?? audits;
  const liveFindings = dashboard?.findings ?? findings;
  const liveScopeItems = dashboard?.scopeItems ?? scopeItems;
  const sortedProjects = [...liveProjects].sort(compareByUpdatedAt);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-sky-700">WCAG-guided audit workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
              Track accessibility audits from scope through remediation.
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Manage scope, manual testing, automated observations, findings, and reports
              while keeping WCAG references and evidence close to the workflow.
            </p>
          </div>
          <NewProjectDialog />
        </section>

        <section>
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Projects are listed with current and recent audits nested underneath.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border border-slate-200">
                {sortedProjects.length ? (
                  <div className="divide-y divide-slate-200">
                    {sortedProjects.map((project) => {
                      const projectId = getItemId(project);
                      const projectHref = `/projects/${getSlug(project) || projectId}`;
                      const projectAudits = liveAudits
                        .filter((audit) => getProjectId(audit) === projectId)
                        .sort(compareAudits);

                      return (
                        <section key={projectId} className="bg-white">
                          <div className="grid gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base font-semibold text-slate-950">
                                  {project.name}
                                </h2>
                                <Badge variant="info">{getProjectTarget(project)}</Badge>
                              </div>
                              <p className="mt-1 text-sm text-slate-600">
                                {getProjectClient(project) || "No client set"}
                              </p>
                              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                                <div>
                                  <dt className="inline font-medium text-slate-950">Audits: </dt>
                                  <dd className="inline">{projectAudits.length}</dd>
                                </div>
                                <div>
                                  <dt className="inline font-medium text-slate-950">Updated: </dt>
                                  <dd className="inline">{formatUpdatedAt(project)}</dd>
                                </div>
                              </dl>
                            </div>
                            <div className="flex justify-start md:justify-end">
                              <Button asChild size="sm" variant="secondary">
                                <Link href={projectHref}>Open project</Link>
                              </Button>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-left text-sm">
                              <thead className="bg-white text-xs uppercase text-slate-600">
                                <tr>
                                  <th className="px-4 py-3 font-semibold">Audit</th>
                                  <th className="px-4 py-3 font-semibold">Status</th>
                                  <th className="px-4 py-3 font-semibold">Target</th>
                                  <th className="px-4 py-3 font-semibold">Scope</th>
                                  <th className="px-4 py-3 font-semibold">Findings</th>
                                  <th className="px-4 py-3 font-semibold">Progress</th>
                                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {projectAudits.length ? (
                                  projectAudits.map((audit) => {
                                    const auditId = getItemId(audit);
                                    const auditScopeCount =
                                      "scopeCount" in audit
                                        ? audit.scopeCount
                                        : liveScopeItems.filter(
                                            (item) => getAuditId(item) === auditId,
                                          ).length;
                                    const auditFindingCount =
                                      "findingCount" in audit
                                        ? audit.findingCount
                                        : liveFindings.filter(
                                            (finding) => getAuditId(finding) === auditId,
                                          ).length;
                                    const progress = getProgress(audit);
                                    const auditHref = `${projectHref}/audits/${
                                      getSlug(audit) || auditId
                                    }`;

                                    return (
                                      <tr key={auditId} className="align-top">
                                        <td className="px-4 py-4">
                                          <div className="font-medium text-slate-950">
                                            {audit.name}
                                          </div>
                                          <div className="mt-1 text-slate-600">
                                            {audit.environmentUrl}
                                          </div>
                                        </td>
                                        <td className="px-4 py-4 capitalize">
                                          <Badge>{audit.status}</Badge>
                                        </td>
                                        <td className="px-4 py-4">
                                          <Badge variant="info">{getAuditTarget(audit)}</Badge>
                                        </td>
                                        <td className="px-4 py-4">{auditScopeCount}</td>
                                        <td className="px-4 py-4">{auditFindingCount}</td>
                                        <td className="px-4 py-4">
                                          <div className="flex items-center gap-3">
                                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                                              <div
                                                className="h-full bg-sky-600"
                                                style={{ width: `${progress}%` }}
                                              />
                                            </div>
                                            <span className="text-xs text-slate-600">
                                              {progress}%
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                          <Button asChild size="sm" variant="secondary">
                                            <Link href={auditHref}>Open</Link>
                                          </Button>
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td
                                      className="px-4 py-8 text-center text-slate-600"
                                      colSpan={7}
                                    >
                                      No audits yet.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white px-4 py-10 text-center">
                    <p className="text-sm text-slate-600">
                      No projects yet. Create one to start scoping an audit.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <NewProjectDialog />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

const selectClassName =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600";

function NewProjectDialog() {
  const router = useRouter();
  const createProject = useMutation(api.projects.create);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [wcagVersion, setWcagVersion] = useState("2.2");
  const [conformanceLevel, setConformanceLevel] = useState<"A" | "AA" | "AAA">("AA");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The slug is part of every project URL, so it tracks the name until the
  // person edits it directly.
  const effectiveSlug = slugEdited ? slug : slugify(name);

  function reset() {
    setName("");
    setSlug("");
    setSlugEdited(false);
    setClientName("");
    setDescription("");
    setWcagVersion("2.2");
    setConformanceLevel("AA");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    if (!effectiveSlug) {
      setError("Enter a URL slug using letters, numbers, and hyphens.");
      return;
    }

    setIsSubmitting(true);
    try {
      const projectId = await createProject({
        name: trimmedName,
        slug: effectiveSlug,
        clientName: clientName.trim() || undefined,
        description: description.trim() || undefined,
        defaultWcagVersion: wcagVersion,
        defaultConformanceLevel: conformanceLevel,
      });
      setOpen(false);
      reset();
      router.push(`/projects/${projectId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create project.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset();
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden="true" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            A project groups audits for one site or application. Its defaults seed each new
            audit and can be changed per audit.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: heart.org"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-slug">URL slug</Label>
            <Input
              id="project-slug"
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(slugify(event.target.value));
              }}
              placeholder="heart-org"
              value={effectiveSlug}
            />
            <p className="text-xs text-slate-600" id="project-slug-hint">
              Used in the project URL: /projects/{effectiveSlug || "your-slug"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-client">Client</Label>
            <Input
              id="project-client"
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Example: American Heart Association"
              value={clientName}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-wcag-version">Default WCAG version</Label>
              <select
                className={selectClassName}
                id="project-wcag-version"
                onChange={(event) => setWcagVersion(event.target.value)}
                value={wcagVersion}
              >
                <option value="2.2">2.2</option>
                <option value="2.1">2.1</option>
                <option value="2.0">2.0</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-conformance">Default level</Label>
              <select
                className={selectClassName}
                id="project-conformance"
                onChange={(event) =>
                  setConformanceLevel(event.target.value as "A" | "AA" | "AAA")
                }
                value={conformanceLevel}
              >
                <option value="A">A</option>
                <option value="AA">AA</option>
                <option value="AAA">AAA</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What does this project cover?"
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
              onClick={() => setOpen(false)}
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
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function getAuditId(item: object) {
  return "auditId" in item && typeof item.auditId === "string" ? item.auditId : "";
}

function getProjectId(item: object | undefined) {
  return item && "projectId" in item && typeof item.projectId === "string"
    ? item.projectId
    : "";
}

/** Sample-data rows have no slug, so callers fall back to the ID. */
function getSlug(item: object | undefined) {
  return item && "slug" in item && typeof item.slug === "string" ? item.slug : "";
}

function getProgress(audit: { progress?: number; status?: string } | undefined) {
  if (!audit) {
    return 0;
  }

  if (typeof audit.progress === "number") {
    return audit.progress;
  }

  return audit.status === "testing" ? 42 : 14;
}

function getProjectClient(project: object) {
  return "clientName" in project && typeof project.clientName === "string"
    ? project.clientName
    : "";
}

function getProjectTarget(project: object) {
  if ("conformanceTarget" in project && typeof project.conformanceTarget === "string") {
    return project.conformanceTarget;
  }

  const version =
    "defaultWcagVersion" in project && typeof project.defaultWcagVersion === "string"
      ? project.defaultWcagVersion
      : "2.2";
  const level =
    "defaultConformanceLevel" in project &&
    typeof project.defaultConformanceLevel === "string"
      ? project.defaultConformanceLevel
      : "AA";

  return `WCAG ${version} ${level}`;
}

function getAuditTarget(audit: object) {
  const version =
    "wcagVersion" in audit && typeof audit.wcagVersion === "string"
      ? audit.wcagVersion
      : "2.2";
  const level =
    "conformanceLevel" in audit && typeof audit.conformanceLevel === "string"
      ? audit.conformanceLevel
      : "AA";

  return `WCAG ${version} ${level}`;
}

function getUpdatedAt(item: object) {
  if ("updatedAt" in item && typeof item.updatedAt === "number") {
    return item.updatedAt;
  }

  if ("updatedAt" in item && typeof item.updatedAt === "string") {
    if (item.updatedAt.toLowerCase() === "today") {
      return 2;
    }

    if (item.updatedAt.toLowerCase() === "yesterday") {
      return 1;
    }
  }

  return 0;
}

function formatUpdatedAt(item: object) {
  if ("updatedAt" in item && typeof item.updatedAt === "number") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(item.updatedAt);
  }

  if ("updatedAt" in item && typeof item.updatedAt === "string") {
    return item.updatedAt;
  }

  return "Not tracked";
}

function compareByUpdatedAt(first: object, second: object) {
  return getUpdatedAt(second) - getUpdatedAt(first);
}

function compareAudits(first: object, second: object) {
  const statusDifference = getStatusRank(first) - getStatusRank(second);

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return compareByUpdatedAt(first, second);
}

function getStatusRank(item: object) {
  const status = "status" in item && typeof item.status === "string" ? item.status : "";
  const currentStatuses = new Set([
    "scoping",
    "testing",
    "reporting",
    "remediation",
    "retesting",
    "draft",
  ]);

  if (currentStatuses.has(status)) {
    return 0;
  }

  if (status === "complete") {
    return 1;
  }

  return 2;
}
