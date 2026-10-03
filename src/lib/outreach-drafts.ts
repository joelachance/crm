import { cache } from "react";

import { getPeople } from "@/lib/crm";
import { ensureSchema, getDefaultReviewerName, getDatabaseMode, sql } from "@/lib/db";
import { mergeResearchLinks, parseOutreachResearchLinks } from "@/lib/outreach-review-links";
import { getCrmLatestReply } from "@/lib/outreach-response";
import type {
  OutreachChannel,
  OutreachDraft,
  OutreachDraftForReview,
  OutreachDraftResearchLink,
  OutreachDraftStatus,
  OutreachResponseState,
  PersonSummary
} from "@/lib/types";

type DbOutreachDraft = {
  id: number;
  review_date: string;
  person_id: number | null;
  recipient_name: string;
  recipient_company: string | null;
  channel: OutreachChannel;
  subject: string | null;
  body: string;
  research_links: unknown;
  status: OutreachDraftStatus;
  approved_by: string | null;
  approved_subject: string | null;
  approved_body: string | null;
  approved_at: string | null;
  scheduled_at: string | null;
  scheduled_by: string | null;
  response_state: string | null;
  replied_at: string | null;
  replied_by: string | null;
  response_snippet: string | null;
  created_at: string;
};

function normalizeResponseState(value: string | null | undefined): OutreachResponseState {
  return value === "replied" ? "replied" : "none";
}

function mapOutreachDraft(row: DbOutreachDraft): OutreachDraft {
  return {
    id: row.id,
    reviewDate: row.review_date,
    personId: row.person_id,
    recipientName: row.recipient_name,
    recipientCompany: row.recipient_company,
    channel: row.channel,
    subject: row.subject,
    body: row.body,
    researchLinks: parseOutreachResearchLinks(row.research_links),
    status: row.status,
    approvedBy: row.approved_by,
    approvedSubject: row.approved_subject,
    approvedBody: row.approved_body,
    approvedAt: row.approved_at,
    scheduledAt: row.scheduled_at,
    scheduledBy: row.scheduled_by,
    responseState: normalizeResponseState(row.response_state),
    repliedAt: row.replied_at,
    repliedBy: row.replied_by,
    responseSnippet: row.response_snippet,
    createdAt: row.created_at
  };
}

function enrichDraftForReview(draft: OutreachDraft, peopleById: Map<number, PersonSummary>): OutreachDraftForReview {
  const person = draft.personId ? peopleById.get(draft.personId) ?? null : null;

  return {
    ...draft,
    person,
    mergedResearchLinks: mergeResearchLinks(draft.researchLinks, person),
    crmLatestReply: getCrmLatestReply(person)
  };
}

export function isValidReviewDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function todayReviewDateInChicago() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date());
}

async function loadOutreachDraftsForReviewDate(reviewDate: string) {
  await ensureSchema();

  const rows = (await sql`
    SELECT
      id,
      review_date,
      person_id,
      recipient_name,
      recipient_company,
      channel,
      subject,
      body,
      research_links,
      status,
      approved_by,
      approved_subject,
      approved_body,
      approved_at,
      scheduled_at,
      scheduled_by,
      response_state,
      replied_at,
      replied_by,
      response_snippet,
      created_at
    FROM outreach_drafts
    WHERE review_date = ${reviewDate}
    ORDER BY
      CASE status
        WHEN 'pending_review' THEN 0
        WHEN 'approved' THEN 1
        WHEN 'scheduled' THEN 2
        ELSE 3
      END,
      created_at ASC,
      id ASC;
  `) as DbOutreachDraft[];

  return rows.map(mapOutreachDraft);
}

export const getOutreachDraftsForReviewDate = cache(loadOutreachDraftsForReviewDate);

