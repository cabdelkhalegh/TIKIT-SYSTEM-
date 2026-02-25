// Campaign lifecycle helpers — V2 8-stage status machine
export const CAMPAIGN_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['in_review', 'cancelled'],
  in_review: ['pitching', 'cancelled'],
  pitching: ['live', 'cancelled'],
  live: ['reporting', 'paused', 'cancelled'],
  reporting: ['closed', 'cancelled'],
  paused: ['live', 'cancelled'],
  closed: [],
  cancelled: [],
  // Legacy compatibility
  active: ['paused', 'completed', 'cancelled'],
  completed: [],
};

export function canTransitionStatus(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = CAMPAIGN_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

// Get the next valid forward status (non-cancel/pause)
export function getNextForwardStatus(currentStatus: string): string | null {
  const forwardMap: Record<string, string> = {
    draft: 'in_review',
    in_review: 'pitching',
    pitching: 'live',
    live: 'reporting',
    reporting: 'closed',
  };
  return forwardMap[currentStatus] || null;
}

// Status → Phase mapping
export const STATUS_TO_PHASE: Record<string, string> = {
  draft: 'brief_intake',
  in_review: 'budget_review',
  pitching: 'client_pitching',
  live: 'content_production',
  reporting: 'report_generation',
  closed: 'closure',
};

// Status display config for 8-stage workflow
export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'gray' },
  in_review: { label: 'In Review', color: 'amber' },
  pitching: { label: 'Pitching', color: 'purple' },
  live: { label: 'Live', color: 'green' },
  reporting: { label: 'Reporting', color: 'blue' },
  closed: { label: 'Closed', color: 'slate' },
  paused: { label: 'Paused', color: 'yellow' },
  cancelled: { label: 'Cancelled', color: 'red' },
};
