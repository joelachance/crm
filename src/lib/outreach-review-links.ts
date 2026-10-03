import type { OutreachDraftResearchLink, PersonSummary } from "@/lib/types";

function normalizeUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

export function parseOutreachResearchLinks(value: unknown): OutreachDraftResearchLink[] {
  if (!value) {
    return [];
  }

  let parsed: unknown = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const links: OutreachDraftResearchLink[] = [];

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const label = "label" in entry && typeof entry.label === "string" ? entry.label.trim() : "";
    const url = "url" in entry && typeof entry.url === "string" ? entry.url.trim() : "";

    if (!label || !url) {
      continue;
    }

    try {
      new URL(url);
    } catch {
      continue;
    }

    links.push({ label, url });
  }

  return links;
}

export function mergeResearchLinks(
  draftLinks: OutreachDraftResearchLink[],
  person: PersonSummary | null
): OutreachDraftResearchLink[] {
  const merged: OutreachDraftResearchLink[] = [];
  const seen = new Set<string>();

  function add(label: string, url: string | null | undefined) {
    if (!url?.trim()) {
      return;
    }

    const normalized = normalizeUrl(url);

    if (seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    merged.push({ label, url: url.trim() });
  }

  for (const link of draftLinks) {
    add(link.label, link.url);
  }

  if (person) {
    add("LinkedIn", person.linkedinUrl);
    add("Twitter / X", person.twitterUrl);
    add("Reddit", person.redditUrl);
  }

  return merged;
}
