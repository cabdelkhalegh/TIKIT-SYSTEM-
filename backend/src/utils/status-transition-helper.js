/**
 * Status Transition Helper
 * Provides reusable status transition validation logic
 */

/**
 * Creates a status transition validator
 * @param {Object} transitions - Object mapping current statuses to allowed next statuses
 * @returns {Function} Validation function
 */
function createStatusValidator(transitions) {
  return function canTransitionStatus(currentStatus, newStatus) {
    const allowedTransitions = transitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  };
}

/**
 * Common status transition definitions
 */
const CAMPAIGN_STATUS_TRANSITIONS = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'cancelled'],
  completed: [],
  cancelled: []
};

const COLLABORATION_STATUS_TRANSITIONS = {
  pending: ['accepted', 'rejected'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: []
};

module.exports = {
  createStatusValidator,
  CAMPAIGN_STATUS_TRANSITIONS,
  COLLABORATION_STATUS_TRANSITIONS
};
