"use client";

import { ExternalLink } from "lucide-react";
import { useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { guidanceTasks, wcagCriteria } from "@/lib/accessibility/sample-data";

export default function ReferencePage() {
  const liveGuidanceTasks = useQuery(api.guidance.listTasks) ?? guidanceTasks;
  const liveWcagCriteria = useQuery(api.wcag.listCriteria) ?? wcagCriteria;

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-sky-700">Reference</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            WCAG and task guidance
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Short explanations stay close to audit tasks, with links back to official W3C
            references for deeper review.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle>WCAG Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {liveWcagCriteria.map((criterion) => {
                  const criterionId = getItemId(criterion);
                  const criterionNumber =
                    "criterion" in criterion ? criterion.criterion : criterion.id;

                  return (
                  <article key={criterionId} className="rounded-md border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-semibold text-slate-950">
                        {criterionNumber}
                      </span>
                      <Badge>{criterion.level}</Badge>
                    </div>
                    <h2 className="mt-3 text-base font-semibold text-slate-950">
                      {criterion.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {criterion.plainLanguageSummary}
                    </p>
                  </article>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Guidance Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {liveGuidanceTasks.map((task) => (
                    <li key={getItemId(task)} className="rounded-md border border-slate-200 p-3">
                      <h2 className="text-sm font-semibold text-slate-950">{task.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {getTaskNote(task)}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Official Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="secondary" className="w-full justify-start">
                  <a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" aria-hidden="true" />
                    WCAG 2.2 Recommendation
                  </a>
                </Button>
                <Button asChild variant="secondary" className="w-full justify-start">
                  <a
                    href="https://www.w3.org/WAI/WCAG22/Understanding/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Understanding WCAG 2.2
                  </a>
                </Button>
              </CardContent>
            </Card>
          </aside>
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

function getTaskNote(task: { learnerNote?: string; whyThisMatters?: string }) {
  return task.learnerNote ?? task.whyThisMatters ?? "";
}
