// Invoice Management Routes
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication } = require('../middleware/access-control');
const createCrudRouter = require('../utils/crud-router-factory');
const createRoleBasedMethodMiddleware = require('../middleware/role-based-method');

const prisma = new PrismaClient();

// Create base CRUD router
const router = createCrudRouter({
  prisma,
  modelName: 'invoice',
  idField: 'id',
  includeRelations: {
    list: {
      campaign: {
        select: {
          campaignId: true,
          campaignName: true,
          status: true
        }
      }
    },
    default: {
      campaign: true
    }
  },
  listFilters: {
    campaignId: 'campaignId'
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
