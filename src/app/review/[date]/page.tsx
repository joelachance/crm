import { notFound } from "next/navigation";

import { DailyReview } from "@/components/daily-review";
import { getDatabaseMode, getDefaultReviewerName } from "@/lib/db";
import {
  getOutreachDraftsForReview,
  isValidReviewDate,
  seedDemoOutreachDraftsIfEmpty
} from "@/lib/outreach-drafts";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ date: string }>;
};

export default async function DailyReviewPage({ params }: PageProps) {
  const { date } = await params;

  if (!isValidReviewDate(date)) {
    notFound();
  }

  const databaseMode = getDatabaseMode();

  if (databaseMode === "sqlite") {
    await seedDemoOutreachDraftsIfEmpty(date);
  }

  const drafts = await getOutreachDraftsForReview(date);

  return (
    <DailyReview
      databaseMode={databaseMode}
      defaultReviewerName={getDefaultReviewerName()}
      drafts={drafts}
      reviewDate={date}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { date } = await params;

  return {
    title: `ERA — Review ${date}`
  };
}
