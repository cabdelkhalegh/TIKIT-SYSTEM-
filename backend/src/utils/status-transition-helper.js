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
  invited: ['accepted', 'declined'],
  accepted: ['active', 'cancelled'],
  declined: [],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

/**
 * Generic status transition handler factory
 * Creates a reusable handler for status transitions to eliminate duplication
 * 
 * @param {Object} config - Configuration object
 * @param {Object} config.prisma - Prisma client instance
 * @param {string} config.modelName - Name of the Prisma model (e.g., 'campaign', 'campaignInfluencer')
 * @param {string} config.idField - Primary key field name (e.g., 'campaignId', 'collaborationId')
 * @param {Function} config.validator - Status validation function
 * @param {Object} config.includeRelations - Relations to include in the query
 * @returns {Function} Handler function for status transitions that accepts (req, res, newStatus, successMessage, additionalData)
 *   - additionalData can be an object or a function(record) => object to compute data based on the current record
 */
function createStatusTransitionHandler(config) {
  const { prisma, modelName, idField, validator, includeRelations = {} } = config;

  return async (req, res, newStatus, successMessage, additionalData = {}) => {
    const id = req.params.id;

    // Find the record
    const record = await prisma[modelName].findUnique({
      where: { [idField]: id }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: `${modelName.charAt(0).toUpperCase() + modelName.slice(1)} not found`
      });
    }

    // Validate status transition
    if (!validator(record.status, newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition to ${newStatus} from current status ${record.status}`,
        currentStatus: record.status
      });
    }

    // Compute additional data (support both functions and objects)
    const extraData = typeof additionalData === 'function' 
      ? additionalData(record) 
      : additionalData;

    // Update the record
    const updatedRecord = await prisma[modelName].update({
      where: { [idField]: id },
      data: {
        status: newStatus,
        ...extraData
      },
      include: includeRelations
    });

    return res.json({
      success: true,
      data: updatedRecord,
      message: successMessage
    });
  };
}

module.exports = {
  createStatusValidator,
  createStatusTransitionHandler,
  CAMPAIGN_STATUS_TRANSITIONS,
  COLLABORATION_STATUS_TRANSITIONS
};
