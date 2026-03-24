import { apiClient } from './client'

export interface AdminStats {
  totalOrganizations: number
  totalUsers: number
  activeSubscriptions: number
  trialingSubscriptions: number
  mrr: number
  arr: number
  newOrgsThisMonth: number
  newUsersThisMonth: number
}

export interface AdminOrg {
  id: string
  name: string
  slug: string
  createdAt: string
  memberCount: number
  leadCount: number
  subscription: {
    tier: string
    status: string
    currentPeriodEnd: string
  } | null
}

export interface AdminUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: string
  organizations: { name: string; role: string }[]
}

export interface AdminSubscription {
  id: string
  organizationId: string
  organizationName: string
  tier: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  paymentMethodBrand: string | null
  paymentMethodLast4: string | null
}

export interface RevenueData {
  month: string
  mrr: number
  newSubs: number
  churned: number
}

export interface TierBreakdown {
  tier: string
  count: number
  percentage: number
}

export const getStats = () =>
  apiClient.get<{ success: boolean; data: AdminStats }>('/stats')

export const getOrganizations = (page = 1, limit = 20, search = '') =>
  apiClient.get<{ success: boolean; data: AdminOrg[]; total: number; page: number; totalPages: number }>(
    `/organizations?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
  )

export const getUsers = (page = 1, limit = 20, search = '') =>
  apiClient.get<{ success: boolean; data: AdminUser[]; total: number; page: number; totalPages: number }>(
    `/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
  )

export interface AdminUserDetail {
  id: string; name: string; email: string; emailVerified: boolean
  image: string | null; role: string | null; banned: boolean | null
  banReason: string | null; banExpires: string | null
  createdAt: string; updatedAt: string
  organizations: { id: string; name: string; slug: string; role: string; joinedAt: string }[]
  sessions: { id: string; ipAddress: string | null; userAgent: string | null; createdAt: string; expiresAt: string }[]
  accounts: { id: string; provider: string; accountId: string; createdAt: string }[]
  assignedLeads: { leadId: string; leadName: string; leadEmail: string; status: string; organization: string; assignedAt: string }[]
}

export const getUserDetail = (id: string) =>
  apiClient.get<{ success: boolean; data: AdminUserDetail }>(`/users/${id}`)

export interface AdminOrgDetail {
  id: string; name: string; slug: string; logo: string | null; createdAt: string; metadata: string | null
  stats: {
    totalLeads: number; totalAutomations: number; totalKbEntries: number
    totalMembers: number; totalAiRequests: number; totalTokensUsed: number
    leadsByStatus: Record<string, number>
  }
  subscription: {
    id: string; tier: string; status: string
    currentPeriodStart: string; currentPeriodEnd: string; cancelAtPeriodEnd: boolean
    stripeCustomerId: string | null; stripeSubscriptionId: string | null
    paymentMethodBrand: string | null; paymentMethodLast4: string | null
  } | null
  members: { id: string; role: string; joinedAt: string; user: { id: string; name: string; email: string; image: string | null; emailVerified: boolean } }[]
  recentLeads: { id: string; name: string; email: string; status: string; source: string; aiScore: string | null; createdAt: string }[]
  automations: { id: string; name: string; triggerType: string; isActive: boolean; logCount: number; createdAt: string }[]
  knowledgeBases: { id: string; title: string; type: string; createdAt: string }[]
  pendingInvitations: { id: string; email: string; role: string | null; expiresAt: string; createdAt: string }[]
  formConfig: { title: string; accentColor: string; fieldCount: number } | null
}

export const getOrganizationDetail = (id: string) =>
  apiClient.get<{ success: boolean; data: AdminOrgDetail }>(`/organizations/${id}`)

export const getSubscriptions = (page = 1, limit = 20, tier = '', status = '') =>
  apiClient.get<{ success: boolean; data: AdminSubscription[]; total: number; page: number; totalPages: number }>(
    `/subscriptions?page=${page}&limit=${limit}&tier=${tier}&status=${status}`
  )

export const getRevenue = () =>
  apiClient.get<{ success: boolean; data: { monthly: RevenueData[]; tierBreakdown: TierBreakdown[] } }>('/revenue')

export const getMe = () =>
  apiClient.get<{ success: boolean; data: { admin: boolean; user: { id: string; email: string; name: string } } }>('/me')

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface PlanFeature {
  id: string
  tier: string
  label: string
  sortOrder: number
}

