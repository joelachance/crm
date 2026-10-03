import { cache } from "react";

import { ensureSchema, getDefaultReviewerName, sql } from "@/lib/db";
import type { OutreachChannel, OutreachDraft, OutreachDraftStatus } from "@/lib/types";

type DbOutreachDraft = {
  id: number;
  review_date: string;
  person_id: number | null;
  recipient_name: string;
  recipient_company: string | null;
  channel: OutreachChannel;
  subject: string | null;
  body: string;
  status: OutreachDraftStatus;
  approved_by: string | null;
  approved_subject: string | null;
  approved_body: string | null;
  approved_at: string | null;
  scheduled_at: string | null;
  scheduled_by: string | null;
  created_at: string;
};

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
    status: row.status,
    approvedBy: row.approved_by,
    approvedSubject: row.approved_subject,
    approvedBody: row.approved_body,
    approvedAt: row.approved_at,
    scheduledAt: row.scheduled_at,
    scheduledBy: row.scheduled_by,
    createdAt: row.created_at
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
      status,
      approved_by,
      approved_subject,
      approved_body,
      approved_at,
      scheduled_at,
      scheduled_by,
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

export async function createOutreachDraft(input: {
  reviewDate: string;
  personId?: number | null;
  recipientName: string;
  recipientCompany?: string | null;
  channel: OutreachChannel;
  subject?: string | null;
  body: string;
}) {
  await ensureSchema();

  const rows = (await sql`
    INSERT INTO outreach_drafts (
      review_date,
      person_id,
      recipient_name,
      recipient_company,
      channel,
      subject,
      body
    )
    VALUES (
      ${input.reviewDate},
      ${input.personId ?? null},
      ${input.recipientName},
      ${input.recipientCompany ?? null},
      ${input.channel},
      ${input.subject ?? null},
      ${input.body}
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

/** Local-only demo rows so the review page is testable without Neon. */
export async function seedDemoOutreachDraftsIfEmpty(reviewDate: string) {
  const existing = await loadOutreachDraftsForReviewDate(reviewDate);

  if (existing.length > 0) {
    return false;
  }

  await createOutreachDraft({
    reviewDate,
    recipientName: "Maya Chen",
    recipientCompany: "Northwind Labs",
    channel: "email",
    subject: "Quick intro — ERA outreach workflow",
    body:
      "Hi Maya,\n\nI wanted to reach out about how your team handles daily outreach review. Would you be open to a short conversation next week?\n\nBest,\nJoe"
  });

  await createOutreachDraft({
    reviewDate,
    recipientName: "Alex Rivera",
    recipientCompany: "Signal Harbor",
    channel: "linkedin",
    body:
      "Hi Alex — saw your post on founder-led sales. We're tightening our review loop so drafts get approved in-app before anything is scheduled. Open to connect?"
  });

  return true;
}
