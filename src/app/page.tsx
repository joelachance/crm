import { CreatePersonForm } from "@/components/create-person-form";
import { CustomersTable } from "@/components/customers-table";
import { EraTagline } from "@/components/era-tagline";
import { getPeople } from "@/lib/crm";
import { isDatabaseConfigured } from "@/lib/db";
import type { PersonSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

type MarqueeTone = "danger" | "warning" | "success";

type MarqueeItem = {
  verb: string;
  label: string;
  tone: MarqueeTone;
};

const fallbackMarqueeItems: MarqueeItem[] = [
  { verb: "fresh", label: "extension ready for the next capture", tone: "success" },
  { verb: "watch", label: "waiting on the next live reply", tone: "warning" },
  { verb: "watch", label: "manual add on standby", tone: "warning" }
];

function latestMessageTurn(person: PersonSummary) {
  return person.messageTurns[0] ?? null;
}

function personLabel(person: PersonSummary) {
  return person.companyName ? `${person.fullName} / ${person.companyName}` : person.fullName;
}

function formatResponseSpeedHours(hours: number) {
  if (hours < 24) {
    return `${Math.max(1, Math.round(hours))}h`;
  }

  return `${Math.max(1, Math.round(hours / 24))}d`;
}

function formatElapsedSince(dateValue: string) {
  const timestamp = new Date(dateValue).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  const hours = (Date.now() - timestamp) / (1000 * 60 * 60);

  if (hours < 24) {
    return `${Math.max(1, Math.round(hours))}h ago`;
  }

  return `${Math.max(1, Math.round(hours / 24))}d ago`;
}

function buildMarqueeItem(person: PersonSummary): MarqueeItem | null {
  const turn = latestMessageTurn(person);

  if (!turn) {
    return {
      verb: "watch",
      label: `${personLabel(person)} added recently`,
      tone: "warning"
    };
  }

  const lastCorrespondence = turn.respondedAt ?? turn.sentAt;
  const lastTimestamp = new Date(lastCorrespondence).getTime();

  if (Number.isNaN(lastTimestamp)) {
    return null;
  }

  const hoursSinceLastCorrespondence = (Date.now() - lastTimestamp) / (1000 * 60 * 60);
  const lastSeenLabel = formatElapsedSince(lastCorrespondence) ?? "recently";

  if (!turn.responded) {
    if (hoursSinceLastCorrespondence >= 96) {
      return {
        verb: "follow up",
        label: `${personLabel(person)} last touched ${lastSeenLabel}`,
        tone: "danger"
      };
    }

    if (hoursSinceLastCorrespondence >= 36) {
      return {
        verb: "watch",
        label: `${personLabel(person)} last touched ${lastSeenLabel}`,
        tone: "warning"
      };
    }

    return {
      verb: "fresh",
      label: `${personLabel(person)} last touched ${lastSeenLabel}`,
      tone: "success"
    };
  }

  const sentAt = new Date(turn.sentAt).getTime();
  const respondedAt = turn.respondedAt ? new Date(turn.respondedAt).getTime() : Number.NaN;
  const responseHours =
    !Number.isNaN(sentAt) && !Number.isNaN(respondedAt) && respondedAt > sentAt ? (respondedAt - sentAt) / (1000 * 60 * 60) : null;

  if (responseHours !== null && responseHours <= 48 && hoursSinceLastCorrespondence <= 120) {
    return {
      verb: "moving",
      label: `${personLabel(person)} replied in ${formatResponseSpeedHours(responseHours)}`,
      tone: "success"
    };
  }

  if (hoursSinceLastCorrespondence >= 168) {
    return {
      verb: "follow up",
      label: `${personLabel(person)} last replied ${lastSeenLabel}`,
      tone: "danger"
    };
  }

  if (hoursSinceLastCorrespondence >= 72) {
    return {
      verb: "watch",
      label: `${personLabel(person)} last replied ${lastSeenLabel}`,
      tone: "warning"
    };
  }

  return {
    verb: "good",
    label: `${personLabel(person)} last replied ${lastSeenLabel}`,
    tone: "success"
  };
}

function buildMarqueeItems(people: PersonSummary[]) {
  const activePeople = people.filter((person) => !person.archived);
  const priorityOrder: Record<MarqueeTone, number> = {
    danger: 0,
    warning: 1,
    success: 2
  };

  const items = activePeople
    .map((person) => buildMarqueeItem(person))
    .filter((item): item is MarqueeItem => Boolean(item))
    .sort((left, right) => priorityOrder[left.tone] - priorityOrder[right.tone])
    .slice(0, 10);

  return items.length > 0 ? items : fallbackMarqueeItems;
}

export default async function HomePage() {
  if (!isDatabaseConfigured()) {
    return (
      <section className="app-panel space-y-5 p-6 md:p-8">
        <span className="app-section-title">
          Setup required
        </span>
        <div className="">
          <h1 className="app-wordmark text-white">ERA</h1>
          <EraTagline />
        </div>
        <div className="max-w-2xl space-y-3 text-sm leading-7 text-white/62">
          <p>Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your Neon Postgres URL.</p>
          <p>Once that variable exists, refresh the page and the app will create the required tables automatically on first load.</p>
        </div>
      </section>
    );
  }

  const people = await getPeople(true);

  const activeCount = people.filter((person) => !person.archived).length;
  const icpAssignments = people.flatMap((person) => person.productAssignments).filter((assignment) => assignment.isIcp).length;
  const archivedCount = people.filter((person) => person.archived).length;
  const marqueeItems = buildMarqueeItems(people);

  return (
    <div className="space-y-4">
      <section className="space-y-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <h1 className="app-wordmark text-white">ERA</h1>
          <EraTagline />
        </div>
      </section>

      <section className="app-panel overflow-hidden">
        <div className="app-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <div className="app-marquee-item" key={`${item.verb}-${item.label}-${index}`}>
              <span
                className={`inline-flex h-1.5 w-1.5 shrink-0 self-center rounded-full ${
                  item.tone === "danger" ? "bg-red-400" : item.tone === "warning" ? "bg-amber-300" : "bg-emerald-300"
                }`}
              />
              <span
                className={`inline-flex items-center leading-none ${
                  item.tone === "danger" ? "text-red-300" : item.tone === "warning" ? "text-amber-200" : "text-emerald-200"
                }`}
              >
                {item.verb}
              </span>
              <span className="inline-flex items-center leading-none text-white/58">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-4">
        <div className="bg-[#080808] px-4 py-4">
          <p className="app-section-title">Contacts</p>
          <p className="app-display mt-3 text-3xl text-white">{people.length}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/38">Total records</p>
        </div>
        <div className="bg-[#080808] px-4 py-4">
          <p className="app-section-title">Active</p>
          <p className="app-display mt-3 text-3xl text-white">{activeCount}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/38">Currently in rotation</p>
        </div>
        <div className="bg-[#080808] px-4 py-4">
          <p className="app-section-title">Archived</p>
          <p className="app-display mt-3 text-3xl text-white">{archivedCount}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/38">Inactive records</p>
        </div>
        <div className="bg-[#080808] px-4 py-4">
          <p className="app-section-title">ICP Matches</p>
          <p className="app-display mt-3 text-3xl text-white">{icpAssignments}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/38">Across all tags</p>
        </div>
      </section>

      <CustomersTable people={people} />

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <section className="app-panel space-y-3 p-4 md:p-5">
          <p className="app-section-title">Install extension</p>
          <div className="space-y-2 text-sm leading-6 text-white/62">
            <p>1. Open `chrome://extensions` and enable Developer Mode.</p>
            <p>2. Click `Load unpacked` and choose `extension/linkedin-capture`.</p>
            <p>3. Open a LinkedIn or Twitter/X profile and click `Add to CRM`.</p>
          </div>
        </section>

        <section className="app-panel overflow-hidden">
          <details className="app-details group" open={people.length === 0}>
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-4 md:px-5">
              <p className="app-section-title">Manual add</p>
              <span className="app-button-secondary px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/72">
                Expand
              </span>
            </summary>
            <div className="border-t border-white/10">
              <CreatePersonForm variant="embedded" />
            </div>
          </details>
        </section>
      </section>
    </div>
  );
}
