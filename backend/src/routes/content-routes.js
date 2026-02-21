// Content Workflow Routes (Script → Draft → Final)
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const createCrudRouter = require('../utils/crud-router-factory');
const createRoleBasedMethodMiddleware = require('../middleware/role-based-method');

const prisma = new PrismaClient();

// Create base CRUD router
const router = createCrudRouter({
  prisma,
  modelName: 'content',
  idField: 'id',
  includeRelations: {
    list: {
      collaboration: {
        select: {
          id: true,
          campaignId: true,
          influencerId: true,
          collaborationStatus: true
        }
      }
    },
    default: {
      collaboration: true
    }
  },
  listFilters: {
    collaborationId: 'collaborationId'
  },
  orderBy: { createdAt: 'desc' }
});

// Apply authentication middleware to all routes
router.use('/', requireAuthentication);

// Apply role-based access control
router.use('/', createRoleBasedMethodMiddleware({
  mutation: ['admin', 'client_manager'],
  delete: ['admin']
}));

module.exports = router;
