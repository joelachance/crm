import type { OutreachDraftForReview } from "@/lib/types";
import { prettyDate } from "@/lib/utils";

export function DraftResponsePanel({ draft }: { draft: OutreachDraftForReview }) {
  const hasDraftReply = draft.responseState === "replied";
  const hasCrmReply = Boolean(draft.crmLatestReply);

  if (!hasDraftReply && !hasCrmReply) {
    return (
      <div className="border border-white/10 bg-[#0a0a0a] px-4 py-3">
        <p className="app-section-title">Response</p>
        <p className="mt-2 text-sm text-white/55">No reply recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 border border-white/10 bg-[#0a0a0a] p-4">
      <p className="app-section-title">Response</p>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`font-mono-ui border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            hasDraftReply
              ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
              : "border-white/15 bg-white/5 text-white/50"
          }`}
        >
          Draft record: {hasDraftReply ? "Replied" : "None yet"}
        </span>
        {hasDraftReply && draft.repliedAt ? (
          <span className="text-xs text-white/45">{prettyDate(draft.repliedAt)}</span>
        ) : null}
      </div>

      {hasDraftReply ? (
        <dl className="grid gap-2 text-xs text-white/55 sm:grid-cols-2">
          {draft.repliedBy ? (
            <div>
              <dt className="uppercase tracking-[0.14em] text-white/35">Marked by</dt>
              <dd className="mt-1 text-white/72">{draft.repliedBy}</dd>
            </div>
          ) : null}
          {draft.responseSnippet ? (
            <div className="sm:col-span-2">
              <dt className="uppercase tracking-[0.14em] text-white/35">Note</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/75">{draft.responseSnippet}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {hasCrmReply && draft.crmLatestReply ? (
        <div className="border-t border-white/10 pt-3">
          <p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-white/40">From CRM outreach history</p>
          <p className="mt-1 text-[11px] text-white/42">
            Pulled from existing <code className="text-white/55">message_turns</code> on the contact — not a separate inbox.
          </p>
          <pre className="mt-3 whitespace-pre-wrap border border-white/10 bg-[#050505] p-3 text-sm leading-6 text-white/78">
            {draft.crmLatestReply.responseMessage}
          </pre>
          <p className="mt-2 text-xs text-white/45">
            {draft.crmLatestReply.respondedAt
              ? `Replied ${prettyDate(draft.crmLatestReply.respondedAt)}`
              : `Outbound ${prettyDate(draft.crmLatestReply.sentAt)}`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
