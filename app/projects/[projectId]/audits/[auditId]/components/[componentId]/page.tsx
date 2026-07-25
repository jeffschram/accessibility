"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type CheckStatus = "not_started" | "pass" | "fail" | "not_applicable" | "needs_review";

export default function ComponentDetailPage() {
  const params = useParams<{ projectId: string; auditId: string; componentId: string }>();
  const projectId = params.projectId as Id<"projects">;
  const auditId = params.auditId as Id<"audits">;
  const componentId = params.componentId as Id<"auditComponents">;
  const project = useQuery(api.projects.get, { projectId });
  const audit = useQuery(api.audits.get, { auditId });
  const componentDetail = useQuery(api.inventory.getComponentDetail, { componentId });
  const ensureComponentChecks = useMutation(api.inventory.ensureComponentChecks);
  const updateComponentCheck = useMutation(api.inventory.updateComponentCheck);

  useEffect(() => {
    if (componentDetail && componentDetail.checks.length === 0) {
      void ensureComponentChecks({ componentId });
    }
  }, [componentDetail, componentId, ensureComponentChecks]);

  if (project === undefined || audit === undefined || componentDetail === undefined) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading component...
        </div>
      </AppShell>
    );
  }

  if (project === null || audit === null || componentDetail === null) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Button asChild variant="secondary">
            <Link href={`/projects/${projectId}/audits/${auditId}`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to audit
            </Link>
          </Button>
          <Card>
            <CardContent className="p-6">
              <h1 className="text-lg font-semibold text-slate-950">Component not found</h1>
              <p className="mt-2 text-sm text-slate-600">
                This component may have been deleted or the link may be incorrect.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const { component } = componentDetail;
  const checks = [...componentDetail.checks].sort(
    (first, second) => first.order - second.order,
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Button asChild variant="secondary">
            <Link href={`/projects/${projectId}/audits/${auditId}`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to audit
            </Link>
          </Button>
        </div>

        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-sky-700">
            {project.name} / {audit.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            {component.name}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {component.description ||
              "Review this component pattern and its audit checks."}
          </p>
        </header>

        <section aria-label="Component summary" className="grid gap-3 md:grid-cols-3">
          <SummaryCard label="Type" value={component.componentType.replace("_", " ")} />
          <SummaryCard label="Scope" value={component.scope.replace("_", " ")} />
          <SummaryCard label="Status" value={component.testStatus.replaceAll("_", " ")} />
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Audit Checks</h2>
              <p className="mt-1 text-sm text-slate-600">
                Checks are generated from this component type and tied to WCAG criteria.
              </p>
            </div>
            <Badge>{checks.length} checks</Badge>
          </div>

          {checks.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Check</th>
                    <th className="px-4 py-3 font-semibold">WCAG</th>
                    <th className="px-4 py-3 font-semibold">Expected</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {checks.map((check) => (
                    <tr className="align-top" key={check._id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-950">{check.title}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-600">
                          {check.instructions}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex max-w-48 flex-wrap gap-1">
                          {check.wcagCriteria.map((criterion) => (
                            <Badge key={criterion} variant="info">
                              {criterion}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 leading-6 text-slate-600">
                        {check.expectedBehavior}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          aria-label={`Status for ${check.title}`}
                          className="h-10 w-full min-w-40 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                          onChange={(event) =>
                            void updateComponentCheck({
                              checkId: check._id,
                              status: event.target.value as CheckStatus,
                              notes: check.notes,
                            })
                          }
                          value={check.status}
                        >
                          <option value="not_started">Not started</option>
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                          <option value="needs_review">Needs review</option>
                          <option value="not_applicable">Not applicable</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-slate-600">
              <ClipboardCheck className="mx-auto mb-3 size-8 text-slate-400" aria-hidden="true" />
              Generating checks for this component...
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="mt-1 text-xl font-semibold capitalize text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}
