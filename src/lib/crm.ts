import { cache } from "react";

import { ensureSchema, sql } from "@/lib/db";
import { detectSocialPlatform, emptyLinkedInPrefillFields } from "@/lib/linkedin-import";
import { defaultProductTagColor, normalizeProductTagColor } from "@/lib/utils";
import type {
  LinkedInCapture,
  LinkedInPrefillFields,
  MessageTurn,
  PersonDetail,
  PersonSummary,
  ProductAssignment,
  ProductTag
} from "@/lib/types";

type DbPerson = {
  id: number;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone_number: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  reddit_url: string | null;
  resume: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

type DbTag = {
  id: number;
  name: string;
  color: string | null;
  created_at: string;
};

type DbAssignment = {
  id: number;
  person_id: number;
  product_tag_id: number;
  name: string;
  color: string | null;
  is_icp: boolean;
};

type DbMessageTurn = {
  id: number;
  person_id: number;
  outbound_message: string;
  response_message: string | null;
  responded: boolean;
  sent_at: string;
  responded_at: string | null;
  created_at: string;
};

type DbLinkedInCapture = {
  id: string;
  source_url: string;
  profile_text: string;
  extracted_fields: LinkedInPrefillFields | string;
  created_at: string;
};

function mapProductTag(row: DbTag): ProductTag {
  return {
    id: row.id,
    name: row.name,
    color: normalizeProductTagColor(row.color) ?? defaultProductTagColor(row.name),
    createdAt: row.created_at
  };
}

function mapAssignment(row: DbAssignment): ProductAssignment {
  return {
    id: row.id,
    productTagId: row.product_tag_id,
    productTagName: row.name,
    productTagColor: normalizeProductTagColor(row.color) ?? defaultProductTagColor(row.name),
    isIcp: row.is_icp
  };
}

function mapMessageTurn(row: DbMessageTurn): MessageTurn {
  return {
    id: row.id,
    outboundMessage: row.outbound_message,
    responseMessage: row.response_message,
    responded: row.responded,
    sentAt: row.sent_at,
    respondedAt: row.responded_at,
    createdAt: row.created_at
  };
}

function mapPerson(
  person: DbPerson,
  assignments: ProductAssignment[],
  messageTurns: MessageTurn[]
): PersonSummary {
  return {
    id: person.id,
    fullName: person.full_name,
    companyName: person.company_name,
    email: person.email,
    phoneNumber: person.phone_number,
    linkedinUrl: person.linkedin_url,
    twitterUrl: person.twitter_url,
    redditUrl: person.reddit_url,
    resume: person.resume,
    notes: person.notes,
    archived: person.archived,
    createdAt: person.created_at,
    updatedAt: person.updated_at,
    productAssignments: assignments,
    messageTurns
  };
}

function normalizeLinkedInFields(
  value: DbLinkedInCapture["extracted_fields"],
  sourceUrl: string
): LinkedInPrefillFields {
  const raw =
    typeof value === "string" ? (JSON.parse(value) as Partial<LinkedInPrefillFields>) : (value as Partial<LinkedInPrefillFields>);

  const defaults = emptyLinkedInPrefillFields(sourceUrl);
  const platform = detectSocialPlatform(sourceUrl);

  return {
    fullName: raw.fullName?.trim() ?? defaults.fullName,
    companyName: raw.companyName?.trim() ?? defaults.companyName,
    email: raw.email?.trim() ?? defaults.email,
    phoneNumber: raw.phoneNumber?.trim() ?? defaults.phoneNumber,
    linkedinUrl: raw.linkedinUrl?.trim() || (platform === "linkedin" ? sourceUrl : defaults.linkedinUrl),
    twitterUrl: raw.twitterUrl?.trim() || (platform === "twitter" ? sourceUrl : defaults.twitterUrl),
    redditUrl: raw.redditUrl?.trim() ?? defaults.redditUrl,
    notes: raw.notes?.trim() ?? defaults.notes
  };
}

function mapLinkedInCapture(row: DbLinkedInCapture): LinkedInCapture {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    profileText: row.profile_text,
    fields: normalizeLinkedInFields(row.extracted_fields, row.source_url),
    createdAt: row.created_at
  };
}

async function fetchAssignmentsByPerson() {
  const rows = (await sql`
    SELECT
      person_product_tags.id,
      person_product_tags.person_id,
      person_product_tags.product_tag_id,
      product_tags.name,
      product_tags.color,
      person_product_tags.is_icp
    FROM person_product_tags
    INNER JOIN product_tags ON product_tags.id = person_product_tags.product_tag_id
    ORDER BY product_tags.name ASC;
  `) as DbAssignment[];

  const byPerson = new Map<number, ProductAssignment[]>();

  for (const row of rows) {
    const current = byPerson.get(row.person_id) ?? [];
    current.push(mapAssignment(row));
    byPerson.set(row.person_id, current);
  }

  return byPerson;
}

