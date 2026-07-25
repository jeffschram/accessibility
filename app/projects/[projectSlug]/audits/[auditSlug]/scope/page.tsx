"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ExternalLink, Layers, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { AppShell } from "@/components/app/app-shell";
import { Breadcrumbs } from "@/components/app/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";

type Priority = "critical" | "high" | "medium" | "low";
type Filter = "all" | "included" | "excluded" | "proposed" | "promoted";

const selectClassName =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600";

const filterLabels: Record<Filter, string> = {
  all: "Everything",
  included: "Included in scope",
  excluded: "Not included",
  proposed: "Proposed sample",
  promoted: "Already in inventory",
};

type ScopeItem = FunctionReturnType<typeof api.scope.listByAudit>[number];

export default function ScopeReviewPage() {
  const params = useParams<{ projectSlug: string; auditSlug: string }>();
  const { projectSlug, auditSlug } = params;

  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const resolved = useQuery(api.audits.getBySlug, { projectSlug, auditSlug });
  const auditId = resolved?.audit._id;

  const items = useQuery(api.scope.listByAudit, auditId ? { auditId } : "skip");
  const summary = useQuery(api.scope.getCounts, auditId ? { auditId } : "skip");

  const setIncluded = useMutation(api.scope.setIncluded);
  const setClusterIncluded = useMutation(api.scope.setClusterIncluded);
  const setPriority = useMutation(api.scope.setPriority);
  const promote = useMutation(api.inventory.promoteScopeItems);

  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteResult, setPromoteResult] = useState("");

  const clusters = useMemo(() => groupIntoClusters(items ?? [], filter), [items, filter]);
  const visibleCount = clusters.reduce((total, cluster) => total + cluster.items.length, 0);

  if (resolved === undefined) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading scope...
        </div>
      </AppShell>
    );
  }

  if (resolved === null) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: `/projects/${projectSlug}`, label: "Project" },
              { label: "Audit not found" },
            ]}
          />
          <Card>
            <CardContent className="p-6">
              <h1 className="text-lg font-semibold text-slate-950">Audit not found</h1>
              <p className="mt-2 text-sm text-slate-600">
                This audit may have been deleted or the link may be incorrect.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (items === undefined || summary === undefined) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading discovered pages...
        </div>
      </AppShell>
    );
  }

  async function handlePromote() {
    if (!auditId) return;

    setIsPromoting(true);
    setPromoteResult("");
    try {
      const result = await promote({ auditId });
      const parts = [`${result.created} page${result.created === 1 ? "" : "s"} added`];
      if (result.adopted) parts.push(`${result.adopted} already in the inventory`);
      if (result.skipped) parts.push(`${result.skipped} previously promoted`);
      setPromoteResult(`${parts.join(", ")}.`);
    } catch (caught) {
      setPromoteResult(
        caught instanceof Error ? caught.message : "Could not promote pages.",
      );
    } finally {
      setIsPromoting(false);
    }
  }

  function toggleCluster(key: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: `/projects/${projectSlug}`, label: resolved.project.name },
            { href: `/projects/${projectSlug}/audits/${auditSlug}`, label: resolved.audit.name },
            { label: "Scope" },
          ]}
        />

        <header className="border-b border-slate-200 pb-6">
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            Scope review
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Pages found by discovery, grouped by the template that rendered them. An audit
            samples representative pages rather than testing every URL, so include the ones
            worth testing and promote them into the inventory. Nothing here is in scope until
            you include it.
          </p>
        </header>

        <section aria-label="Scope summary" className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Discovered" value={summary.counts.total} />
          <SummaryCard label="Included" value={summary.counts.included} />
          <SummaryCard label="Not included" value={summary.counts.excluded} />
          <SummaryCard label="In inventory" value={summary.counts.promoted} />
        </section>

        {summary.counts.total === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
            <Layers className="mx-auto mb-3 size-8 text-slate-400" aria-hidden="true" />
            <p className="text-sm text-slate-600">
              No pages discovered yet. Run{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">
                npm run discover -- --audit {auditId} --cluster &lt;site url&gt;
              </code>{" "}
              to populate this list.
            </p>
          </div>
        ) : (
          <>
            <section
              aria-label="Filters and actions"
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="w-full max-w-xs space-y-2">
                  <Label htmlFor="scope-filter">Show</Label>
                  <select
                    className={selectClassName}
                    id="scope-filter"
                    onChange={(event) => setFilter(event.target.value as Filter)}
                    value={filter}
                  >
                    {Object.entries(filterLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button disabled={isPromoting} onClick={handlePromote} type="button">
                  {isPromoting ? "Adding..." : "Add included pages to inventory"}
                </Button>
              </div>

              <p aria-live="polite" className="mt-4 text-sm text-slate-600">
                {clusters.length === 1
                  ? `1 template, ${visibleCount} page${visibleCount === 1 ? "" : "s"}.`
                  : `${clusters.length} templates, ${visibleCount} page${visibleCount === 1 ? "" : "s"}.`}
                {promoteResult ? ` ${promoteResult}` : ""}
              </p>
            </section>

            <ul className="space-y-3">
              {clusters.map((cluster) => {
                const isOpen = expanded.has(cluster.key);
                const includedInCluster = cluster.items.filter((item) => item.included).length;

                return (
                  <li key={cluster.key}>
                    <Card>
                      <CardContent className="p-0">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                          <button
                            aria-expanded={isOpen}
                            className="flex min-w-0 items-center gap-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                            onClick={() => toggleCluster(cluster.key)}
                            type="button"
                          >
                            <ChevronRight
                              aria-hidden="true"
                              className={`size-4 shrink-0 text-slate-500 transition-transform ${
                                isOpen ? "rotate-90" : ""
                              }`}
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-slate-950">
                                {cluster.label}
                              </span>
                              <span className="mt-0.5 block text-sm text-slate-600">
                                {cluster.items.length} page
                                {cluster.items.length === 1 ? "" : "s"}, {includedInCluster} included
                              </span>
                            </span>
                          </button>

                          <div className="flex flex-wrap items-center gap-2">
                            {cluster.patterns.length > 1 ? (
                              <Badge variant="info">{cluster.patterns.length} route patterns</Badge>
                            ) : null}
                            <Button
                              onClick={() =>
                                void setClusterIncluded({
                                  auditId: auditId!,
                                  clusterKey: cluster.key,
                                  included: includedInCluster !== cluster.items.length,
                                })
                              }
                              size="sm"
                              type="button"
                              variant="secondary"
                            >
                              {includedInCluster === cluster.items.length
                                ? "Exclude all"
                                : "Include all"}
                            </Button>
                          </div>
                        </div>

                        {isOpen ? (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-left text-sm">
                              <caption className="sr-only">
                                Pages in the {cluster.label} template
                              </caption>
                              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                                <tr>
                                  <th className="px-4 py-3 font-semibold" scope="col">
                                    Page
                                  </th>
                                  <th className="px-4 py-3 font-semibold" scope="col">
                                    Status
                                  </th>
                                  <th className="px-4 py-3 font-semibold" scope="col">
                                    Priority
                                  </th>
                                  <th className="px-4 py-3 text-right font-semibold" scope="col">
                                    In scope
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {cluster.items.map((item) => (
                                  <tr key={item._id} className="align-top">
                                    <td className="px-4 py-4">
                                      <div className="font-medium text-slate-950">{item.name}</div>
                                      {item.url ? (
                                        <a
                                          className="mt-1 inline-flex items-center gap-1 text-sm text-sky-700 underline underline-offset-2"
                                          href={item.url}
                                          rel="noreferrer"
                                          target="_blank"
                                        >
                                          {item.url}
                                          <ExternalLink className="size-3.5" aria-hidden="true" />
                                          <span className="sr-only">(opens in a new tab)</span>
                                        </a>
                                      ) : null}
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="flex flex-wrap gap-1">
                                        {item.isRepresentative ? (
                                          <Badge variant="info">
                                            <Sparkles
                                              aria-hidden="true"
                                              className="mr-1 size-3.5"
                                            />
                                            Proposed
                                          </Badge>
                                        ) : null}
                                        {item.promotedPageId ? (
                                          <Badge variant="low">In inventory</Badge>
                                        ) : null}
                                        <Badge>{item.discoverySource ?? "manual"}</Badge>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <Label
                                        className="sr-only"
                                        htmlFor={`priority-${item._id}`}
                                      >
                                        Priority for {item.name}
                                      </Label>
                                      <select
                                        className={selectClassName}
                                        id={`priority-${item._id}`}
                                        onChange={(event) =>
                                          void setPriority({
                                            scopeItemIds: [item._id],
                                            priority: event.target.value as Priority,
                                          })
                                        }
                                        value={item.priority}
                                      >
                                        <option value="critical">Critical</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                      </select>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      <label className="inline-flex items-center gap-2">
                                        <input
                                          checked={item.included}
                                          className="size-4 rounded border-slate-300 text-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                                          onChange={(event) =>
                                            void setIncluded({
                                              scopeItemIds: [item._id],
                                              included: event.target.checked,
                                            })
                                          }
                                          type="checkbox"
                                        />
                                        <span className="text-sm text-slate-700">
                                          Include
                                          <span className="sr-only"> {item.name}</span>
                                        </span>
                                      </label>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}

type Cluster = {
  key: string;
  label: string;
  patterns: string[];
  items: ScopeItem[];
};

function groupIntoClusters(items: ScopeItem[], filter: Filter): Cluster[] {
  const matches = items.filter((item) => {
    switch (filter) {
      case "included":
        return item.included;
      case "excluded":
        return !item.included;
      case "proposed":
        return Boolean(item.isRepresentative);
      case "promoted":
        return Boolean(item.promotedPageId);
      default:
        return true;
    }
  });

  const clusters = new Map<string, Cluster>();

  for (const item of matches) {
    const key = item.clusterKey ?? item.routePattern ?? item.url ?? item._id;
    const cluster = clusters.get(key) ?? {
      key,
      label: "",
      patterns: [],
      items: [],
    };

    cluster.items.push(item);
    const pattern = item.routePattern ?? item.url ?? item.name;
    if (!cluster.patterns.includes(pattern)) {
      cluster.patterns.push(pattern);
    }
    clusters.set(key, cluster);
  }

  for (const cluster of clusters.values()) {
    cluster.label =
      cluster.patterns.length === 1
        ? cluster.patterns[0]
        : `${cluster.patterns.slice(0, 3).join(", ")}${
            cluster.patterns.length > 3 ? ` and ${cluster.patterns.length - 3} more` : ""
          }`;
    cluster.items.sort((first, second) =>
      (first.url ?? first.name).localeCompare(second.url ?? second.name),
    );
  }

  return [...clusters.values()].sort((first, second) => second.items.length - first.items.length);
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}
