"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

export default function WcagCriteriaPage() {
  const criteria = useQuery(api.wcag.listCriteria);
  const seedDefaults = useMutation(api.wcag.seedDefaults);

  useEffect(() => {
    if (criteria && criteria.length < 80) {
      void seedDefaults();
    }
  }, [criteria, seedDefaults]);

  if (criteria === undefined) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading WCAG criteria...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Button asChild variant="secondary">
            <Link href="/library">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to library
            </Link>
          </Button>
        </div>

        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-sky-700">Audit Library</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            WCAG Criteria
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            WCAG 2.2 success criteria are stored as source references for mappings and audit procedures.
          </p>
        </header>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Criterion</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Guideline</th>
                  <th className="px-4 py-3 font-semibold">Automation</th>
                  <th className="px-4 py-3 text-right font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {criteria.length ? (
                  criteria.map((criterion) => (
                    <tr key={criterion._id} className="align-top">
                      <td className="px-4 py-4 font-mono font-semibold text-slate-950">
                        {criterion.criterion}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-950">{criterion.title}</div>
                        <div className="mt-1 max-w-xl text-slate-600">
                          {criterion.plainLanguageSummary}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge>{criterion.level}</Badge>
                      </td>
                      <td className="px-4 py-4">{criterion.guideline}</td>
                      <td className="px-4 py-4 capitalize">
                        {criterion.automationPotential}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button asChild size="sm" variant="secondary">
                          <a href={criterion.url} rel="noreferrer" target="_blank">
                            Open
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-600" colSpan={6}>
                      No WCAG criteria yet. Defaults are being seeded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
