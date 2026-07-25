"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Breadcrumbs } from "@/components/app/breadcrumbs";
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

export default function AuditPageDetailPage() {
  const params = useParams<{ projectSlug: string; auditSlug: string; pageId: string }>();
  const { projectSlug, auditSlug } = params;
  const pageId = params.pageId as Id<"auditPages">;
  const resolved = useQuery(api.audits.getBySlug, { projectSlug, auditSlug });
  const auditId = resolved?.audit._id;
  const pageDetail = useQuery(api.inventory.getPageDetail, { pageId });
  const componentTypeOptions = useQuery(api.componentTypes.listActiveOptions);
  const createComponent = useMutation(api.inventory.createComponent);
  const attachComponentToPage = useMutation(api.inventory.attachComponentToPage);
  const deleteComponent = useMutation(api.inventory.removeComponent);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [componentMode, setComponentMode] = useState<"new" | "existing">("new");
  const [existingComponentId, setExistingComponentId] = useState("");
  const [componentName, setComponentName] = useState("");
  const [componentType, setComponentType] = useState("custom");
  const [componentDescription, setComponentDescription] = useState("");
  const [instanceNotes, setInstanceNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSaveComponent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!pageDetail?.page || !auditId) {
      setError("Page is not loaded.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (componentMode === "existing") {
        if (!existingComponentId) {
          setError("Choose an existing component.");
          setIsSubmitting(false);
          return;
        }

        await attachComponentToPage({
          auditId,
          pageId,
          componentId: existingComponentId as Id<"auditComponents">,
          notes: instanceNotes.trim() || undefined,
        });
      } else {
        const trimmedName = componentName.trim();
        if (!trimmedName) {
          setError("Component name is required.");
          setIsSubmitting(false);
          return;
        }

        await createComponent({
          auditId,
          pageId,
          name: trimmedName,
          componentType,
          scope: "shared",
          description: componentDescription.trim() || undefined,
          instanceNotes: instanceNotes.trim() || undefined,
        });
      }

      resetForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save component.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setDialogOpen(false);
    setComponentMode("new");
    setExistingComponentId("");
    setComponentName("");
    setComponentType("custom");
    setComponentDescription("");
    setInstanceNotes("");
    setError("");
  }

  if (
    resolved === undefined ||
    pageDetail === undefined ||
    componentTypeOptions === undefined
  ) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading page...
        </div>
      </AppShell>
    );
  }

  if (resolved === null || pageDetail === null) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: `/projects/${projectSlug}/audits/${auditSlug}`, label: "Audit" },
              { label: "Page not found" },
            ]}
          />
          <Card>
            <CardContent className="p-6">
              <h1 className="text-lg font-semibold text-slate-950">Page not found</h1>
              <p className="mt-2 text-sm text-slate-600">
                This page may have been deleted or the link may be incorrect.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const attachedComponents = pageDetail.instances.flatMap((instance) => {
    const component = pageDetail.components.find(
      (candidate) => candidate._id === instance.componentId,
    );

    return component ? [{ instance, component }] : [];
  });
  const pageAvailableComponents = pageDetail.components.filter(
    (component) => component.scope !== "global",
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: `/projects/${projectSlug}`, label: resolved.project.name },
            { href: `/projects/${projectSlug}/audits/${auditSlug}`, label: resolved.audit.name },
            { label: pageDetail.page.name },
          ]}
        />

        <header className="border-b border-slate-200 pb-6">
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            {pageDetail.page.name}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {pageDetail.page.description ||
              "Manage page-level checks and the components used on this page."}
          </p>
        </header>

        <section aria-label="Page summary" className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Route or URL" value={pageDetail.page.url || "Not set"} />
          <SummaryCard label="Priority" value={pageDetail.page.priority} />
          <SummaryCard label="Status" value={pageDetail.page.testStatus.replaceAll("_", " ")} />
          <SummaryCard label="Components" value={attachedComponents.length.toString()} />
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Components On This Page</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add a page component pattern or reuse one already created for this audit.
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" aria-hidden="true" />
                  Add component
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add component</DialogTitle>
                  <DialogDescription>
                    Create a page component or attach an existing page component to this page.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSaveComponent}>
                  {pageAvailableComponents.length ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setComponentMode("new")}
                        type="button"
                        variant={componentMode === "new" ? "primary" : "secondary"}
                      >
                        New component
                      </Button>
                      <Button
                        onClick={() => setComponentMode("existing")}
                        type="button"
                        variant={componentMode === "existing" ? "primary" : "secondary"}
                      >
                        Existing component
                      </Button>
                    </div>
                  ) : null}

                  {componentMode === "existing" ? (
                    <div className="space-y-2">
                      <Label htmlFor="existing-component">Component</Label>
                      <select
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                        id="existing-component"
                        onChange={(event) => setExistingComponentId(event.target.value)}
                        value={existingComponentId}
                      >
                        <option value="">Choose a component</option>
                        {pageAvailableComponents.map((component) => (
                          <option key={component._id} value={component._id}>
                            {component.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="component-name">Component name</Label>
                        <Input
                          id="component-name"
                          onChange={(event) => setComponentName(event.target.value)}
                          placeholder="Example: Main navigation"
                          value={componentName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="component-type">Type</Label>
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                          id="component-type"
                          onChange={(event) => setComponentType(event.target.value)}
                          value={componentType}
                        >
                          {componentTypeOptions.map((type) => (
                            <option key={type.key} value={type.key}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="component-description">Description</Label>
                        <Textarea
                          id="component-description"
                          onChange={(event) => setComponentDescription(event.target.value)}
                          placeholder="What behavior or pattern should be audited?"
                          value={componentDescription}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="instance-notes">Notes for this page</Label>
                    <Textarea
                      id="instance-notes"
                      onChange={(event) => setInstanceNotes(event.target.value)}
                      placeholder="Page-specific usage, variants, or context."
                      value={instanceNotes}
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
                      onClick={resetForm}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button disabled={isSubmitting} type="submit">
                      {isSubmitting ? "Saving..." : "Save component"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Component</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attachedComponents.length ? (
                  attachedComponents.map(({ component }) => (
                    <tr key={component?._id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-950">{component?.name}</div>
                        {component?.description ? (
                          <div className="mt-1 text-sm text-slate-600">{component.description}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">{component?.componentType}</td>
                      <td className="px-4 py-4">
                        <Badge>{component?.testStatus.replaceAll("_", " ")}</Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {component ? (
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="secondary">
                              <Link
                                href={`/projects/${projectSlug}/audits/${auditSlug}/components/${component._id}`}
                              >
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
                        ) : null}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-600" colSpan={4}>
                      <ClipboardList className="mx-auto mb-3 size-8 text-slate-400" aria-hidden="true" />
                      No components attached to this page yet.
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

