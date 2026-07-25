"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type ComponentTypeRow = NonNullable<ReturnType<typeof useQuery<typeof api.componentTypes.list>>>[number];
type WcagCriterion = NonNullable<ReturnType<typeof useQuery<typeof api.wcag.listCriteria>>>[number];

export default function ComponentTypesPage() {
  const componentTypes = useQuery(api.componentTypes.list, {});
  const wcagCriteria = useQuery(api.wcag.listCriteria);
  const seedDefaults = useMutation(api.componentTypes.seedDefaults);
  const seedWcagDefaults = useMutation(api.wcag.seedDefaults);
  const seedWcagMappings = useMutation(api.componentTypes.seedWcagMappingsFromChecks);
  const createType = useMutation(api.componentTypes.createType);
  const updateType = useMutation(api.componentTypes.updateType);
  const archiveType = useMutation(api.componentTypes.archiveType);
  const addWcagMapping = useMutation(api.componentTypes.addWcagMapping);
  const removeWcagMapping = useMutation(api.componentTypes.removeWcagMapping);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ComponentTypeRow | null>(null);
  const [mappingType, setMappingType] = useState<ComponentTypeRow | null>(null);
  const [message, setMessage] = useState("");
  const hasRequestedMappingSeed = useRef(false);

  useEffect(() => {
    if (componentTypes && componentTypes.length === 0) {
      void seedDefaults();
    }
  }, [componentTypes, seedDefaults]);

  useEffect(() => {
    if (wcagCriteria && wcagCriteria.length < 80) {
      void seedWcagDefaults();
    }
  }, [wcagCriteria, seedWcagDefaults]);

  useEffect(() => {
    if (
      !hasRequestedMappingSeed.current &&
      componentTypes &&
      componentTypes.length > 0 &&
      wcagCriteria &&
      wcagCriteria.length >= 80
    ) {
      hasRequestedMappingSeed.current = true;
      void seedWcagMappings();
    }
  }, [componentTypes, seedWcagMappings, wcagCriteria]);

  async function handleSaveType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const payload = {
      key: String(formData.get("key") ?? ""),
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || undefined,
      exampleUrls: parseLines(String(formData.get("exampleUrls") ?? "")),
    };

    if (!payload.key || !payload.name) {
      setMessage("Name and key are required.");
      return;
    }

    try {
      if (editingType) {
        await updateType({ typeId: editingType._id, ...payload });
        setMessage("Component type updated.");
      } else {
        await createType(payload);
        setMessage("Component type added.");
      }
      setDialogOpen(false);
      setEditingType(null);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Could not save component type.");
    }
  }

  async function handleSaveMapping(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!mappingType) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const wcagCriterionId = String(formData.get("wcagCriterionId") ?? "") as Id<"wcagCriteria">;
    const relevance = String(formData.get("relevance") ?? "common") as
      | "required"
      | "common"
      | "conditional";

    if (!wcagCriterionId) {
      setMessage("Choose a WCAG criterion.");
      return;
    }

    await addWcagMapping({
      componentTypeId: mappingType._id,
      wcagCriterionId,
      relevance,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    });
    setMappingDialogOpen(false);
    setMappingType(null);
    setMessage("WCAG mapping saved.");
  }

  if (componentTypes === undefined || wcagCriteria === undefined) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading component types...
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
            Component Types
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Manage reusable component patterns and example references.
          </p>
        </header>

        {message ? (
          <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Types</h2>
              <p className="mt-1 text-sm text-slate-600">
                Component type rows are available in audit component creation flows.
              </p>
            </div>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  setEditingType(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setEditingType(null)} type="button">
                  <Plus className="size-4" aria-hidden="true" />
                  Add
                </Button>
              </DialogTrigger>
              <TypeDialogForm editingType={editingType} onSubmit={handleSaveType} />
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Key</th>
                  <th className="px-4 py-3 font-semibold">Checks</th>
                  <th className="px-4 py-3 font-semibold">WCAG mappings</th>
                  <th className="px-4 py-3 font-semibold">Example URLs</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {componentTypes.length ? (
                  componentTypes.map((type) => (
                    <tr key={type._id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-950">{type.name}</div>
                        {type.description ? (
                          <div className="mt-1 max-w-lg text-slate-600">{type.description}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">{type.key}</td>
                      <td className="px-4 py-4">{type.checks.length}</td>
                      <td className="px-4 py-4">
                        <div className="flex max-w-80 flex-wrap gap-1">
                          {type.wcagMappings.map((mapping) =>
                            mapping.criterion ? (
                              <button
                                className="inline-flex min-h-6 items-center rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                                key={mapping._id}
                                onClick={() =>
                                  void removeWcagMapping({ mappingId: mapping._id })
                                }
                                title="Remove mapping"
                                type="button"
                              >
                                {mapping.criterion.criterion}
                              </button>
                            ) : null,
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {type.exampleUrls.map((url) => (
                            <Badge key={url} variant="info">
                              URL
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => {
                              setEditingType(type);
                              setDialogOpen(true);
                            }}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => {
                              setMappingType(type);
                              setMappingDialogOpen(true);
                            }}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            Map WCAG
                          </Button>
                          <Button
                            aria-label={`Delete ${type.name}`}
                            onClick={() => void archiveType({ typeId: type._id })}
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
                    <td className="px-4 py-10 text-center text-slate-600" colSpan={6}>
                      No component types yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <Dialog
          open={mappingDialogOpen}
          onOpenChange={(open) => {
            setMappingDialogOpen(open);
            if (!open) {
              setMappingType(null);
            }
          }}
        >
          <MappingDialogForm
            componentType={mappingType}
            criteria={wcagCriteria}
            onSubmit={handleSaveMapping}
          />
        </Dialog>
      </div>
    </AppShell>
  );
}

function MappingDialogForm({
  componentType,
  criteria,
  onSubmit,
}: {
  componentType: ComponentTypeRow | null;
  criteria: WcagCriterion[];
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Map WCAG criterion</DialogTitle>
        <DialogDescription>
          {componentType
            ? `Associate a WCAG success criterion with ${componentType.name}.`
            : "Associate a WCAG success criterion with this component type."}
        </DialogDescription>
      </DialogHeader>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="mapping-criterion">WCAG criterion</Label>
          <select
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            id="mapping-criterion"
            name="wcagCriterionId"
          >
            {criteria.map((criterion) => (
              <option key={criterion._id} value={criterion._id}>
                {criterion.criterion} {criterion.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mapping-relevance">Relevance</Label>
          <select
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            id="mapping-relevance"
            name="relevance"
          >
            <option value="common">Common</option>
            <option value="required">Required</option>
            <option value="conditional">Conditional</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mapping-notes">Notes</Label>
          <Textarea id="mapping-notes" name="notes" />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save mapping</Button>
        </div>
      </form>
    </DialogContent>
  );
}

function TypeDialogForm({
  editingType,
  onSubmit,
}: {
  editingType: ComponentTypeRow | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editingType ? "Edit component type" : "Add component type"}</DialogTitle>
        <DialogDescription>
          Example URLs can include W3C/WAI pattern pages, APG examples, or internal references.
        </DialogDescription>
      </DialogHeader>
      <form className="space-y-4" key={editingType?._id ?? "new"} onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type-name">Name</Label>
            <Input defaultValue={editingType?.name ?? ""} id="type-name" name="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type-key">Key</Label>
            <Input defaultValue={editingType?.key ?? ""} id="type-key" name="key" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type-description">Description</Label>
          <Textarea
            defaultValue={editingType?.description ?? ""}
            id="type-description"
            name="description"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type-examples">Example URLs</Label>
          <Textarea
            defaultValue={editingType?.exampleUrls.join("\n") ?? ""}
            id="type-examples"
            name="exampleUrls"
            placeholder="One URL per line"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </DialogContent>
  );
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
