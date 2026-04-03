import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { LinkedInPrefillFields } from "@/lib/types";

const linkedInImportSchema = z.object({
  fullName: z.string().trim().nullable(),
  companyName: z.string().trim().nullable(),
  email: z.string().trim().nullable(),
  phoneNumber: z.string().trim().nullable(),
  linkedinUrl: z.string().trim().nullable(),
  twitterUrl: z.string().trim().nullable(),
  redditUrl: z.string().trim().nullable(),
  notes: z.string().trim().nullable()
});

function toDraftValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeUrl(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return "";
  }
}

export function detectSocialPlatform(sourceUrl: string) {
  try {
    const host = new URL(sourceUrl).hostname.replace(/^www\./, "");

    if (host === "linkedin.com") {
      return "linkedin";
    }

    if (host === "x.com" || host === "twitter.com") {
      return "twitter";
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

export function emptyLinkedInPrefillFields(linkedInUrl = ""): LinkedInPrefillFields {
  const platform = detectSocialPlatform(linkedInUrl);

  return {
    fullName: "",
    companyName: "",
    email: "",
    phoneNumber: "",
    linkedinUrl: platform === "linkedin" ? linkedInUrl : "",
    twitterUrl: platform === "twitter" ? linkedInUrl : "",
    redditUrl: "",
    notes: ""
  };
}

export async function extractSocialPrefill(input: {
  sourceUrl: string;
  profileText: string;
}): Promise<LinkedInPrefillFields> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local before using LinkedIn AI prefill.");
  }

  const profileText = input.profileText.trim();
  const platform = detectSocialPlatform(input.sourceUrl);
  const platformLabel = platform === "twitter" ? "Twitter/X" : platform === "linkedin" ? "LinkedIn" : "social";

  if (profileText.length < 80) {
    throw new Error(`There was not enough visible ${platformLabel} profile text to extract contact details.`);
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });

  const result = await openai.responses.parse({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Extract CRM contact details from the supplied social profile content. The profile may come from LinkedIn or Twitter/X. Only return facts grounded in the content. Never invent email addresses, phone numbers, company names, or social profile URLs. Keep notes concise and useful for sales outreach."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Source URL: ${input.sourceUrl}\nPlatform: ${platformLabel}\n\nVisible social profile content:\n${profileText}`
          }
        ]
      }
    ],
    text: {
      format: zodTextFormat(linkedInImportSchema, "linkedin_contact_prefill")
    }
  });

  const parsed = result.output_parsed;

  if (!parsed) {
    throw new Error("The AI response did not contain a usable LinkedIn extraction.");
  }

  return {
    fullName: toDraftValue(parsed.fullName),
    companyName: toDraftValue(parsed.companyName),
    email: toDraftValue(parsed.email),
    phoneNumber: toDraftValue(parsed.phoneNumber),
    linkedinUrl:
      platform === "linkedin" ? normalizeUrl(parsed.linkedinUrl) || input.sourceUrl : normalizeUrl(parsed.linkedinUrl),
    twitterUrl:
      platform === "twitter" ? normalizeUrl(parsed.twitterUrl) || input.sourceUrl : normalizeUrl(parsed.twitterUrl),
    redditUrl: normalizeUrl(parsed.redditUrl),
    notes: toDraftValue(parsed.notes)
  };
}

export async function extractLinkedInPrefill(input: {
  linkedInUrl: string;
  profileText: string;
}): Promise<LinkedInPrefillFields> {
  return extractSocialPrefill({
    sourceUrl: input.linkedInUrl,
    profileText: input.profileText
  });
}
