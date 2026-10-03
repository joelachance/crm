"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { approveOutreachDraft, isValidReviewDate } from "@/lib/outreach-drafts";

const approveSchema = z.object({
  draftId: z.coerce.number().int().positive(),
  reviewDate: z.string().refine(isValidReviewDate, "Review date must be YYYY-MM-DD."),
  subject: z.string().optional(),
  body: z.string().trim().min(1, "Message body is required."),
  approvedBy: z.string().trim().optional()
});

export async function approveOutreachDraftAction(formData: FormData) {
  const parsed = approveSchema.parse({
    draftId: formData.get("draftId"),
    reviewDate: formData.get("reviewDate"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    approvedBy: formData.get("approvedBy")
  });

  await approveOutreachDraft({
    draftId: parsed.draftId,
    subject: parsed.subject?.trim() || null,
    body: parsed.body,
    approvedBy: parsed.approvedBy
  });

  revalidatePath(`/review/${parsed.reviewDate}`);
}
