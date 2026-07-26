// Ported from live-show-react's src/features/advertisements/types/advertisement.types.ts,
// updated to the final backend contract (live-show-orchestrator src/advertisements):
// advertiserAccountId replaces organizationId, and the flat eventId field is
// replaced by a destination union (see domain/ad-destination.ts).
export type AdStatus = 'DRAFT' | 'REVIEW' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'REJECTED';
export type AdFormat = 'HORIZONTAL_728x90' | 'VERTICAL_300x600';
export type AdPlacement = 'FEED' | 'EVENT_DETAIL' | 'CHECKOUT' | 'POST_PURCHASE';
export type AdBillingModel = 'CPM' | 'CPC';
export type AdStatusAction = 'submit' | 'activate' | 'pause' | 'end';
export type FrequencyCapWindow = 'day' | 'total';
// Advertisers may only target the 5 adult brackets — AGE_13_17 is excluded
// from targeting eligibility server-side (backend W1).
export type AgeBracket = 'AGE_13_17' | 'AGE_18_24' | 'AGE_25_34' | 'AGE_35_44' | 'AGE_45_54' | 'AGE_55_PLUS';

// Mirrors AdDestination in orchestrator's domain/ad-destination.ts.
// null = legacy ad predating destinations (ineligible to serve until edited).
export type AdDestination =
  | { type: 'EVENT'; eventId: string }
  | { type: 'EXTERNAL_URL'; url: string };

// Review history entry for the advertiser (GET /ads/:id/reviews).
export interface AdReviewEntry {
  id: string;
  adId: string;
  reviewerType: string;
  outcome: 'APPROVE' | 'REJECT' | 'PENDING' | 'SUBMITTED';
  reason: string | null;
  reviewedBy: string;
  createdAt: string;
}

export interface AdResponse {
  id: string;
  advertiserAccountId: string;
  destination: AdDestination | null;
  title: string;
  format: AdFormat;
  status: AdStatus;
  placements: AdPlacement[];
  targetDomains: string[];
  targetCategories: string[];
  bannerUrl: string | null;
  frequencyCapMax: number | null;
  frequencyCapWindow: FrequencyCapWindow | null;
  billingModel: AdBillingModel;
  bidCents: number;
  dailyBudgetCents: number;
  totalLimitCents: number;
  totalSpendCents: number;
  startsAt: string;
  endsAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdRequest {
  advertiserAccountId: string;
  // Omitted = legacy-shaped draft (destination null server-side); must be set
  // before the ad can be submitted for review.
  destination?: AdDestination;
  title: string;
  format: AdFormat;
  placements: AdPlacement[];
  targetDomains: string[];
  targetCategories: string[];
  // Empty/omitted = all ages.
  targetAgeBrackets?: AgeBracket[];
  frequencyCapMax?: number;
  frequencyCapWindow?: FrequencyCapWindow;
  billingModel: AdBillingModel;
  bidCents: number;
  dailyBudgetCents: number;
  totalLimitCents: number;
  startsAt: string;
  endsAt: string;
}

export interface UpdateAdRequest {
  destination?: AdDestination;
  title?: string;
  format?: AdFormat;
  placements?: AdPlacement[];
  targetDomains?: string[];
  targetCategories?: string[];
  frequencyCapMax?: number;
  frequencyCapWindow?: FrequencyCapWindow;
  billingModel?: AdBillingModel;
  bidCents?: number;
  dailyBudgetCents?: number;
  totalLimitCents?: number;
  startsAt?: string;
  endsAt?: string;
}

export interface ChangeAdStatusRequest {
  action: AdStatusAction;
}

export interface AdDailyBreakdown {
  date: string;
  impressions: number;
  clicks: number;
  spendCents: number;
}

export interface AdReportResponse {
  adId: string;
  title: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number | null;
  spendCents: number;
  dailyBreakdown: AdDailyBreakdown[];
}

// Mirrors AdvertiserAccount.toJSON() in orchestrator's domain/advertiser-account.ts.
export type AdvertiserAccountStatus = 'ACTIVE' | 'SUSPENDED';

export interface AdvertiserAccountResponse {
  id: string;
  name: string;
  organizationId: string | null;
  status: AdvertiserAccountStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvertiserRequest {
  name: string;
}

export interface UpdateAdvertiserRequest {
  name: string;
}

// Mirrors AdvertiserMember.toJSON() in orchestrator's domain/advertiser-member.ts.
export type AdvertiserMemberRole = 'OWNER' | 'MANAGER';

// GET /advertisers/:id/members response shape — enriched server-side with
// user display data (see AdvertisersController.members in the orchestrator).
export interface AdvertiserMemberResponse {
  userId: string;
  displayName: string | null;
  email: string | null;
  role: AdvertiserMemberRole;
}

// Mirrors AdvertiserInvite.toJSON() in the orchestrator — returned by
// POST /advertisers/:id/invites (creation, includes token) and by
// POST /advertiser-invites/:token/accept (accept, includes token).
export type AdvertiserInviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface AdvertiserInvite {
  id: string;
  advertiserAccountId: string;
  email: string;
  role: AdvertiserMemberRole;
  token: string;
  status: AdvertiserInviteStatus;
  invitedByUserId: string;
  createdAt: string;
  expiresAt: string;
  acceptedByUserId: string | null;
  acceptedAt: string | null;
}

// GET /advertisers/:id/invites response shape — same fields minus `token`,
// PENDING invites only.
export type AdvertiserInviteView = Omit<AdvertiserInvite, 'token'>;

export interface CreateInviteRequest {
  email: string;
  role: AdvertiserMemberRole;
}

export interface CreateInviteResult {
  invite: AdvertiserInvite;
  acceptUrl: string;
}

// GET /advertiser-invites/:token preview shape (token-authenticated, no auth
// header) — shown on the accept page before the user commits.
export interface AdvertiserInvitePreview {
  accountId: string;
  accountName: string;
  role: AdvertiserMemberRole;
  inviterName: string;
  email: string;
  status: AdvertiserInviteStatus;
  expiresAt: string;
}
