import Link from "next/link";
import type { ReactNode } from "react";

import type { OutreachDraftForReview } from "@/lib/types";
import { productTagColorStyles } from "@/lib/utils";

function ContextRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</dt>
      <dd className="text-sm leading-6 text-white/78">{children}</dd>
    </div>
  );
}

export function DraftContactContext({ draft }: { draft: OutreachDraftForReview }) {
  const person = draft.person;
  const displayName = person?.fullName ?? draft.recipientName;
  const displayCompany = person?.companyName ?? draft.recipientCompany;
  const email = person?.email;
  const phone = person?.phoneNumber;
  const resume = person?.resume;
  const notes = person?.notes;
  const tags = person?.productAssignments ?? [];
  const researchLinks = draft.mergedResearchLinks;

  const hasIdentity = Boolean(displayName || displayCompany || email || phone || resume || notes || tags.length > 0);
  const hasResearch = researchLinks.length > 0;

  if (!hasIdentity && !hasResearch) {
    return (
      <p className="border border-dashed border-white/10 px-4 py-3 text-xs leading-5 text-white/42">
        No CRM contact linked yet. Attach a <code className="text-white/55">person_id</code> or add research links on the
        draft when it is created.
      </p>
    );
  }

  return (
    <div className="grid gap-4 border border-white/10 bg-[#0a0a0a] p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {hasIdentity ? (
        <div className="space-y-3">
          <p className="app-section-title">Contact in ERA</p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {displayName ? <ContextRow label="Name">{displayName}</ContextRow> : null}
            {displayCompany ? <ContextRow label="Company">{displayCompany}</ContextRow> : null}
            {email ? (
              <ContextRow label="Email">
                <a className="text-sky-300 underline-offset-2 hover:underline" href={`mailto:${email}`}>
                  {email}
                </a>
              </ContextRow>
            ) : null}
            {phone ? <ContextRow label="Phone">{phone}</ContextRow> : null}
          </dl>
          {resume ? (
            <ContextRow label="Profile summary">
              <p className="whitespace-pre-wrap text-white/68">{resume}</p>
            </ContextRow>
          ) : null}
          {notes ? (
            <ContextRow label="CRM notes">
              <p className="whitespace-pre-wrap text-white/68">{notes}</p>
            </ContextRow>
          ) : null}
          {tags.length > 0 ? (
            <div className="space-y-2">
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-white/35">Product tags</p>
              <ul className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li
                    className="font-mono-ui border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]"
                    key={tag.id}
                    style={productTagColorStyles(tag.productTagColor)}
                  >
                    {tag.productTagName}
                    {tag.isIcp ? " · ICP" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {person ? (
            <Link
              className="inline-flex font-mono-ui text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45 transition hover:text-white"
              href={`/people/${person.id}`}
            >
              Open full CRM record →
            </Link>
          ) : null}
        </div>
      ) : null}

      {hasResearch ? (
        <div className="space-y-3">
          <p className="app-section-title">Research links</p>
          <ul className="space-y-2">
            {researchLinks.map((link) => (
              <li key={`${link.label}-${link.url}`}>
                <a
                  className="group flex flex-col gap-0.5 border border-white/10 bg-[#050505] px-3 py-2.5 transition hover:border-white/20"
                  href={link.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-white/40 group-hover:text-white/55">
                    {link.label}
                  </span>
                  <span className="truncate text-sm text-sky-300 group-hover:underline">{link.url}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-[11px] leading-5 text-white/38">
            Links come from the draft&apos;s <code className="text-white/50">research_links</code> field plus LinkedIn,
            Twitter/X, and Reddit stored on the CRM contact (deduped by URL).
          </p>
        </div>
      ) : null}
    </div>
  );
}
