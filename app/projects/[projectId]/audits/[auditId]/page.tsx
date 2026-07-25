"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardCheck, ClipboardList, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { Id } from "@/convex/_generated/dataModel";

type Priority = "critical" | "high" | "medium" | "low";

export default function AuditDetailPage() {
  const params = useParams<{ projectId: string; auditId: string }>();
  const projectId = params.projectId as Id<"projects">;
  const auditId = params.auditId as Id<"audits">;
  const project = useQuery(api.projects.get, { projectId });
  const audit = useQuery(api.audits.get, { auditId });
  const inventory = useQuery(api.inventory.getByAudit, { auditId });
  const componentTypeOptions = useQuery(api.componentTypes.listActiveOptions);
  const createPage = useMutation(api.inventory.createPage);
  const createComponent = useMutation(api.inventory.createComponent);
  const deletePage = useMutation(api.inventory.removePage);
  const deleteComponent = useMutation(api.inventory.removeComponent);

  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [globalDialogOpen, setGlobalDialogOpen] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [pagePriority, setPagePriority] = useState<Priority>("medium");
  const [globalComponentName, setGlobalComponentName] = useState("");
  const [globalComponentType, setGlobalComponentType] = useState("navigation");
  const [globalComponentDescription, setGlobalComponentDescription] = useState("");
  const [error, setError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGlobalSubmitting, setIsGlobalSubmitting] = useState(false);

  async function handleCreatePage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = pageName.trim();
    if (!trimmedName) {
      setError("Page name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPage({
        auditId,
        name: trimmedName,
        url: pageUrl.trim() || undefined,
        description: pageDescription.trim() || undefined,
        priority: pagePriority,
      });
      setPageName("");
      setPageUrl("");
      setPageDescription("");
      setPagePriority("medium");
      setPageDialogOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create page.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateGlobalComponent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGlobalError("");

    const trimmedName = globalComponentName.trim();
    if (!trimmedName) {
      setGlobalError("Component name is required.");
      return;
    }

    setIsGlobalSubmitting(true);
    try {
      await createComponent({
        auditId,
        name: trimmedName,
        componentType: globalComponentType,
        scope: "global",
        description: globalComponentDescription.trim() || undefined,
      });
      setGlobalComponentName("");
      setGlobalComponentType("navigation");
      setGlobalComponentDescription("");
      setGlobalDialogOpen(false);
    } catch (caught) {
      setGlobalError(caught instanceof Error ? caught.message : "Could not create global component.");
    } finally {
      setIsGlobalSubmitting(false);
    }
  }

  if (
    project === undefined ||
    audit === undefined ||
    inventory === undefined ||
    componentTypeOptions === undefined
  ) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading audit...
        </div>
      </AppShell>
    );
  }

  if (project === null || audit === null) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Button asChild variant="secondary">
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to project
            </Link>
          </Button>
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

  const globalComponents = inventory.components.filter(
    (component) => component.scope === "global",
  );
  const pageComponents = inventory.components.filter(
    (component) => component.scope !== "global",
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="secondary">
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to project
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/projects/${projectId}/audits/${auditId}/triage`}>
              <ClipboardCheck className="size-4" aria-hidden="true" />
              Triage queue
            </Link>
          </Button>
        </div>

        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-sky-700">{project.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            {audit.name}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {audit.summary ||
              "Define global components, pages, and page-level components for this audit."}
          </p>
        </header>

        <section aria-label="Audit summary" className="grid gap-3 md:grid-cols-5">
          <SummaryCard label="Status" value={audit.status} />
          <SummaryCard label="Target" value={`WCAG ${audit.wcagVersion} ${audit.conformanceLevel}`} />
          <SummaryCard label="Global components" value={globalComponents.length.toString()} />
          <SummaryCard label="Pages" value={inventory.pages.length.toString()} />
          <SummaryCard label="Page components" value={pageComponents.length.toString()} />
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Global Components</h2>
              <p className="mt-1 text-sm text-slate-600">
                Site-wide shell components such as navigation, footer, skip links, and global alerts.
              </p>
            </div>
            <Dialog open={globalDialogOpen} onOpenChange={setGlobalDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" aria-hidden="true" />
                  Add global component
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add global component</DialogTitle>
                  <DialogDescription>
                    Create a site-wide component that should be audited once for the whole site or application.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateGlobalComponent}>
                  <div className="space-y-2">
                    <Label htmlFor="global-component-name">Component name</Label>
                    <Input
                      id="global-component-name"
                      onChange={(event) => setGlobalComponentName(event.target.value)}
                      placeholder="Example: Main navigation"
                      value={globalComponentName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="global-component-type">Type</Label>
                    <select
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                      id="global-component-type"
                      onChange={(event) => setGlobalComponentType(event.target.value)}
                      value={globalComponentType}
                    >
                      {componentTypeOptions.map((type) => (
                        <option key={type.key} value={type.key}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="global-component-description">Description</Label>
                    <Textarea
                      id="global-component-description"
                      onChange={(event) => setGlobalComponentDescription(event.target.value)}
                      placeholder="Where it appears or what behavior should be audited."
                      value={globalComponentDescription}
                    />
                  </div>
                  {globalError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {globalError}
                    </p>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button
                      disabled={isGlobalSubmitting}
                      onClick={() => setGlobalDialogOpen(false)}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button disabled={isGlobalSubmitting} type="submit">
                      {isGlobalSubmitting ? "Adding..." : "Add global component"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Component</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {globalComponents.length ? (
                  globalComponents.map((component) => (
                    <tr key={component._id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-950">{component.name}</div>
                        {component.description ? (
                          <div className="mt-1 text-slate-600">{component.description}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">{component.componentType}</td>
                      <td className="px-4 py-4">
                        <Badge>{component.testStatus.replaceAll("_", " ")}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/projects/${projectId}/audits/${auditId}/components/${component._id}`}>
                              Open
                              <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                          </Button>
                          <Button
                            aria-label={`Delete ${component.name}`}
                            onClick={() => void deleteComponent({ componentId: component._id })}
                            size="icon"
                            type="button"
                            variant="danger"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-600" colSpan={4}>
                      No global components yet. Add site-wide components like navigation, footer, skip links, or global alerts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Pages</h2>
              <p className="mt-1 text-sm text-slate-600">
                Page-level inventory for this audit.
              </p>
            </div>
            <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" aria-hidden="true" />
                  Add page
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add page</DialogTitle>
                  <DialogDescription>
                    Add a page or route that will receive page-level checks like title, landmarks, headings, and reading order.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreatePage}>
                  <div className="space-y-2">
                    <Label htmlFor="page-name">Page name</Label>
                    <Input
                      id="page-name"
                      onChange={(event) => setPageName(event.target.value)}
                      placeholder="Example: Donation page"
                      value={pageName}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="page-url">URL or route</Label>
                      <Input
                        id="page-url"
                        onChange={(event) => setPageUrl(event.target.value)}
                        placeholder="/donate"
                        value={pageUrl}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="page-priority">Priority</Label>
                      <select
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                        id="page-priority"
                        onChange={(event) => setPagePriority(event.target.value as Priority)}
                        value={pagePriority}
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="page-description">Description</Label>
                    <Textarea
                      id="page-description"
                      onChange={(event) => setPageDescription(event.target.value)}
                      placeholder="What does this page include?"
                      value={pageDescription}
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
                      onClick={() => setPageDialogOpen(false)}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button disabled={isSubmitting} type="submit">
                      {isSubmitting ? "Adding..." : "Add page"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Page</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Components</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inventory.pages.length ? (
                  inventory.pages.map((page) => {
                    const componentCount = inventory.instances.filter(
                      (instance) => instance.pageId === page._id,
                    ).length;

                    return (
                      <tr key={page._id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-950">{page.name}</div>
                          <div className="mt-1 text-slate-600">{page.url || "No URL set"}</div>
                          {page.description ? (
                            <div className="mt-1 text-slate-600">{page.description}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <Badge>{page.priority}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge>{page.testStatus.replaceAll("_", " ")}</Badge>
                        </td>
                        <td className="px-4 py-4">{componentCount}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="secondary">
                              <Link href={`/projects/${projectId}/audits/${auditId}/pages/${page._id}`}>
                                Open
                                <ArrowRight className="size-4" aria-hidden="true" />
                              </Link>
                            </Button>
                            <Button
                              aria-label={`Delete ${page.name}`}
                              onClick={() => void deletePage({ pageId: page._id })}
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
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-600" colSpan={5}>
                      <ClipboardList className="mx-auto mb-3 size-8 text-slate-400" aria-hidden="true" />
                      No pages yet. Add the pages you want to audit first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Page Components</h2>
            <p className="mt-1 text-sm text-slate-600">
              Components currently identified on pages in this audit.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Component</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Scope</th>
                  <th className="px-4 py-3 font-semibold">Used on pages</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pageComponents.length ? (
                  pageComponents.map((component) => {
                    const usageCount = inventory.instances.filter(
                      (instance) => instance.componentId === component._id,
                    ).length;

                    return (
                      <tr key={component._id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-950">{component.name}</div>
                          {component.description ? (
                            <div className="mt-1 text-slate-600">{component.description}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">{component.componentType}</td>
                        <td className="px-4 py-4">{component.scope.replace("_", " ")}</td>
                        <td className="px-4 py-4">{usageCount}</td>
                        <td className="px-4 py-4">
                          <Badge>{component.testStatus.replaceAll("_", " ")}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="secondary">
                              <Link href={`/projects/${projectId}/audits/${auditId}/components/${component._id}`}>
                                Open
                                <ArrowRight className="size-4" aria-hidden="true" />
                              </Link>
                            </Button>
                            <Button
                              aria-label={`Delete ${component.name}`}
                              onClick={() => void deleteComponent({ componentId: component._id })}
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
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-600" colSpan={6}>
                      Components will appear here after they are added from a page detail view.
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
