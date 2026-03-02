// Client Management Routes
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const createCrudRouter = require('../utils/crud-router-factory');
const createRoleBasedMethodMiddleware = require('../middleware/role-based-method');
const { generateClientId } = require('../services/id-generator-service');

const prisma = new PrismaClient();

// Create base CRUD router
const router = createCrudRouter({
  prisma,
  modelName: 'client',
  idField: 'clientId',
  includeRelations: {
    list: {
      campaigns: {
        select: {
          campaignId: true,
          campaignName: true,
          status: true
        }
      }
    },
    default: {
      campaigns: true
    }
  },
  // T129: Auto-generate CLI-XXXX display ID on client creation
  beforeCreate: async (data) => {
    if (!data.displayId) {
      data.displayId = await generateClientId();
    }
    return data;
  },
});

// Apply authentication middleware to all routes
router.use('/', requireAuthentication);

// Apply role-based access control
router.use('/', createRoleBasedMethodMiddleware({
  mutation: ['admin', 'client_manager'],
  delete: ['admin']
}));

module.exports = router;
