/**
 * CRUD Router Factory
 * Creates standardized CRUD route handlers for different entities
 */

const express = require('express');
const asyncHandler = require('../middleware/async-handler');

/**
 * Creates CRUD router for a Prisma entity
 * @param {Object} options - Configuration options
 * @param {Object} options.prisma - Prisma client instance
 * @param {string} options.modelName - Name of the Prisma model (e.g., 'campaign', 'client')
 * @param {string} options.idField - Name of the ID field (e.g., 'campaignId', 'clientId')
 * @param {Object} options.includeRelations - Relations to include in queries
 * @param {Object} options.listFilters - Custom filters for list endpoint
 * @param {string} options.orderBy - Default ordering for list endpoint
 * @returns {Object} Router with CRUD operations
 */
function createCrudRouter(options) {
  const {
    prisma,
    modelName,
    idField,
    includeRelations = {},
    listFilters = {},
    orderBy = { createdAt: 'desc' }
  } = options;

  const router = express.Router();
  const model = prisma[modelName];

  if (!model) {
    throw new Error(`Prisma model '${modelName}' not found`);
  }

  /**
   * List all entities
   */
  router.get('/', asyncHandler(async (req, res) => {
    const whereClause = buildWhereClause(req.query, listFilters);
    
    const entities = await model.findMany({
      where: whereClause,
      include: includeRelations.list || includeRelations.default || {},
      orderBy
    });
    
    res.json({
      success: true,
      data: entities,
      count: entities.length
    });
  }));

  /**
   * Get single entity by ID
   */
  router.get('/:id', asyncHandler(async (req, res) => {
    const entity = await model.findUnique({
      where: { [idField]: req.params.id },
      include: includeRelations.detail || includeRelations.default || {}
    });
    
    if (!entity) {
      return res.status(404).json({
        success: false,
        error: `${capitalize(modelName)} not found`
      });
    }
    
    res.json({
      success: true,
      data: entity
    });
  }));

  /**
   * Create new entity
   */
  router.post('/', asyncHandler(async (req, res) => {
    const newEntity = await model.create({
      data: req.body,
      include: includeRelations.create || includeRelations.default || {}
    });
    
    res.status(201).json({
      success: true,
      data: newEntity
    });
  }));

  /**
   * Update entity
   */
  router.put('/:id', asyncHandler(async (req, res) => {
    const updatedEntity = await model.update({
      where: { [idField]: req.params.id },
      data: req.body,
      include: includeRelations.update || includeRelations.default || {}
    });
    
    res.json({
      success: true,
      data: updatedEntity
    });
  }));

  /**
   * Delete entity
   */
  router.delete('/:id', asyncHandler(async (req, res) => {
    await model.delete({
      where: { [idField]: req.params.id }
    });
    
    res.json({
      success: true,
      message: `${capitalize(modelName)} deleted successfully`
    });
  }));

  return router;
}

/**
 * Build where clause from query parameters
 * @param {Object} query - Request query parameters
 * @param {Object} filters - Filter configuration
 * @returns {Object} Prisma where clause
 */
function buildWhereClause(query, filters) {
  const whereClause = {};
  
  for (const [key, config] of Object.entries(filters)) {
    const value = query[key];
    if (value === undefined) continue;
    
    if (typeof config === 'function') {
      // Custom filter function
      Object.assign(whereClause, config(value));
    } else if (config === 'boolean') {
      whereClause[key] = value === 'true';
    } else {
      // Direct mapping
      whereClause[config || key] = value;
    }
  }
  
  return whereClause;
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = createCrudRouter;
