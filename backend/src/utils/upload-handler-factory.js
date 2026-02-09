/**
 * Upload Handler Factory
 * Creates reusable upload handlers to eliminate duplication
 */

const { ValidationError } = require('./error-types');

/**
 * Creates a generic file upload handler
 * 
 * @param {Object} config - Configuration object
 * @param {Object} config.fileUploadService - File upload service instance
 * @param {string} config.purpose - Purpose of the upload (e.g., 'profile', 'campaign')
 * @param {string} config.entityType - Type of entity (e.g., 'user', 'campaign')
 * @param {Function} config.getEntityId - Function to extract entity ID from request
 * @param {boolean} config.isPublic - Whether the uploaded file is public
 * @param {string} config.successMessage - Success message to return
 * @param {boolean} config.validateDimensions - Whether to validate image dimensions
 * @returns {Function} Express middleware handler
 */
function createUploadHandler(config) {
  const {
    fileUploadService,
    purpose,
    entityType,
    getEntityId,
    isPublic = false,
    successMessage,
    validateDimensions = false
  } = config;

  return async (req, res, next) => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      // Validate image dimensions if required
      if (validateDimensions) {
        await fileUploadService.validateImageDimensions(req.file.path);
      }

      const entityId = getEntityId(req);

      const media = await fileUploadService.processUpload(req.file, req.user.id, {
        purpose,
        entityType,
        entityId,
        isPublic
      });

      res.status(201).json({
        success: true,
        message: successMessage,
        data: media
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  createUploadHandler
};
