"use client";

import { CheckCircle2, CircleHelp, Keyboard, TriangleAlert } from "lucide-react";
import { useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { guidanceTasks, scopeItems } from "@/lib/accessibility/sample-data";

export default function TestingPage() {
  const liveScopeItems = useQuery(api.dashboard.summary)?.scopeItems ?? scopeItems;
  const liveGuidanceTasks = useQuery(api.guidance.listTasks) ?? guidanceTasks;
  const task = liveGuidanceTasks[0];
  const taskWcag = getTaskWcag(task);
  const failures = getTaskFailures(task);

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-sky-700">Guided manual testing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            Keyboard audit workspace
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Track the task result and keep WCAG references and expected
            behavior visible while testing.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Scope Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {liveScopeItems.map((item) => (
                  <li
                    key={getItemId(item)}
                    className="rounded-md border border-slate-200 p-3 text-sm"
                  >
                    <div className="font-medium text-slate-950">{item.name}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge>{item.type}</Badge>
                      <Badge>{getScopeStatus(item).replaceAll("_", " ")}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                  <Keyboard className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>{task.title}</CardTitle>
                  <p className="mt-1 text-sm text-slate-600">Result: not started</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">How to test</h2>
                <ol className="mt-3 space-y-3">
                  {task.howToTest.map((step) => (
                    <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {["Pass", "Fail", "Blocked", "Needs expert review"].map((result) => (
                  <button
                    key={result}
                    className="rounded-md border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                    type="button"
                  >
                    {result}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-950">Testing notes</span>
                <textarea
                  className="mt-2 min-h-32 w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                  placeholder="Record what happened, what was announced, and any uncertainty."
                />
              </label>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Why This Matters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-slate-700">
                <p>{task.whyThisMatters}</p>
                <p>{getTaskNote(task)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related WCAG</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {taskWcag.map((criterion) => (
                    <Badge key={criterion} variant="info">
                      {criterion}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Failures</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {failures.map((failure) => (
                    <li key={failure} className="flex gap-2 text-sm leading-6 text-slate-700">
                      <TriangleAlert className="mt-1 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                      <span>{failure}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Judgment Note</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2 text-sm leading-6 text-slate-700">
                <CircleHelp className="mt-1 size-4 shrink-0 text-sky-700" aria-hidden="true" />
                <p>
                  If behavior differs by component pattern, mark the result as needs expert
                  review and record the expected pattern you used.
                </p>
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

function getScopeStatus(item: { status?: string; testStatus?: string }) {
  return item.status ?? item.testStatus ?? "not_started";
}

function getTaskWcag(task: { relatedWcag?: string[]; relatedWcagCriteria?: string[] }) {
  return task.relatedWcag ?? task.relatedWcagCriteria ?? [];
}

function getTaskFailures(task: { commonFailures?: string[]; failureExamples?: string[] }) {
  return task.commonFailures ?? task.failureExamples ?? [];
}

function getTaskNote(task: { learnerNote?: string; whyThisMatters?: string }) {
  return (
    task.learnerNote ??
    task.whyThisMatters ??
    "Use this task to connect the manual test result to the related WCAG expectations."
  );
}
