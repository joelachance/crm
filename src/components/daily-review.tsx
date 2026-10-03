"use client";

import { useMemo, useState } from "react";

import { approveOutreachDraftAction } from "@/app/outreach-actions";
import { DraftContactContext } from "@/components/draft-contact-context";
import { DraftResponsePanel } from "@/components/draft-response-panel";
import type { OutreachDraftForReview } from "@/lib/types";
import { prettyDate } from "@/lib/utils";

function statusLabel(status: OutreachDraftForReview["status"]) {
  switch (status) {
    case "pending_review":
      return "Needs review";
    case "approved":
      return "Approved — not scheduled";
    case "scheduled":
      return "Scheduled";
    case "sent":
      return "Sent";
    default:
      return status;
  }
}

function statusClass(status: OutreachDraftForReview["status"]) {
  switch (status) {
    case "pending_review":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "approved":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "scheduled":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    default:
      return "border-white/15 bg-white/5 text-white/60";
  }
}

function DraftCard({
  draft,
  reviewDate,
  defaultReviewerName
}: {
  draft: OutreachDraftForReview;
  reviewDate: string;
  defaultReviewerName: string;
}) {
  const isEditable = draft.status === "pending_review";
  const displaySubject = draft.approvedSubject ?? draft.subject ?? "";
  const displayBody = draft.approvedBody ?? draft.body;

  const [subject, setSubject] = useState(displaySubject);
  const [body, setBody] = useState(displayBody);
  const [saved, setSaved] = useState(false);

  const displayName = draft.person?.fullName ?? draft.recipientName;
  const displayCompany = draft.person?.companyName ?? draft.recipientCompany;
  const headline = displayCompany ? `${displayName} · ${displayCompany}` : displayName;

  return (
    <article className="app-panel space-y-4 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="app-section-title">{draft.channel === "email" ? "Email draft" : "LinkedIn draft"}</p>
          <h2 className="text-lg font-semibold text-white">{headline}</h2>
        </div>
        <span className={`font-mono-ui border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusClass(draft.status)}`}>
          {statusLabel(draft.status)}
        </span>
      </div>

      <DraftContactContext draft={draft} />
      <DraftResponsePanel draft={draft} />

      {isEditable ? (
        <form
          action={approveOutreachDraftAction}
          className="space-y-4"
          onSubmit={() => setSaved(true)}
        >
          <p className="app-section-title">Outreach message</p>
          <input name="draftId" type="hidden" value={draft.id} />
          <input name="reviewDate" type="hidden" value={reviewDate} />
          <input name="approvedBy" type="hidden" value={defaultReviewerName} />

          {draft.channel === "email" ? (
            <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
              <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Subject</span>
              <input
                className="app-input"
                name="subject"
                onChange={(event) => setSubject(event.target.value)}
                value={subject}
              />
            </label>
          ) : (
            <input name="subject" type="hidden" value="" />
          )}

          <label className="flex flex-col gap-2 text-sm font-medium text-white/72">
            <span className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Message</span>
            <textarea
              className="app-input min-h-[180px]"
              name="body"
              onChange={(event) => setBody(event.target.value)}
              value={body}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
            <button className="app-button" type="submit">
              OK — approve for scheduling
            </button>
            <p className="text-xs leading-5 text-white/45">
              Saves your edits and marks this draft approved. Nothing is sent from ERA.
            </p>
            {saved ? <p className="text-xs text-emerald-300">Submitting approval…</p> : null}
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="app-section-title">Outreach message</p>
          {draft.channel === "email" && displaySubject ? (
            <div>
              <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Subject</p>
              <p className="mt-2 text-sm text-white/80">{displaySubject}</p>
            </div>
          ) : null}
          <div>
            <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-white/40">Approved message</p>
            <pre className="mt-2 whitespace-pre-wrap border border-white/10 bg-[#0a0a0a] p-4 text-sm leading-6 text-white/78">
              {displayBody}
            </pre>
          </div>
          <dl className="grid gap-2 border-t border-white/10 pt-4 text-xs text-white/50 sm:grid-cols-2">
            {draft.approvedBy ? (
              <div>
                <dt className="uppercase tracking-[0.14em] text-white/35">Approved by</dt>
                <dd className="mt-1 text-white/70">{draft.approvedBy}</dd>
              </div>
            ) : null}
            {draft.approvedAt ? (
              <div>
                <dt className="uppercase tracking-[0.14em] text-white/35">Approved at</dt>
                <dd className="mt-1 text-white/70">{prettyDate(draft.approvedAt)}</dd>
              </div>
            ) : null}
            {draft.scheduledAt ? (
              <div>
                <dt className="uppercase tracking-[0.14em] text-white/35">Scheduled at</dt>
                <dd className="mt-1 text-white/70">{prettyDate(draft.scheduledAt)}</dd>
              </div>
            ) : null}
            {draft.scheduledBy ? (
              <div>
                <dt className="uppercase tracking-[0.14em] text-white/35">Scheduled by</dt>
                <dd className="mt-1 text-white/70">{draft.scheduledBy}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}
    </article>
  );
}

export function DailyReview({
  reviewDate,
  drafts,
  defaultReviewerName,
  databaseMode
}: {
  reviewDate: string;
  drafts: OutreachDraftForReview[];
  defaultReviewerName: string;
  databaseMode: "neon" | "sqlite";
}) {
  const counts = useMemo(() => {
    return drafts.reduce(
      (accumulator, draft) => {
        accumulator[draft.status] += 1;
        return accumulator;
      },
      { pending_review: 0, approved: 0, scheduled: 0, sent: 0 }
    );
  }, [drafts]);

  return (
    <div className="space-y-5">
      <section className="space-y-3 border-b border-white/10 pb-4">
        <LinkBack />
        <h1 className="app-wordmark text-white">Daily outreach review</h1>
        <p className="max-w-3xl text-sm leading-6 text-white/55">
          Review batch for <span className="font-mono-ui text-white/80">{reviewDate}</span>. Edit each draft, then press OK to
          record approval with the exact subject and body shown. Approved drafts stay in ERA until an assistant marks them
          scheduled elsewhere.
        </p>
        {databaseMode === "sqlite" ? (
          <p className="border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-100">
            Running on local SQLite (no <code className="text-amber-50">DATABASE_URL</code>). Set{" "}
            <code className="text-amber-50">DATABASE_URL</code> to your Neon Postgres connection string for production persistence.
          </p>
        ) : null}
      </section>

      <section className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
        {(
          [
            ["Needs review", counts.pending_review, "text-amber-200"],
            ["Approved", counts.approved, "text-emerald-200"],
            ["Scheduled", counts.scheduled, "text-sky-200"],
            ["Sent", counts.sent, "text-white/55"]
          ] as const
        ).map(([label, value, tone]) => (
          <div className="bg-[#080808] px-4 py-4" key={label}>
            <p className="app-section-title">{label}</p>
            <p className={`app-display mt-3 text-3xl ${tone}`}>{value}</p>
          </div>
        ))}
      </section>

      {drafts.length === 0 ? (
        <section className="app-panel space-y-3 p-6">
          <p className="app-section-title">No drafts for this date</p>
          <p className="text-sm leading-6 text-white/55">
            When outreach drafts are inserted for {reviewDate}, they will appear here. In local SQLite mode, demo drafts are
            created automatically the first time you open a day with no rows.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <DraftCard
              defaultReviewerName={defaultReviewerName}
              draft={draft}
              key={draft.id}
              reviewDate={reviewDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LinkBack() {
  return (
    <a className="font-mono-ui text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45 transition hover:text-white" href="/">
      Back to dashboard
    </a>
  );
}
