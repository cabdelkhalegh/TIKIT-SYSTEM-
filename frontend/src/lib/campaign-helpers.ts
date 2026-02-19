// Campaign lifecycle helpers
export const CAMPAIGN_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canTransitionStatus(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = CAMPAIGN_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}
