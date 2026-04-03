import { NextResponse } from "next/server";
import { z } from "zod";

import { createPerson } from "@/lib/crm";
import { detectSocialPlatform, extractSocialPrefill } from "@/lib/linkedin-import";

export const dynamic = "force-dynamic";

const captureRequestSchema = z.object({
  sourceUrl: z.string().trim().url(),
  profileText: z.string().trim().min(80).max(20000)
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

function fallbackNameFromProfileUrl(sourceUrl: string) {
  try {
    const pathname = new URL(sourceUrl).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() ?? "";
    const withoutNumericSuffix = slug.replace(/-\d+$/, "");
    const words = withoutNumericSuffix
      .split("-")
      .map((word) => word.trim())
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

    return words.join(" ").trim();
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = captureRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid LinkedIn capture payload."
      },
      {
        status: 400,
        headers: corsHeaders
      }
    );
  }

  try {
    const fields = await extractSocialPrefill({
      sourceUrl: parsed.data.sourceUrl,
      profileText: parsed.data.profileText
    });
    const platform = detectSocialPlatform(parsed.data.sourceUrl);

    const fullName = fields.fullName.trim() || fallbackNameFromProfileUrl(parsed.data.sourceUrl) || "Social Contact";

    const personId = await createPerson({
      fullName,
      companyName: fields.companyName.trim() || null,
      email: fields.email.trim() || null,
      phoneNumber: fields.phoneNumber.trim() || null,
      linkedinUrl: fields.linkedinUrl.trim() || (platform === "linkedin" ? parsed.data.sourceUrl : null),
      twitterUrl: fields.twitterUrl.trim() || (platform === "twitter" ? parsed.data.sourceUrl : null),
      redditUrl: fields.redditUrl.trim() || null,
      resume: fields.notes.trim() || null,
      notes: null
    });

    if (!personId) {
      throw new Error("The CRM could not create a person from this social profile capture.");
    }

    const redirectUrl = new URL(`/people/${personId}`, request.url);

    return NextResponse.json(
      {
        personId,
        redirectUrl: redirectUrl.toString()
      },
      {
        headers: corsHeaders
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Social profile capture import failed."
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