export async function listAllOutreachDrafts(): Promise<OutreachDraft[]> {
  await ensureSchema();

  const rows = (await sql`
    SELECT
      id,
      review_date,
      person_id,
      recipient_name,
      recipient_company,
      channel,
      subject,
      body,
      research_links,
      status,
      approved_by,
      approved_subject,
      approved_body,
      approved_at,
      scheduled_at,
      scheduled_by,
      response_state,
      replied_at,
      replied_by,
      response_snippet,
      created_at
    FROM outreach_drafts
    ORDER BY review_date DESC, created_at DESC, id DESC;
  `) as DbOutreachDraft[];

  return rows.map(mapOutreachDraft);
}

export async function getOutreachDraftsForReview(reviewDate: string): Promise<OutreachDraftForReview[]> {
  const drafts = await loadOutreachDraftsForReviewDate(reviewDate);
  const people = await getPeople(true);
  const peopleById = new Map(people.map((person) => [person.id, person]));

  return drafts.map((draft) => enrichDraftForReview(draft, peopleById));
}

function serializeResearchLinks(links: OutreachDraftResearchLink[]) {
  return JSON.stringify(links);
}

export async function createOutreachDraft(input: {
  reviewDate: string;
  personId?: number | null;
  recipientName: string;
  recipientCompany?: string | null;
  channel: OutreachChannel;
  subject?: string | null;
  body: string;
  researchLinks?: OutreachDraftResearchLink[];
}) {
  await ensureSchema();

  const researchLinks = serializeResearchLinks(input.researchLinks ?? []);

  if (getDatabaseMode() === "neon") {
    const rows = (await sql`
      INSERT INTO outreach_drafts (
        review_date,
        person_id,
        recipient_name,
        recipient_company,
        channel,
        subject,
        body,
        research_links
      )
      VALUES (
        ${input.reviewDate},
        ${input.personId ?? null},
        ${input.recipientName},
        ${input.recipientCompany ?? null},
        ${input.channel},
        ${input.subject ?? null},
        ${input.body},
        ${researchLinks}::jsonb
      )
      RETURNING id;
    `) as Array<{ id: number }>;

    return rows[0]?.id ?? null;
  }

  const rows = (await sql`
    INSERT INTO outreach_drafts (
      review_date,
      person_id,
      recipient_name,
      recipient_company,
      channel,
      subject,
      body,
      research_links
    )
    VALUES (
      ${input.reviewDate},
      ${input.personId ?? null},
      ${input.recipientName},
      ${input.recipientCompany ?? null},
      ${input.channel},
      ${input.subject ?? null},
      ${input.body},
      ${researchLinks}
    )
    RETURNING id;
  `) as Array<{ id: number }>;

  return rows[0]?.id ?? null;
}

export async function approveOutreachDraft(input: {
  draftId: number;
  subject: string | null;
  body: string;
  approvedBy?: string;
}) {
  await ensureSchema();

  const approvedBy = input.approvedBy?.trim() || getDefaultReviewerName();
  const approvedAt = new Date().toISOString();

  await sql`
    UPDATE outreach_drafts
    SET
      status = 'approved',
      approved_by = ${approvedBy},
      approved_subject = ${input.subject},
      approved_body = ${input.body},
      approved_at = ${approvedAt}
    WHERE id = ${input.draftId}
      AND status IN ('pending_review', 'approved');
  `;
}

export async function markOutreachDraftScheduled(input: {
  draftId: number;
  scheduledBy: string;
  scheduledAt?: string;
}) {
  await ensureSchema();

  const scheduledAt = input.scheduledAt ?? new Date().toISOString();

  await sql`
    UPDATE outreach_drafts
    SET
      status = 'scheduled',
      scheduled_by = ${input.scheduledBy},
      scheduled_at = ${scheduledAt}
    WHERE id = ${input.draftId}
      AND status = 'approved';
  `;
}

