// Client Management Routes
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication, requireRole } = require('../middleware/access-control');
const createCrudRouter = require('../utils/crud-router-factory');

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
  }
});

// Apply authentication middleware to all routes
router.use('/', requireAuthentication);

// Apply role-based access control to mutation operations
router.use('/', (req, res, next) => {
  const mutationMethods = ['POST', 'PUT'];
  const deleteMethods = ['DELETE'];
  
  if (mutationMethods.includes(req.method)) {
    return requireRole(['admin', 'client_manager'])(req, res, next);
  }
  
  if (deleteMethods.includes(req.method)) {
    return requireRole(['admin'])(req, res, next);
  }
  
  next();
});

module.exports = router;
