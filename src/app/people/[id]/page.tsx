import Link from "next/link";
import { notFound } from "next/navigation";

import { MessageTimeline, PersonAssignments, PersonEditor } from "@/components/forms";
import { getPersonDetail } from "@/lib/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) {
    notFound();
  }

  const { id } = await params;
  const person = await getPersonDetail(Number(id));

  if (!person) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <Link className="font-mono-ui text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45 transition hover:text-white" href="/">
            Back to dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{person.fullName}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
            Manage this person’s profile, decide which products apply to them, and keep a turn-by-turn record of every outbound message and reply.
          </p>
        </div>
        <span
          className={`font-mono-ui border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            person.archived ? "border-white/10 bg-[#0a0a0a] text-white/45" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {person.archived ? "Archived" : "Active"}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <PersonEditor person={person} />
          <PersonAssignments person={person} />
        </div>
        <MessageTimeline person={person} />
      </div>
    </div>
  );
}