export async function markOutreachDraftReplied(input: {
  draftId: number;
  repliedBy: string;
  repliedAt?: string;
  responseSnippet?: string | null;
}) {
  await ensureSchema();

  const repliedAt = input.repliedAt ?? new Date().toISOString();
  const repliedBy = input.repliedBy.trim();

  await sql`
    UPDATE outreach_drafts
    SET
      response_state = 'replied',
      replied_at = ${repliedAt},
      replied_by = ${repliedBy},
      response_snippet = ${input.responseSnippet ?? null}
    WHERE id = ${input.draftId};
  `;

  const rows = (await sql`
    SELECT review_date
    FROM outreach_drafts
    WHERE id = ${input.draftId}
    LIMIT 1;
  `) as Array<{ review_date: string }>;

  return rows[0]?.review_date ?? null;
}

/** Local-only demo rows so the review page is testable without Neon. */
export async function seedDemoOutreachDraftsIfEmpty(reviewDate: string) {
  const existing = await loadOutreachDraftsForReviewDate(reviewDate);

  if (existing.length > 0) {
    return false;
  }

  const { assignProductTagToPerson, createMessageTurn, createPerson, getOrCreateProductTag } = await import("@/lib/crm");

  const memkitTagId = await getOrCreateProductTag("MemKit");

  const mayaId = await createPerson({
    fullName: "Maya Chen",
    companyName: "Northwind Labs",
    email: "maya.chen@northwindlabs.example",
    phoneNumber: "+1 312-555-0142",
    linkedinUrl: "https://www.linkedin.com/in/maya-chen-northwind",
    twitterUrl: null,
    redditUrl: null,
    resume:
      "VP Product at Northwind Labs (Chicago). Previously led growth product at a Series B devtools startup. Focus: PLG, onboarding, and sales-assist workflows.",
    notes: "Warm intro via portfolio founder. Asked about outreach ops tooling on a podcast last month."
  });

  if (mayaId && memkitTagId) {
    await assignProductTagToPerson(mayaId, memkitTagId, true);
  }

  const alexId = await createPerson({
    fullName: "Alex Rivera",
    companyName: "Signal Harbor",
    email: null,
    phoneNumber: null,
    linkedinUrl: "https://www.linkedin.com/in/alex-rivera-signal",
    twitterUrl: "https://x.com/alexrivera_gtm",
    redditUrl: null,
    resume: "Head of GTM at Signal Harbor (remote, US). Founder-led sales background; posts often about sequencing and review loops.",
    notes: "Engaged with our launch thread. No email on file — LinkedIn-first."
  });

  if (alexId && memkitTagId) {
    await assignProductTagToPerson(alexId, memkitTagId, false);
  }

  if (mayaId) {
    const sentAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const respondedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    await createMessageTurn({
      personId: mayaId,
      outboundMessage: "Hi Maya — following up on outreach review tooling.",
      sentAt,
      responded: true,
      responseMessage: "Thanks Joe — happy to compare notes next week. Thursday afternoon works.",
      respondedAt
    });
  }

  const mayaDraftId = await createOutreachDraft({
    reviewDate,
    personId: mayaId,
    recipientName: "Maya Chen",
    recipientCompany: "Northwind Labs",
    channel: "email",
    subject: "Quick intro — ERA outreach workflow",
    body:
      "Hi Maya,\n\nI wanted to reach out about how your team handles daily outreach review. Would you be open to a short conversation next week?\n\nBest,\nJoe",
    researchLinks: [
      { label: "Company site", url: "https://northwindlabs.example" },
      { label: "Podcast appearance", url: "https://podcasts.example/episodes/northwind-maya" }
    ]
  });

  if (mayaDraftId) {
    await markOutreachDraftReplied({
      draftId: mayaDraftId,
      repliedBy: "Outreach assistant",
      responseSnippet: "Confirmed interest — Thursday afternoon works."
    });
  }

  await createOutreachDraft({
    reviewDate,
    personId: alexId,
    recipientName: "Alex Rivera",
    recipientCompany: "Signal Harbor",
    channel: "linkedin",
    body:
      "Hi Alex — saw your post on founder-led sales. We're tightening our review loop so drafts get approved in-app before anything is scheduled. Open to connect?",
    researchLinks: [{ label: "Recent GTM article", url: "https://signalharbor.example/blog/founder-led-sequences" }]
  });

  return true;
}
