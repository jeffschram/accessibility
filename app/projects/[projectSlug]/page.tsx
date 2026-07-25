"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
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

export default function ProjectDetailPage() {
  const params = useParams<{ projectSlug: string }>();
  const router = useRouter();
  const projectSlug = params.projectSlug;
  const project = useQuery(api.projects.getBySlug, { slug: projectSlug });
  const audits = useQuery(
    api.audits.listByProject,
    project ? { projectId: project._id } : "skip",
  );
  const createAudit = useMutation(api.audits.create);
  const deleteAudit = useMutation(api.audits.remove);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteAuditId, setDeleteAuditId] = useState<Id<"audits"> | null>(null);
  const [deleteAuditName, setDeleteAuditName] = useState("");
  const [auditName, setAuditName] = useState("");
  const [environmentName, setEnvironmentName] = useState("");
  const [environmentUrl, setEnvironmentUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCreateAudit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = auditName.trim();
    if (!trimmedName) {
      setError("Audit name is required.");
      return;
    }

    if (!project) {
      setError("Project is not loaded.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createAudit({
        projectId: project._id,
        name: trimmedName,
        wcagVersion: project.defaultWcagVersion,
        conformanceLevel: project.defaultConformanceLevel,
        environmentName: environmentName.trim() || undefined,
        environmentUrl: environmentUrl.trim() || undefined,
        summary: summary.trim() || undefined,
      });
      setAuditName("");
      setEnvironmentName("");
      setEnvironmentUrl("");
      setSummary("");
      setDialogOpen(false);
      router.push(`/projects/${project.slug}/audits/${created.slug}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create audit.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAudit() {
    if (!deleteAuditId) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAudit({ auditId: deleteAuditId });
      setDeleteAuditId(null);
      setDeleteAuditName("");
    } finally {
      setIsDeleting(false);
    }
  }

  if (project === undefined) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading project...
        </div>
      </AppShell>
    );
  }

  if (project === null) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to home
            </Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Project not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                This project may have been deleted or the link may be incorrect.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (audits === undefined) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading audits...
        </div>
      </AppShell>
    );
  }

  const conformanceTarget = `WCAG ${project.defaultWcagVersion} ${project.defaultConformanceLevel}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to home
            </Link>
          </Button>
        </div>

        <header className="border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-medium text-sky-700">Project</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
              {project.name}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {project.description || "Manage audits, scope, testing, findings, and reports for this project."}
            </p>
          </div>
        </header>

        <section aria-label="Project summary" className="grid gap-3 md:grid-cols-3">
          <SummaryCard label="Client or team" value={project.clientName || "Not set"} />
          <SummaryCard label="Default target" value={conformanceTarget} />
          <SummaryCard label="Audits" value={audits.length.toString()} />
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Audits</h2>
              <p className="mt-1 text-sm text-slate-600">
                Audit cycles for this project.
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" aria-hidden="true" />
                  New audit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create audit</DialogTitle>
                  <DialogDescription>
                    Start an audit cycle for this project. Scope and testing will be managed from the audit workspace.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateAudit}>
                  <div className="space-y-2">
                    <Label htmlFor="audit-name">Audit name</Label>
                    <Input
                      id="audit-name"
                      onChange={(event) => setAuditName(event.target.value)}
                      placeholder="Example: Baseline WCAG 2.2 AA audit"
                      value={auditName}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="environment-name">Environment</Label>
                      <Input
                        id="environment-name"
                        onChange={(event) => setEnvironmentName(event.target.value)}
                        placeholder="Staging"
                        value={environmentName}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="environment-url">Environment URL</Label>
                      <Input
                        id="environment-url"
                        onChange={(event) => setEnvironmentUrl(event.target.value)}
                        placeholder="https://staging.example.com"
                        type="url"
                        value={environmentUrl}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audit-summary">Summary</Label>
                    <Textarea
                      id="audit-summary"
                      onChange={(event) => setSummary(event.target.value)}
                      placeholder="Optional context, constraints, or testing notes."
                      value={summary}
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
                      onClick={() => setDialogOpen(false)}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button disabled={isSubmitting} type="submit">
                      {isSubmitting ? "Creating..." : "Create audit"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Audit</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">Environment</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {audits.length ? (
                  audits.map((audit) => (
                    <tr key={audit._id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-950">{audit.name}</div>
                        {audit.summary ? (
                          <div className="mt-1 text-sm text-slate-600">{audit.summary}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <Badge>{audit.status}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        WCAG {audit.wcagVersion} {audit.conformanceLevel}
                      </td>
                      <td className="px-4 py-4">
                        {audit.environmentUrl || audit.environmentName || "Not set"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/projects/${project.slug}/audits/${audit.slug ?? audit._id}`}>
                              Open audit
                            </Link>
                          </Button>
                          <Button
                            aria-label={`Delete ${audit.name}`}
                            onClick={() => {
                              setDeleteAuditId(audit._id);
                              setDeleteAuditName(audit.name);
                            }}
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
                    <td className="px-4 py-8 text-center text-slate-600" colSpan={5}>
                      <ClipboardList className="mx-auto mb-3 size-8 text-slate-400" aria-hidden="true" />
                      No audits yet. Create the first audit to define scope and begin testing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <Dialog
          open={Boolean(deleteAuditId)}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteAuditId(null);
              setDeleteAuditName("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete audit?</DialogTitle>
              <DialogDescription>
                This will delete {deleteAuditName ? <strong>{deleteAuditName}</strong> : "this audit"} and its scope items, test matrix entries, test runs, observations, findings, evidence, and reports.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button disabled={isDeleting} type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={isDeleting} onClick={handleDeleteAudit} type="button" variant="danger">
                {isDeleting ? "Deleting..." : "Delete audit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}
