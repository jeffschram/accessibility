"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Bot, ClipboardCheck, ExternalLink } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type ObservationStatus = "new" | "triaged" | "dismissed" | "converted_to_finding";
type ObservationSource =
  | "automated"
  | "manual"
  | "screen_reader"
  | "keyboard"
  | "code_review"
  | "imported";
type Severity = "critical" | "high" | "medium" | "low";

const selectClassName =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600";

const statusLabels: Record<ObservationStatus, string> = {
  new: "New",
  triaged: "Triaged",
  dismissed: "Dismissed",
  converted_to_finding: "Converted to finding",
};

const sourceLabels: Record<ObservationSource, string> = {
  automated: "Automated",
  manual: "Manual",
  screen_reader: "Screen reader",
  keyboard: "Keyboard",
  code_review: "Code review",
  imported: "Imported",
};

export default function TriageQueuePage() {
  const params = useParams<{ projectSlug: string; auditSlug: string }>();
  const { projectSlug, auditSlug } = params;

  const [status, setStatus] = useState<ObservationStatus | "all">("new");
  const [source, setSource] = useState<ObservationSource | "all">("all");
  const [rawRuleId, setRawRuleId] = useState("all");

  const resolved = useQuery(api.audits.getBySlug, { projectSlug, auditSlug });
  const audit = resolved?.audit;
  const auditId = audit?._id;

  const summary = useQuery(api.observations.getCounts, auditId ? { auditId } : "skip");
  const observations = useQuery(
    api.observations.listByAudit,
    auditId
      ? {
          auditId,
          status: status === "all" ? undefined : status,
          source: source === "all" ? undefined : source,
          rawRuleId: rawRuleId === "all" ? undefined : rawRuleId,
        }
      : "skip",
  );

  const triage = useMutation(api.observations.triage);
  const reopen = useMutation(api.observations.reopen);

  const [dismissTarget, setDismissTarget] = useState<Id<"observations"> | null>(null);
  const [convertTarget, setConvertTarget] = useState<Id<"observations"> | null>(null);

  if (resolved === undefined) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading triage queue...
        </div>
      </AppShell>
    );
  }

  if (resolved === null) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Button asChild variant="secondary">
            <Link href={`/projects/${projectSlug}`}>
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

  if (summary === undefined || observations === undefined) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading observations...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Button asChild variant="secondary">
            <Link href={`/projects/${projectSlug}/audits/${auditSlug}`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to audit
            </Link>
          </Button>
        </div>

        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-sky-700">{resolved.audit.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            Triage queue
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Observations are raw input from scans and manual passes. Review the evidence, then
            dismiss what does not hold up or promote it to a finding. Nothing here counts as a
            conformance result until a person converts it.
          </p>
        </header>

        <section aria-label="Observation summary" className="grid gap-3 md:grid-cols-5">
          <SummaryCard label="Total" value={summary.counts.total} />
          <SummaryCard label="New" value={summary.counts.new} />
          <SummaryCard label="Triaged" value={summary.counts.triaged} />
          <SummaryCard label="Dismissed" value={summary.counts.dismissed} />
          <SummaryCard label="Findings" value={summary.counts.converted_to_finding} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5" aria-label="Filters">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <select
                className={selectClassName}
                id="filter-status"
                onChange={(event) => setStatus(event.target.value as ObservationStatus | "all")}
                value={status}
              >
                <option value="all">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-source">Source</Label>
              <select
                className={selectClassName}
                id="filter-source"
                onChange={(event) => setSource(event.target.value as ObservationSource | "all")}
                value={source}
              >
                <option value="all">All sources</option>
                {Object.entries(sourceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-rule">Rule</Label>
              <select
                className={selectClassName}
                id="filter-rule"
                onChange={(event) => setRawRuleId(event.target.value)}
                value={rawRuleId}
              >
                <option value="all">All rules</option>
                {summary.rules.map((rule) => (
                  <option key={rule.rawRuleId} value={rule.rawRuleId}>
                    {rule.rawRuleId} ({rule.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p aria-live="polite" className="mt-4 text-sm text-slate-600">
            {observations.length === 1
              ? "1 observation matches these filters."
              : `${observations.length} observations match these filters.`}
          </p>
        </section>

        {observations.length ? (
          <ul className="space-y-4">
            {observations.map((observation) => (
              <li key={observation._id}>
                <ObservationCard
                  observation={observation}
                  onDismiss={() => setDismissTarget(observation._id)}
                  onConvert={() => setConvertTarget(observation._id)}
                  onTriage={() => void triage({ observationId: observation._id })}
                  onReopen={() => void reopen({ observationId: observation._id })}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
            <ClipboardCheck className="mx-auto mb-3 size-8 text-slate-400" aria-hidden="true" />
            <p className="text-sm text-slate-600">
              Nothing matches these filters. Run a scan with{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">
                npm run scan -- --audit {auditId} &lt;url&gt;
              </code>{" "}
              to populate the queue.
            </p>
          </div>
        )}
      </div>

      <DismissDialog
        observationId={dismissTarget}
        onClose={() => setDismissTarget(null)}
      />
      <ConvertDialog
        observationId={convertTarget}
        onClose={() => setConvertTarget(null)}
      />
    </AppShell>
  );
}

type ObservationRecord = FunctionReturnType<typeof api.observations.listByAudit>[number];

function ObservationCard({
  observation,
  onTriage,
  onDismiss,
  onConvert,
  onReopen,
}: {
  observation: ObservationRecord;
  onTriage: () => void;
  onDismiss: () => void;
  onConvert: () => void;
  onReopen: () => void;
}) {
  const isUnconfirmed = observation.source === "automated";
  const isClosed =
    observation.status === "dismissed" || observation.status === "converted_to_finding";

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">{observation.title}</h2>
            {observation.url ? (
              <a
                className="mt-1 inline-flex items-center gap-1 text-sm text-sky-700 underline underline-offset-2"
                href={observation.url}
                rel="noreferrer"
                target="_blank"
              >
                {observation.url}
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isUnconfirmed ? (
              <Badge variant="info">
                <Bot className="mr-1 size-3.5" aria-hidden="true" />
                Unconfirmed — automated
              </Badge>
            ) : null}
            <Badge>{statusLabels[observation.status as ObservationStatus]}</Badge>
            <Badge>{sourceLabels[observation.source as ObservationSource]}</Badge>
          </div>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-600">Rule</dt>
            <dd className="font-medium text-slate-950">
              {observation.rawRuleId ?? "—"}
              {observation.rawTool ? (
                <span className="font-normal text-slate-600"> ({observation.rawTool})</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-slate-600">Suggested WCAG</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {observation.suggestedWcag.length ? (
                observation.suggestedWcag.map((criterion) => (
                  <Badge key={criterion}>{criterion}</Badge>
                ))
              ) : (
                <span className="text-slate-600">None suggested</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-slate-600">Confidence</dt>
            <dd className="font-medium text-slate-950">
              {observation.confidence ? observation.confidence.replaceAll("_", " ") : "—"}
            </dd>
          </div>
        </dl>

        {observation.description ? (
          <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-900">
              Details and affected elements
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
              {observation.description}
            </pre>
          </details>
        ) : null}

        {observation.dismissReason ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-medium">Dismissed:</span> {observation.dismissReason}
          </p>
        ) : null}

        {observation.evidence.length ? (
          <section aria-label="Evidence" className="space-y-2">
            <h3 className="text-sm font-medium text-slate-900">Evidence</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {observation.evidence.map((item) => (
                <li key={item._id}>
                  <EvidenceItem evidence={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          {isClosed ? (
            observation.status === "dismissed" ? (
              <Button onClick={onReopen} size="sm" type="button" variant="secondary">
                Reopen
              </Button>
            ) : null
          ) : (
            <>
              {observation.status === "new" ? (
                <Button onClick={onTriage} size="sm" type="button" variant="secondary">
                  Mark triaged
                </Button>
              ) : null}
              <Button onClick={onDismiss} size="sm" type="button" variant="danger">
                Dismiss
              </Button>
              <Button onClick={onConvert} size="sm" type="button">
                Convert to finding
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceItem({ evidence }: { evidence: ObservationRecord["evidence"][number] }) {
  if (evidence.type === "screenshot" && evidence.servedUrl) {
    return (
      <figure className="overflow-hidden rounded-md border border-slate-200">
        <Image
          alt={evidence.label}
          className="h-auto w-full"
          height={600}
          src={evidence.servedUrl}
          unoptimized
          width={900}
        />
        <figcaption className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {evidence.label}
        </figcaption>
      </figure>
    );
  }

  return (
    <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-900">
        {evidence.label}
      </summary>
      {evidence.text ? (
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
          {evidence.text.slice(0, 4000)}
        </pre>
      ) : evidence.servedUrl ? (
        <a
          className="mt-3 inline-block text-sm text-sky-700 underline underline-offset-2"
          href={evidence.servedUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open evidence
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </details>
  );
}

function DismissDialog({
  observationId,
  onClose,
}: {
  observationId: Id<"observations"> | null;
  onClose: () => void;
}) {
  const dismiss = useMutation(api.observations.dismiss);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!reason.trim()) {
      setError("A reason is required so the audit trail explains the decision.");
      return;
    }

    if (!observationId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await dismiss({ observationId, reason: reason.trim() });
      setReason("");
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not dismiss observation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={(open) => (open ? null : onClose())} open={observationId !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dismiss observation</DialogTitle>
          <DialogDescription>
            Record why this is not a real issue. The reason stays on the observation so the
            decision is reviewable later.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="dismiss-reason">Reason</Label>
            <Textarea
              id="dismiss-reason"
              onChange={(event) => setReason(event.target.value)}
              placeholder="Example: false positive, the control is described by an adjacent legend."
              value={reason}
            />
          </div>
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit" variant="danger">
              {isSubmitting ? "Dismissing..." : "Dismiss"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConvertDialog({
  observationId,
  onClose,
}: {
  observationId: Id<"observations"> | null;
  onClose: () => void;
}) {
  const convertToFinding = useMutation(api.observations.convertToFinding);
  const [severity, setSeverity] = useState<Severity>("medium");
  const [priority, setPriority] = useState<Severity>("medium");
  const [userImpact, setUserImpact] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!observationId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await convertToFinding({
        observationId,
        severity,
        priority,
        userImpact: userImpact.trim() || undefined,
      });
      setUserImpact("");
      setSeverity("medium");
      setPriority("medium");
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not convert observation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={(open) => (open ? null : onClose())} open={observationId !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to finding</DialogTitle>
          <DialogDescription>
            You are confirming this observation reproduces and is a real accessibility barrier.
            The evidence and suggested criteria carry over and stay editable.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="convert-severity">Severity</Label>
              <select
                className={selectClassName}
                id="convert-severity"
                onChange={(event) => setSeverity(event.target.value as Severity)}
                value={severity}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="convert-priority">Priority</Label>
              <select
                className={selectClassName}
                id="convert-priority"
                onChange={(event) => setPriority(event.target.value as Severity)}
                value={priority}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="convert-impact">User impact</Label>
            <Textarea
              id="convert-impact"
              onChange={(event) => setUserImpact(event.target.value)}
              placeholder="Who is blocked, and what can they not do?"
              value={userImpact}
            />
          </div>
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Converting..." : "Convert to finding"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
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
