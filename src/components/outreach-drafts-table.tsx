"use client";

import Link from "next/link";
import { useMemo, useState, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

import { markOutreachDraftRepliedAction } from "@/app/outreach-actions";
import type { OutreachChannel, OutreachDraft, OutreachDraftStatus, OutreachResponseState } from "@/lib/types";
import { prettyDate } from "@/lib/utils";

type StatusFilter = "all" | OutreachDraftStatus;
type ChannelFilter = "all" | OutreachChannel;
type ResponseFilter = "all" | OutreachResponseState;

function FilterSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`app-input h-10 px-3 py-2 text-xs ${props.className ?? ""}`.trim()} />;
}

function FilterInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`app-input h-10 px-3 py-2 text-xs ${props.className ?? ""}`.trim()} />;
}

function statusLabel(status: OutreachDraftStatus) {
  switch (status) {
    case "pending_review":
      return "Needs review";
    case "approved":
      return "Approved";
    case "scheduled":
      return "Scheduled";
    case "sent":
      return "Sent";
    default:
      return status;
  }
}

function responseLabel(state: OutreachResponseState) {
  return state === "replied" ? "Replied" : "None yet";
}

export function OutreachDraftsTable({ drafts }: { drafts: OutreachDraft[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>("all");
  const [reviewDateFilter, setReviewDateFilter] = useState("");

  const filtered = useMemo(() => {
    return drafts.filter((draft) => {
      if (statusFilter !== "all" && draft.status !== statusFilter) {
        return false;
      }

      if (channelFilter !== "all" && draft.channel !== channelFilter) {
        return false;
      }

      if (responseFilter !== "all" && draft.responseState !== responseFilter) {
        return false;
      }

      if (reviewDateFilter && draft.reviewDate !== reviewDateFilter) {
        return false;
      }

      return true;
    });
  }, [channelFilter, drafts, responseFilter, reviewDateFilter, statusFilter]);

  return (
    <section className="app-panel space-y-4 overflow-hidden p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="app-section-title">Outreach drafts</h2>
          <p className="text-sm text-white/52">
            Filter by workflow status, channel, review date, and response state. Open a day for Joe&apos;s review.
          </p>
        </div>
        <p className="font-mono-ui text-xs text-white/45">
          Showing {filtered.length} of {drafts.length}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-xs text-white/50">
          Workflow status
          <FilterSelect onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} value={statusFilter}>
            <option value="all">All</option>
            <option value="pending_review">Needs review</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
          </FilterSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-white/50">
          Channel
          <FilterSelect onChange={(event) => setChannelFilter(event.target.value as ChannelFilter)} value={channelFilter}>
            <option value="all">All</option>
            <option value="email">Email</option>
            <option value="linkedin">LinkedIn</option>
          </FilterSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-white/50">
          Response
          <FilterSelect
            onChange={(event) => setResponseFilter(event.target.value as ResponseFilter)}
            value={responseFilter}
          >
            <option value="all">All</option>
            <option value="none">None yet</option>
            <option value="replied">Replied</option>
          </FilterSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-white/50">
          Review date
          <FilterInput onChange={(event) => setReviewDateFilter(event.target.value)} type="date" value={reviewDateFilter} />
        </label>
      </div>

      <div className="overflow-x-auto border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-[#090909] text-xs uppercase tracking-[0.12em] text-white/45">
            <tr>
              <th className="px-3 py-3 font-medium">Review date</th>
              <th className="px-3 py-3 font-medium">Recipient</th>
              <th className="px-3 py-3 font-medium">Channel</th>
              <th className="px-3 py-3 font-medium">Workflow</th>
              <th className="px-3 py-3 font-medium">Response</th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-white/40" colSpan={6}>
                  No drafts match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((draft) => (
                <tr className="border-b border-white/10 bg-[#080808]" key={draft.id}>
                  <td className="px-3 py-3 font-mono-ui text-xs text-white/70">{draft.reviewDate}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-white">{draft.recipientName}</p>
                    {draft.recipientCompany ? <p className="text-xs text-white/45">{draft.recipientCompany}</p> : null}
                  </td>
                  <td className="px-3 py-3 capitalize text-white/65">{draft.channel}</td>
                  <td className="px-3 py-3 text-white/65">{statusLabel(draft.status)}</td>
                  <td className="px-3 py-3">
                    <p className="text-white/70">{responseLabel(draft.responseState)}</p>
                    {draft.repliedAt ? <p className="text-xs text-white/40">{prettyDate(draft.repliedAt)}</p> : null}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2">
                      <Link
                        className="font-mono-ui text-[11px] uppercase tracking-[0.14em] text-sky-300 hover:underline"
                        href={`/review/${draft.reviewDate}`}
                      >
                        Open review day
                      </Link>
                      {draft.responseState === "none" ? (
                        <form action={markOutreachDraftRepliedAction}>
                          <input name="draftId" type="hidden" value={draft.id} />
                          <input name="responseSnippet" type="hidden" value="Marked replied from outreach table" />
                          <button className="app-button-secondary px-3 py-1.5 text-[10px] uppercase tracking-[0.12em]" type="submit">
                            Mark replied
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
