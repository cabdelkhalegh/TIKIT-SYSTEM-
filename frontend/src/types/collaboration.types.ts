export type CollaborationStatus = 
  | 'invited' 
  | 'accepted' 
  | 'active' 
  | 'completed' 
  | 'cancelled' 
  | 'declined';

export type PaymentStatus = 'pending' | 'processing' | 'paid';

export type DeliverableStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface Deliverable {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: DeliverableStatus;
  submittedAt?: string;
  reviewedAt?: string;
  feedback?: string;
  fileUrl?: string;
}

export interface Note {
  id: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
}

export interface PerformanceMetrics {
  reach?: number;
  impressions?: number;
  engagement?: number;
  clicks?: number;
  conversions?: number;
  [key: string]: number | undefined;
}

export interface Collaboration {
  id: string;
  campaignId: string;
  influencerId: string;
  role?: string;
  status: CollaborationStatus;
  agreedDeliverables?: Deliverable[];
  agreedDeliverablesJson?: string;
  agreedAmount?: number;
  paymentStatus: PaymentStatus;
  notes?: Note[];
  notesJson?: string;
  performanceMetrics?: PerformanceMetrics;
  performanceMetricsJson?: string;
  invitedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    campaignId: string;
    campaignName: string;
    status: string;
    clientId: string;
  };
  influencer?: {
    influencerId: string;
    profileName: string;
    fullName?: string;
    primaryPlatform?: string;
    profilePictureUrl?: string;
    audienceSize?: number;
  };
}

export interface CollaborationListResponse {
  success: boolean;
  data: Collaboration[];
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface CollaborationResponse {
  success: boolean;
  data: Collaboration;
}

export interface CreateCollaborationRequest {
  campaignId: string;
  influencerId: string;
  role?: string;
  agreedDeliverables?: Deliverable[];
  agreedAmount?: number;
  notes?: string;
}

export interface UpdateCollaborationRequest {
  role?: string;
  agreedDeliverables?: Deliverable[];
  agreedAmount?: number;
  paymentStatus?: PaymentStatus;
}

export interface BulkInviteRequest {
  campaignId: string;
  influencerIds: string[];
  role?: string;
  agreedDeliverables?: Deliverable[];
  agreedAmount?: number;
}

export interface SubmitDeliverableRequest {
  deliverableId: string;
  fileUrl?: string;
  notes?: string;
}

export interface ReviewDeliverableRequest {
  deliverableId: string;
  status: 'approved' | 'rejected';
  feedback?: string;
}

export interface AddNoteRequest {
  content: string;
}

export interface CollaborationAnalytics {
  collaborationId: string;
  totalDeliverables: number;
  completedDeliverables: number;
  pendingDeliverables: number;
  performanceMetrics: PerformanceMetrics;
  paymentInfo: {
    agreedAmount: number;
    paymentStatus: PaymentStatus;
  };
  timeline: {
    invitedAt: string;
    acceptedAt?: string;
    startedAt?: string;
    completedAt?: string;
  };
}

export interface CollaborationAnalyticsResponse {
  success: boolean;
  data: CollaborationAnalytics;
}
