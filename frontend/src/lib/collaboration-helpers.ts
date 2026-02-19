// Collaboration status workflow
export const COLLABORATION_STATUS_TRANSITIONS: Record<string, string[]> = {
  invited: ['accepted', 'declined'],
  accepted: ['active', 'cancelled'],
  declined: [],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canTransitionCollaborationStatus(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = COLLABORATION_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}
