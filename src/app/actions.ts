"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  assignProductTagToPerson,
  createMessageTurn,
  createPerson,
  createProductTag,
  deletePerson,
  getOrCreateProductTag,
  removeProductTagFromPerson,
  setPersonArchived,
  updateMessageTurnResponse,
  updatePerson,
  updateProductTag
} from "@/lib/crm";
import { boolFromFormData, normalizeProductTagColor, nullableString } from "@/lib/utils";

const personSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required."),
  companyName: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phoneNumber: z.string().trim().optional(),
  linkedinUrl: z.string().trim().url().optional().or(z.literal("")),
  twitterUrl: z.string().trim().url().optional().or(z.literal("")),
  redditUrl: z.string().trim().url().optional().or(z.literal("")),
  resume: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

const productTagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required.")
});

const messageTurnSchema = z.object({
  outboundMessage: z.string().trim().min(1, "Message text is required."),
  sentAt: z.string().trim().min(1, "Sent date is required."),
  responseMessage: z.string().trim().optional(),
  respondedAt: z.string().trim().optional()
});

export async function createPersonAction(formData: FormData) {
  const parsed = personSchema.parse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber"),
    linkedinUrl: formData.get("linkedinUrl"),
    twitterUrl: formData.get("twitterUrl"),
    redditUrl: formData.get("redditUrl"),
    resume: formData.get("resume"),
    notes: formData.get("notes")
  });

  const personId = await createPerson({
    fullName: parsed.fullName,
    companyName: parsed.companyName ? parsed.companyName.trim() || null : null,
    email: parsed.email || null,
    phoneNumber: parsed.phoneNumber ? parsed.phoneNumber.trim() || null : null,
    linkedinUrl: parsed.linkedinUrl || null,
    twitterUrl: parsed.twitterUrl || null,
    redditUrl: parsed.redditUrl || null,
    resume: parsed.resume ? parsed.resume.trim() || null : null,
    notes: parsed.notes ? parsed.notes.trim() || null : null
  });

  revalidatePath("/");

  if (personId) {
    redirect(`/people/${personId}`);
  }
}

export async function updatePersonAction(formData: FormData) {
  const personId = Number(formData.get("personId"));

  const parsed = personSchema.parse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber"),
    linkedinUrl: formData.get("linkedinUrl"),
    twitterUrl: formData.get("twitterUrl"),
    redditUrl: formData.get("redditUrl"),
    resume: formData.get("resume"),
    notes: formData.get("notes")
  });

  await updatePerson(personId, {
    fullName: parsed.fullName,
    companyName: parsed.companyName ? parsed.companyName.trim() || null : null,
    email: parsed.email || null,
    phoneNumber: parsed.phoneNumber ? parsed.phoneNumber.trim() || null : null,
    linkedinUrl: parsed.linkedinUrl || null,
    twitterUrl: parsed.twitterUrl || null,
    redditUrl: parsed.redditUrl || null,
    resume: parsed.resume ? parsed.resume.trim() || null : null,
    notes: parsed.notes ? parsed.notes.trim() || null : null,
    archived: boolFromFormData(formData.get("archived"))
  });

  revalidatePath("/");
  revalidatePath(`/people/${personId}`);
}

export async function toggleArchiveAction(formData: FormData) {
  const personId = Number(formData.get("personId"));
  const archived = formData.get("archived") === "true";

  await setPersonArchived(personId, archived);

  revalidatePath("/");
  revalidatePath(`/people/${personId}`);
}

export async function deletePersonAction(formData: FormData) {
  const personId = Number(formData.get("personId"));

  await deletePerson(personId);

  revalidatePath("/");
  redirect("/");
}

export async function createProductTagAction(formData: FormData) {
  const parsed = productTagSchema.parse({
    name: formData.get("name")
  });
  const color = normalizeProductTagColor(nullableString(formData.get("color")));

  await createProductTag(parsed.name, color);
  revalidatePath("/");
}

export async function updateProductTagAction(formData: FormData) {
  const tagId = Number(formData.get("tagId"));
  const parsed = productTagSchema.parse({
    name: formData.get("name")
  });
  const color = normalizeProductTagColor(nullableString(formData.get("color")));

  await updateProductTag(tagId, parsed.name, color);
  revalidatePath("/");
  revalidatePath("/people/[id]", "page");
}

export async function assignProductTagAction(formData: FormData) {
  const personId = Number(formData.get("personId"));
  const selectedProductTagIdValue = nullableString(formData.get("productTagId"));
  const productTagName = nullableString(formData.get("productTagName"));
  const productTagColor = normalizeProductTagColor(nullableString(formData.get("productTagColor")));
  const isIcp = formData.get("isIcp") === "true";
  const selectedProductTagId = selectedProductTagIdValue ? Number(selectedProductTagIdValue) : null;
  const productTagId = productTagName ? await getOrCreateProductTag(productTagName, productTagColor) : selectedProductTagId;

  if (!productTagId) {
    revalidatePath(`/people/${personId}`);
    return;
  }

  await assignProductTagToPerson(personId, productTagId, isIcp);

  revalidatePath("/");
  revalidatePath(`/people/${personId}`);
}

export async function removeProductTagAction(formData: FormData) {
  const personId = Number(formData.get("personId"));
  const productTagId = Number(formData.get("productTagId"));

  await removeProductTagFromPerson(personId, productTagId);

  revalidatePath("/");
  revalidatePath(`/people/${personId}`);
}

export async function createMessageTurnAction(formData: FormData) {
  const personId = Number(formData.get("personId"));

  const parsed = messageTurnSchema.parse({
    outboundMessage: formData.get("outboundMessage"),
    sentAt: formData.get("sentAt"),
    responseMessage: formData.get("responseMessage"),
    respondedAt: formData.get("respondedAt")
  });

  const responded = boolFromFormData(formData.get("responded"));
  const responseMessage = nullableString(formData.get("responseMessage"));
  const respondedAt = nullableString(formData.get("respondedAt"));

  await createMessageTurn({
    personId,
    outboundMessage: parsed.outboundMessage,
    sentAt: new Date(parsed.sentAt).toISOString(),
    responded,
    responseMessage,
    respondedAt: responded && respondedAt ? new Date(respondedAt).toISOString() : null
  });

  revalidatePath("/");
  revalidatePath(`/people/${personId}`);
}

export async function updateMessageTurnResponseAction(formData: FormData) {
  const personId = Number(formData.get("personId"));
  const messageTurnId = Number(formData.get("messageTurnId"));
  const responded = boolFromFormData(formData.get("responded"));
  const responseMessage = nullableString(formData.get("responseMessage"));
  const respondedAt = nullableString(formData.get("respondedAt"));

  await updateMessageTurnResponse({
    messageTurnId,
    responded,
    responseMessage,
    respondedAt: responded && respondedAt ? new Date(respondedAt).toISOString() : null
  });

  revalidatePath("/");
  revalidatePath(`/people/${personId}`);
}
