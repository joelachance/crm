export type ProductTag = {
  id: number;
  name: string;
  color: string;
  createdAt: string;
};

export type LinkedInPrefillFields = {
  fullName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  linkedinUrl: string;
  twitterUrl: string;
  redditUrl: string;
  notes: string;
};

export type LinkedInCapture = {
  id: string;
  sourceUrl: string;
  profileText: string;
  fields: LinkedInPrefillFields;
  createdAt: string;
};

export type ProductAssignment = {
  id: number;
  productTagId: number;
  productTagName: string;
  productTagColor: string;
  isIcp: boolean;
};

export type MessageTurn = {
  id: number;
  outboundMessage: string;
  responseMessage: string | null;
  responded: boolean;
  sentAt: string;
  respondedAt: string | null;
  createdAt: string;
};

export type PersonSummary = {
  id: number;
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
  createdAt: string;
  updatedAt: string;
  productAssignments: ProductAssignment[];
  messageTurns: MessageTurn[];
};

export type PersonDetail = PersonSummary & {
  allProductTags: ProductTag[];
};
