"use client";

import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  TriangleAlert,
} from "lucide-react";
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
  guidanceTasks,
  projects,
  scopeItems,
  wcagCriteria,
} from "@/lib/accessibility/sample-data";
import type { Severity } from "@/lib/accessibility/types";

const severityVariant: Record<Severity, "critical" | "high" | "medium" | "low"> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

export default function Home() {
  const dashboard = useQuery(api.dashboard.summary);
  const liveProjects = dashboard?.projects ?? projects;
  const liveAudits = dashboard?.audits ?? audits;
  const liveFindings = dashboard?.findings ?? findings;
  const liveScopeItems = dashboard?.scopeItems ?? scopeItems;
  const liveGuidanceTasks = dashboard?.guidanceTasks ?? guidanceTasks;
  const liveWcagCriteria = dashboard?.wcagCriteria ?? wcagCriteria;
  const activeAudit = liveAudits[0];
  const keyboardTask = liveGuidanceTasks[0];
  const activeAuditId = getItemId(activeAudit);
  const activeAuditScopeCount = liveScopeItems.filter(
    (item) => getAuditId(item) === activeAuditId,
  ).length;
  const activeAuditFindingCount = liveFindings.filter(
    (finding) => getAuditId(finding) === activeAuditId,
  ).length;
  const auditProgress = getProgress(activeAudit);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
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
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/testing">
                Continue testing
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/reference">Open reference</Link>
            </Button>
          </div>
        </section>

        <section aria-label="Audit summary" className="grid gap-3 md:grid-cols-4">
          <MetricCard label="Active projects" value={liveProjects.length.toString()} />
          <MetricCard label="Audit progress" value={`${auditProgress}%`} />
          <MetricCard label="Scope items" value={activeAuditScopeCount.toString()} />
          <MetricCard label="Open findings" value={activeAuditFindingCount.toString()} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Active Audits</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  Progress is tracked across scope, modalities, observations, and findings.
                </p>
              </div>
              <Badge variant="info">WCAG 2.2 AA</Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="min-w-[680px] w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Audit</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Scope</th>
                      <th className="px-4 py-3 font-semibold">Findings</th>
                      <th className="px-4 py-3 font-semibold">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {liveAudits.map((audit) => {
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

                      return (
                      <tr key={auditId}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-950">{audit.name}</div>
                          <div className="text-xs text-slate-500">{audit.environmentUrl}</div>
                        </td>
                        <td className="px-4 py-3 capitalize">{audit.status}</td>
                        <td className="px-4 py-3">{auditScopeCount}</td>
                        <td className="px-4 py-3">{auditFindingCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full bg-sky-600"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-600">{progress}%</span>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Guided Keyboard Task</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Checklist work includes instructions, expected behavior, and WCAG
                references.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                    <ListChecks className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-950">{keyboardTask.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {keyboardTask.whyThisMatters}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {getTaskWcag(keyboardTask).map((criterion) => (
                  <Badge key={criterion} variant="info">
                    {criterion}
                  </Badge>
                ))}
              </div>
              <ol className="space-y-2 text-sm leading-6 text-slate-700">
                {keyboardTask.howToTest.map((step) => (
                  <li key={step} className="flex gap-2">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <strong className="font-semibold text-slate-950">Expected: </strong>
                {keyboardTask.expectedBehavior}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Scope Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {liveScopeItems.map((item) => {
                  const itemId = getItemId(item);
                  const itemStatus = getScopeStatus(item);

                  return (
                  <li key={itemId} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium text-slate-950">{item.name}</div>
                      <div className="text-xs capitalize text-slate-500">{item.type}</div>
                    </div>
                    <Badge>{itemStatus.replaceAll("_", " ")}</Badge>
                  </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Findings Needing Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {liveFindings.map((finding) => {
                  const findingId = getItemId(finding);
                  const findingWcag = "wcagCriteria" in finding ? finding.wcagCriteria : finding.wcag;

                  return (
                  <li key={findingId} className="space-y-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start gap-2">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
                      <p className="text-sm font-medium leading-5 text-slate-950">{finding.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={severityVariant[finding.severity]}>{finding.severity}</Badge>
                      {findingWcag.map((criterion) => (
                        <Badge key={criterion} variant="info">
                          {criterion}
                        </Badge>
                      ))}
                    </div>
                  </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reference Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {liveWcagCriteria.slice(0, 4).map((criterion) => {
                  const criterionId = getItemId(criterion);
                  const criterionNumber =
                    "criterion" in criterion ? criterion.criterion : criterion.id;

                  return (
                  <li key={criterionId} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-950">
                        {criterionNumber}
                      </span>
                      <Badge>{criterion.level}</Badge>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-slate-950">
                      {criterion.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {criterion.plainLanguageSummary}
                    </p>
                  </li>
                  );
                })}
              </ul>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link href="/reference">
                  <BookOpenCheck className="size-4" aria-hidden="true" />
                  Browse WCAG reference
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <ClipboardCheck className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-slate-600">{label}</p>
            <p className="text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
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

function getProgress(audit: { progress?: number; status?: string } | undefined) {
  if (!audit) {
    return 0;
  }

  if (typeof audit.progress === "number") {
    return audit.progress;
  }

  return audit.status === "testing" ? 42 : 14;
}

function getScopeStatus(item: { status?: string; testStatus?: string }) {
  return item.status ?? item.testStatus ?? "not_started";
}

function getTaskWcag(task: { relatedWcag?: string[]; relatedWcagCriteria?: string[] }) {
  return task.relatedWcag ?? task.relatedWcagCriteria ?? [];
}