export interface AdminPlan {
  tier: string
  name: string
  priceAmount: number
  priceCurrency: string
  priceLabel: string
  usdApprox: string
  leadsPerMonth: number
  maxAutomations: number
  aiScoring: boolean
  followUpAutomation: boolean
  knowledgeBaseEntries: number
  emailEventTracking: boolean
  transcriptsPerLead: number
  features: PlanFeature[]
}

export const getPlans = () =>
  apiClient.get<{ success: boolean; data: AdminPlan[] }>('/plans')

export const updatePlan = (tier: string, data: Partial<AdminPlan>) =>
  apiClient.put<{ success: boolean; data: AdminPlan }>(`/plans/${tier}`, data)

// ─── Leads ────────────────────────────────────────────────────────────────────

export interface AdminLead {
  id: string
  name: string
  email: string
  source: string
  status: string
  aiScore: string | null
  createdAt: string
  organization: { id: string; name: string }
}

export const getLeads = (page = 1, limit = 25, search = '', orgId = '', status = '') =>
  apiClient.get<{
    success: boolean
    data: AdminLead[]
    total: number
    page: number
    totalPages: number
    statusCounts: Record<string, number>
  }>(`/leads?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&orgId=${orgId}&status=${status}`)

export interface AdminLeadDetail {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  source: string
  status: string
  aiScore: string | null
  customFields: Record<string, string> | null
  createdAt: string
  updatedAt: string
  repliedAt: string | null
  followUpSentAt: string | null
  contactedAt: string | null
  organization: { id: string; name: string; slug: string }
  conversations: { id: string; channel: string; message: string; sender: string; createdAt: string }[]
  assignments: { id: string; user: { id: string; name: string; email: string; image: string | null } }[]
  notes: { id: string; content: string; createdAt: string }[]
  transcripts: { id: string; title: string; content: string; createdAt: string }[]
  followUpDrafts: { id: string; subject: string; body: string; status: string; createdAt: string }[]
  emailEvents: { id: string; event: string; email: string; url: string | null; reason: string | null; isMachineOpen: boolean | null; timestamp: string; provider: string }[]
  aiLogs: { id: string; model: string; tokensUsed: number; createdAt: string }[]
}

export const getLeadDetail = (id: string) =>
  apiClient.get<{ success: boolean; data: AdminLeadDetail }>(`/leads/${id}`)

// ─── AI Usage ─────────────────────────────────────────────────────────────────

export interface OrgAiUsage {
  organizationId: string
  organizationName: string
  tokensUsed: number
  requestCount: number
  estimatedCostUsd: number
}

export interface AiLogEntry {
  id: string
  model: string
  tokensUsed: number
  createdAt: string
  organization: { id: string; name: string }
  lead: { id: string; name: string } | null
}

export const getAiUsage = (page = 1) =>
  apiClient.get<{
    success: boolean
    data: {
      totalLogs: number
      totalTokensAllTime: number
      byOrg: OrgAiUsage[]
      recentLogs: AiLogEntry[]
      total: number
      page: number
      totalPages: number
    }
  }>(`/ai-usage?page=${page}`)

// ─── Automations ──────────────────────────────────────────────────────────────

export interface AdminAutomation {
  id: string
  name: string
  description: string | null
  triggerType: string
  isActive: boolean
  createdAt: string
  organization: { id: string; name: string }
  logCount: number
}

// ─── Manual Payments ──────────────────────────────────────────────────────────

export type AdminManualPaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type AdminManualPaymentMethod = 'GCASH' | 'GOTYME'

export interface AdminManualPayment {
  id:              string
  organizationId:  string
  organization:    { id: string; name: string }
  tier:            string
  amount:          number
  paymentMethod:   AdminManualPaymentMethod
  referenceNumber: string | null
  receiptUrl:      string
  receiptKey:      string
  status:          AdminManualPaymentStatus
  adminNote:       string | null
  reviewedBy:      string | null
  reviewedAt:      string | null
  createdAt:       string
  updatedAt:       string
}

export const getManualPayments = (page = 1, limit = 25, status = '', method = '', orgId = '') =>
  apiClient.get<{
    success: boolean
    data: { data: AdminManualPayment[]; total: number; page: number; totalPages: number; pendingCount: number }
  }>(`/manual-payments?page=${page}&limit=${limit}&status=${status}&method=${method}&orgId=${orgId}`)

