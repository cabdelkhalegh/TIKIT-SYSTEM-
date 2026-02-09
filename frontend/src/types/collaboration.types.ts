export type CollaborationStatus = 
  | 'invited' 
  | 'accepted' 
  | 'active' 
  | 'completed' 
  | 'cancelled' 
  | 'declined';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'partial';

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
  collaborationStatus: string;
  agreedDeliverables?: string;
  deliveredContent?: string;
  agreedPayment?: number;
  paymentStatus: PaymentStatus;
  performanceMetrics?: string;
  invitedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  campaign?: {
    campaignId: string;
    campaignName: string;
    status: string;
    clientId: string;
  };
  influencer?: {
    influencerId: string;
    fullName: string;
    displayName?: string;
    primaryPlatform?: string;
    profileImageUrl?: string;
  };
}

export interface CollaborationListResponse {
  success: boolean;
  data: Collaboration[];
  count: number;
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
  agreedDeliverables?: string;
  agreedPayment?: number;
  notes?: string;
}

export interface UpdateCollaborationRequest {
  role?: string;
  agreedDeliverables?: string;
  agreedPayment?: number;
  paymentStatus?: PaymentStatus;
}

export interface BulkInviteRequest {
  campaignId: string;
  influencerIds: string[];
  role?: string;
  agreedDeliverables?: string;
  agreedPayment?: number;
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
    agreedPayment: number;
    paymentStatus: PaymentStatus;
  };
  timeline: {
    invitedAt: string;
    acceptedAt?: string;
    completedAt?: string;
  };
}

export interface CollaborationAnalyticsResponse {
  success: boolean;
  data: CollaborationAnalytics;
}
