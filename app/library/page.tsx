"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Library, ListChecks } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const libraryAreas = [
  {
    href: "/library/component-types",
    title: "Component Types",
    description: "Manage reusable component patterns and example references.",
    icon: Library,
  },
  {
    href: "/library/audit-checks",
    title: "Audit Checks",
    description: "Manage reusable check templates associated with component types.",
    icon: ClipboardCheck,
  },
  {
    href: "/library/wcag",
    title: "WCAG Criteria",
    description: "Review the seeded WCAG 2.2 success criteria used as source references.",
    icon: ListChecks,
  },
];

export default function LibraryPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-sky-700">Audit Library</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            Library
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Manage reusable audit building blocks outside individual projects and audits.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {libraryAreas.map((area) => (
            <Card key={area.href}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    <area.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-slate-950">{area.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {area.description}
                    </p>
                    <Button asChild className="mt-4" size="sm" variant="secondary">
                      <Link href={area.href}>
                        Open
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
