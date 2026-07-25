"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Breadcrumbs } from "@/components/app/breadcrumbs";
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
type CheckRow = ComponentTypeRow["checks"][number] & {
  componentTypeId: Id<"componentTypes">;
  componentTypeName: string;
};

export default function AuditChecksPage() {
  const componentTypes = useQuery(api.componentTypes.list, {});
  const seedDefaults = useMutation(api.componentTypes.seedDefaults);
  const createCheckTemplate = useMutation(api.componentTypes.createCheckTemplate);
  const updateCheckTemplate = useMutation(api.componentTypes.updateCheckTemplate);
  const archiveCheckTemplate = useMutation(api.componentTypes.archiveCheckTemplate);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<CheckRow | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (componentTypes && componentTypes.length === 0) {
      void seedDefaults();
    }
  }, [componentTypes, seedDefaults]);

  const checks = useMemo(() => {
    if (!componentTypes) {
      return [];
    }

    return componentTypes
      .flatMap((type) =>
        type.checks.map((check) => ({
          ...check,
          componentTypeId: type._id,
          componentTypeName: type.name,
        })),
      )
      .sort((first, second) => {
        const typeSort = first.componentTypeName.localeCompare(second.componentTypeName);
        return typeSort || first.order - second.order;
      });
  }, [componentTypes]);

  async function handleSaveCheck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const componentTypeId = String(formData.get("componentTypeId") ?? "") as Id<"componentTypes">;
    const payload = {
      key: String(formData.get("key") ?? ""),
      title: String(formData.get("title") ?? "").trim(),
      instructions: String(formData.get("instructions") ?? "").trim(),
      expectedBehavior: String(formData.get("expectedBehavior") ?? "").trim(),
      wcagCriteria: parseCsv(String(formData.get("wcagCriteria") ?? "")),
      order: Number(formData.get("order") ?? 0),
    };

    if (!componentTypeId || !payload.key || !payload.title || !payload.instructions || !payload.expectedBehavior) {
      setMessage("Component type, key, title, instructions, and expected behavior are required.");
      return;
    }

    if (editingCheck) {
      await updateCheckTemplate({
        checkId: editingCheck._id,
        ...payload,
      });
      setMessage("Audit check updated.");
    } else {
      await createCheckTemplate({
        componentTypeId,
        key: payload.key,
        title: payload.title,
        instructions: payload.instructions,
        expectedBehavior: payload.expectedBehavior,
        wcagCriteria: payload.wcagCriteria,
      });
      setMessage("Audit check added.");
    }

    setDialogOpen(false);
    setEditingCheck(null);
  }

  if (componentTypes === undefined) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading audit checks...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: "/library", label: "Library" },
            { label: "Audit checks" },
          ]}
        />

        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-sky-700">Audit Library</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            Audit Checks
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Manage reusable check templates that are copied into components during audits.
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
              <h2 className="text-base font-semibold text-slate-950">Checks</h2>
              <p className="mt-1 text-sm text-slate-600">
                Each check belongs to a component type.
              </p>
            </div>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  setEditingCheck(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCheck(null)} type="button">
                  <Plus className="size-4" aria-hidden="true" />
                  Add
                </Button>
              </DialogTrigger>
              <CheckDialogForm
                componentTypes={componentTypes}
                editingCheck={editingCheck}
                onSubmit={handleSaveCheck}
              />
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Check</th>
                  <th className="px-4 py-3 font-semibold">Component type</th>
                  <th className="px-4 py-3 font-semibold">WCAG</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {checks.length ? (
                  checks.map((check) => (
                    <tr key={check._id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-950">{check.title}</div>
                        <div className="mt-1 max-w-xl text-slate-600">{check.instructions}</div>
                      </td>
                      <td className="px-4 py-4">{check.componentTypeName}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {check.wcagCriteria.map((criterion) => (
                            <Badge key={criterion} variant="info">
                              {criterion}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">{check.order}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => {
                              setEditingCheck(check);
                              setDialogOpen(true);
                            }}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            Edit
                          </Button>
                          <Button
                            aria-label={`Delete ${check.title}`}
                            onClick={() => void archiveCheckTemplate({ checkId: check._id })}
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
                    <td className="px-4 py-10 text-center text-slate-600" colSpan={5}>
                      No audit checks yet.
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

function CheckDialogForm({
  componentTypes,
  editingCheck,
  onSubmit,
}: {
  componentTypes: ComponentTypeRow[];
  editingCheck: CheckRow | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editingCheck ? "Edit audit check" : "Add audit check"}</DialogTitle>
        <DialogDescription>
          Checks are copied into components when a component is created from this type.
        </DialogDescription>
      </DialogHeader>
      <form className="space-y-4" key={editingCheck?._id ?? "new"} onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="check-component-type">Component type</Label>
          <select
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            defaultValue={editingCheck?.componentTypeId ?? componentTypes[0]?._id ?? ""}
            disabled={Boolean(editingCheck)}
            id="check-component-type"
            name="componentTypeId"
          >
            {componentTypes.map((type) => (
              <option key={type._id} value={type._id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_100px]">
          <div className="space-y-2">
            <Label htmlFor="check-title">Title</Label>
            <Input defaultValue={editingCheck?.title ?? ""} id="check-title" name="title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="check-key">Key</Label>
            <Input defaultValue={editingCheck?.key ?? ""} id="check-key" name="key" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="check-order">Order</Label>
            <Input
              defaultValue={editingCheck?.order ?? 0}
              id="check-order"
              name="order"
              type="number"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="check-wcag">WCAG criteria</Label>
          <Input
            defaultValue={editingCheck?.wcagCriteria.join(", ") ?? ""}
            id="check-wcag"
            name="wcagCriteria"
            placeholder="2.1.1, 2.4.7, 4.1.2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="check-instructions">Instructions</Label>
          <Textarea
            defaultValue={editingCheck?.instructions ?? ""}
            id="check-instructions"
            name="instructions"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="check-expected">Expected behavior</Label>
          <Textarea
            defaultValue={editingCheck?.expectedBehavior ?? ""}
            id="check-expected"
            name="expectedBehavior"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </DialogContent>
  );
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