async function fetchMessageTurnsByPerson() {
  const rows = (await sql`
    SELECT
      id,
      person_id,
      outbound_message,
      response_message,
      responded,
      sent_at,
      responded_at,
      created_at
    FROM message_turns
    ORDER BY sent_at DESC, created_at DESC;
  `) as DbMessageTurn[];

  const byPerson = new Map<number, MessageTurn[]>();

  for (const row of rows) {
    const current = byPerson.get(row.person_id) ?? [];
    current.push(mapMessageTurn(row));
    byPerson.set(row.person_id, current);
  }

  return byPerson;
}

export const getProductTags = cache(async () => {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, name, color, created_at
    FROM product_tags
    ORDER BY name ASC;
  `) as DbTag[];

  return rows.map(mapProductTag);
});

export const getLinkedInCapture = cache(async (captureId: string): Promise<LinkedInCapture | null> => {
  await ensureSchema();

  const rows = (await sql`
    SELECT id, source_url, profile_text, extracted_fields, created_at
    FROM linkedin_captures
    WHERE id = ${captureId}
    LIMIT 1;
  `) as DbLinkedInCapture[];

  const row = rows[0];
  return row ? mapLinkedInCapture(row) : null;
});

export const getPeople = cache(async (includeArchived = true) => {
  await ensureSchema();

  const peoplePromise = includeArchived
    ? sql`
        SELECT
          id,
          full_name,
          company_name,
          email,
          phone_number,
          linkedin_url,
          twitter_url,
          reddit_url,
          resume,
          notes,
          archived,
          created_at,
          updated_at
        FROM people
        ORDER BY archived ASC, updated_at DESC, created_at DESC;
      `
    : sql`
        SELECT
          id,
          full_name,
          company_name,
          email,
          phone_number,
          linkedin_url,
          twitter_url,
          reddit_url,
          resume,
          notes,
          archived,
          created_at,
          updated_at
        FROM people
        WHERE archived = FALSE
        ORDER BY archived ASC, updated_at DESC, created_at DESC;
      `;

  const [people, assignmentsByPerson, messagesByPerson] = await Promise.all([
    peoplePromise,
    fetchAssignmentsByPerson(),
    fetchMessageTurnsByPerson()
  ]);

  return (people as DbPerson[]).map((person) =>
    mapPerson(
      person,
      assignmentsByPerson.get(person.id) ?? [],
      messagesByPerson.get(person.id) ?? []
    )
  );
});

export const getPersonDetail = cache(async (personId: number): Promise<PersonDetail | null> => {
  await ensureSchema();

  const [personRows, assignmentsByPerson, messagesByPerson, allProductTags] = await Promise.all([
    sql`
      SELECT
        id,
        full_name,
        company_name,
        email,
        phone_number,
        linkedin_url,
        twitter_url,
        reddit_url,
        resume,
        notes,
        archived,
        created_at,
        updated_at
      FROM people
      WHERE id = ${personId}
      LIMIT 1;
    `,
    fetchAssignmentsByPerson(),
    fetchMessageTurnsByPerson(),
    getProductTags()
  ]);

  const person = (personRows as DbPerson[])[0];

  if (!person) {
    return null;
  }

  return {
    ...mapPerson(
      person,
      assignmentsByPerson.get(person.id) ?? [],
      messagesByPerson.get(person.id) ?? []
    ),
    allProductTags
  };
});

export async function createPerson(input: {
  fullName: string;
  companyName: string | null;
  email: string | null;
  phoneNumber: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  redditUrl: string | null;
  resume: string | null;
  notes: string | null;
}) {
  await ensureSchema();

  const rows = (await sql`
    INSERT INTO people (
      full_name,
      company_name,
      email,
      phone_number,
      linkedin_url,
      twitter_url,
      reddit_url,
      resume,
      notes
    )
    VALUES (
      ${input.fullName},
      ${input.companyName},
      ${input.email},
      ${input.phoneNumber},
      ${input.linkedinUrl},
      ${input.twitterUrl},
      ${input.redditUrl},
      ${input.resume},
      ${input.notes}
    )
    RETURNING id;
  `) as Array<{ id: number }>;

  return rows[0]?.id ?? null;
}

export async function updatePerson(
  personId: number,
  input: {
    fullName: string;
    companyName: string | null;
    email: string | null;
    phoneNumber: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
    redditUrl: string | null;
    resume: string | null;
    notes: string | null;
    archived: boolean;
  }
) {
  await ensureSchema();

  await sql`
    UPDATE people
    SET
      full_name = ${input.fullName},
      company_name = ${input.companyName},
      email = ${input.email},
      phone_number = ${input.phoneNumber},
      linkedin_url = ${input.linkedinUrl},
      twitter_url = ${input.twitterUrl},
      reddit_url = ${input.redditUrl},
      resume = ${input.resume},
      notes = ${input.notes},
      archived = ${input.archived}
    WHERE id = ${personId};
  `;
}

export async function setPersonArchived(personId: number, archived: boolean) {
  await ensureSchema();

  await sql`
    UPDATE people
    SET archived = ${archived}
    WHERE id = ${personId};
  `;
}

export async function deletePerson(personId: number) {
  await ensureSchema();

  await sql`
    DELETE FROM people
    WHERE id = ${personId};
  `;
}

export async function createProductTag(name: string, color?: string | null) {
  await ensureSchema();
  const productTagColor = normalizeProductTagColor(color) ?? defaultProductTagColor(name);

  await sql`
    INSERT INTO product_tags (name, color)
    VALUES (${name}, ${productTagColor})
    ON CONFLICT (name) DO NOTHING;
  `;
}

export async function getOrCreateProductTag(name: string, color?: string | null) {
  await ensureSchema();
  const productTagColor = normalizeProductTagColor(color) ?? defaultProductTagColor(name);

  const rows = (await sql`
    INSERT INTO product_tags (name, color)
    VALUES (${name}, ${productTagColor})
    ON CONFLICT (name)
    DO UPDATE SET
      name = EXCLUDED.name,
      color = COALESCE(product_tags.color, EXCLUDED.color)
    RETURNING id;
  `) as Array<{ id: number }>;

  return rows[0]?.id ?? null;
}

export async function updateProductTag(tagId: number, name: string, color?: string | null) {
  await ensureSchema();
  const productTagColor = normalizeProductTagColor(color) ?? defaultProductTagColor(name);

  await sql`
    UPDATE product_tags
    SET
      name = ${name},
      color = ${productTagColor}
    WHERE id = ${tagId};
  `;
}

export async function assignProductTagToPerson(personId: number, productTagId: number, isIcp: boolean) {
  await ensureSchema();

  await sql`
    INSERT INTO person_product_tags (person_id, product_tag_id, is_icp)
    VALUES (${personId}, ${productTagId}, ${isIcp})
    ON CONFLICT (person_id, product_tag_id)
    DO UPDATE SET is_icp = EXCLUDED.is_icp;
  `;
}

export async function removeProductTagFromPerson(personId: number, productTagId: number) {
  await ensureSchema();

  await sql`
    DELETE FROM person_product_tags
    WHERE person_id = ${personId} AND product_tag_id = ${productTagId};
  `;
}

export async function createMessageTurn(input: {
  personId: number;
  outboundMessage: string;
  responseMessage: string | null;
  responded: boolean;
  sentAt: string;
  respondedAt: string | null;
}) {
  await ensureSchema();

  await sql`
    INSERT INTO message_turns (
      person_id,
      outbound_message,
      response_message,
      responded,
      sent_at,
      responded_at
    )
    VALUES (
      ${input.personId},
      ${input.outboundMessage},
      ${input.responseMessage},
      ${input.responded},
      ${input.sentAt},
      ${input.respondedAt}
    );
  `;
}

export async function updateMessageTurnResponse(input: {
  messageTurnId: number;
  responded: boolean;
  responseMessage: string | null;
  respondedAt: string | null;
}) {
  await ensureSchema();

  await sql`
    UPDATE message_turns
    SET
      responded = ${input.responded},
      response_message = ${input.responseMessage},
      responded_at = ${input.respondedAt}
    WHERE id = ${input.messageTurnId};
  `;
}

export async function createLinkedInCapture(input: {
  sourceUrl: string;
  profileText: string;
  fields: LinkedInPrefillFields;
}) {
  await ensureSchema();

  const captureId = crypto.randomUUID();

  await sql`
    INSERT INTO linkedin_captures (
      id,
      source_url,
      profile_text,
      extracted_fields
    )
    VALUES (
      ${captureId},
      ${input.sourceUrl},
      ${input.profileText},
      ${JSON.stringify(input.fields)}::jsonb
    );
  `;

  return captureId;
}
