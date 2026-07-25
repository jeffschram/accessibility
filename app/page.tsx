"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <section className="border-b border-slate-200 pb-6">
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
                                <Link href={`/projects/${projectId}`}>Open project</Link>
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
                                    const auditHref = getAuditHref(audit);

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
                                            <Link href={auditHref ?? `/projects/${projectId}`}>
                                              Open
                                            </Link>
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
                  <div className="bg-white px-4 py-10 text-center text-sm text-slate-600">
                    No projects yet.
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

function getAuditHref(audit: object | undefined) {
  const auditId = getItemId(audit);
  const projectId = getProjectId(audit);

  return auditId && projectId ? `/projects/${projectId}/audits/${auditId}` : null;
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