export const getManualPaymentDetail = (id: string) =>
  apiClient.get<{ success: boolean; data: AdminManualPayment }>(`/manual-payments/${id}`)

export const approveManualPayment = (id: string, note?: string) =>
  apiClient.patch<{ success: boolean; message: string }>(`/manual-payments/${id}/approve`, { note })

export const rejectManualPayment = (id: string, note?: string) =>
  apiClient.patch<{ success: boolean; message: string }>(`/manual-payments/${id}/reject`, { note })

export const getAutomations = (page = 1, limit = 25, search = '', orgId = '', active = '') =>
  apiClient.get<{
    success: boolean
    data: AdminAutomation[]
    total: number
    activeCount: number
    page: number
    totalPages: number
  }>(`/automations?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&orgId=${orgId}&active=${active}`)

// ─── Access Requests ──────────────────────────────────────────────────────────

export type AccessRequestType   = 'EARLY_ACCESS' | 'DEMO'
export type AccessRequestStatus = 'PENDING' | 'CONTACTED' | 'REJECTED'

export interface AdminAccessRequest {
  id:        string
  type:      AccessRequestType
  name:      string
  email:     string
  company:   string | null
  message:   string | null
  status:    AccessRequestStatus
  adminNote: string | null
  createdAt: string
  updatedAt: string
}

export const getAccessRequests = (page = 1, limit = 25, type = '', status = '') =>
  apiClient.get<{
    success: boolean
    data: AdminAccessRequest[]
    total: number
    page: number
    totalPages: number
  }>(`/access-requests?page=${page}&limit=${limit}&type=${type}&status=${status}`)

export const updateAccessRequestStatus = (id: string, status: AccessRequestStatus, adminNote?: string) =>
  apiClient.patch<{ success: boolean; data: AdminAccessRequest }>(`/access-requests/${id}/status`, { status, adminNote })

export const provisionAccessRequestUser = (id: string, data: {
  name: string; email: string; password: string; organizationName: string
}) =>
  apiClient.post<{ success: boolean; data: { userId: string; organizationId: string } }>(`/access-requests/${id}/provision`, data)

// ─── Email Config ─────────────────────────────────────────────────────────────

export interface EmailConfigData {
  provider: 'smtp' | 'sendgrid' | 'resend'
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPassSet: boolean
  fromEmail: string
  fromName: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
}

export interface EmailConfigUpdate {
  provider?: string
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPass?: string
  fromEmail?: string
  fromName?: string
  imapHost?: string
  imapPort?: number
  imapSecure?: boolean
}

export const getEmailConfig = () =>
  apiClient.get<{ success: boolean; data: EmailConfigData }>('/email-config')

export const updateEmailConfig = (data: EmailConfigUpdate) =>
  apiClient.put<{ success: boolean; data: EmailConfigData }>('/email-config', data)

export const testSmtpConnection = (to: string) =>
  apiClient.post<{ success: boolean; data: { message: string } }>('/email-config/test-smtp', { to })

export const testImapConnection = () =>
  apiClient.post<{ success: boolean; data: { message: string; host: string; port: number } }>('/email-config/test-imap', {})

// ─── Inbox (IMAP) ─────────────────────────────────────────────────────────────

export interface EmailSummary {
  uid: number
  subject: string
  from: string
  fromEmail: string
  to: string
  date: string
  seen: boolean
  hasAttachments: boolean
  preview: string
  folder: string
}

export interface EmailDetail extends EmailSummary {
  html: string | null
  text: string | null
  cc: string
  replyTo: string
}

export const getInboxFolders = () =>
  apiClient.get<{ success: boolean; data: string[] }>('/inbox/folders')

export const getInboxEmails = (folder = 'INBOX', page = 1, limit = 25) =>
  apiClient.get<{ success: boolean; data: { emails: EmailSummary[]; total: number; folder: string } }>(
    `/inbox?folder=${encodeURIComponent(folder)}&page=${page}&limit=${limit}`
  )

export const getInboxEmail = (uid: number, folder = 'INBOX') =>
  apiClient.get<{ success: boolean; data: EmailDetail }>(
    `/inbox/${uid}?folder=${encodeURIComponent(folder)}`
  )

export const deleteInboxEmail = (uid: number, folder = 'INBOX') =>
  apiClient.delete<{ success: boolean; data: { message: string } }>(
    `/inbox/${uid}`,
    { data: { folder } }
  )
