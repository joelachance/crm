import type { CrmReplySnapshot, PersonSummary } from "@/lib/types";

export function getCrmLatestReply(person: PersonSummary | null): CrmReplySnapshot | null {
  if (!person) {
    return null;
  }

  const turn = person.messageTurns.find((messageTurn) => messageTurn.responded && messageTurn.responseMessage);

  if (!turn || !turn.responseMessage) {
    return null;
  }

  return {
    responseMessage: turn.responseMessage,
    respondedAt: turn.respondedAt,
    sentAt: turn.sentAt
  };
}
