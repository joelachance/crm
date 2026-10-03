import Link from "next/link";

import { OutreachDraftsTable } from "@/components/outreach-drafts-table";
import { listAllOutreachDrafts, todayReviewDateInChicago } from "@/lib/outreach-drafts";

export const dynamic = "force-dynamic";

export default async function OutreachOverviewPage() {
  const drafts = await listAllOutreachDrafts();
  const reviewDate = todayReviewDateInChicago();

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <Link className="font-mono-ui text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45 transition hover:text-white" href="/">
            Back to dashboard
          </Link>
          <h1 className="app-wordmark text-white">Outreach</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/55">
            Overview of all outreach drafts. Use filters to see what needs review, what is approved, and who has replied.
          </p>
        </div>
        <Link className="app-button-secondary px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/80" href={`/review/${reviewDate}`}>
          Today&apos;s review
        </Link>
      </section>

      <OutreachDraftsTable drafts={drafts} />
    </div>
  );
}
