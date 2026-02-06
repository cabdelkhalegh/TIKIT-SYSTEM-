// Client Management Routes
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuthentication, requireRole } = require('../middleware/access-control');

const prisma = new PrismaClient();

// List all clients (authenticated users only)
router.get('/', requireAuthentication, async (req, res) => {
  try {
    const clientList = await prisma.client.findMany({
      include: {
        campaigns: {
          select: {
            campaignId: true,
            campaignName: true,
            status: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: clientList,
      count: clientList.length
    });
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients'
    });
  }
});

// Get single client by ID (authenticated users only)
router.get('/:id', requireAuthentication, async (req, res) => {
  try {
    const clientRecord = await prisma.client.findUnique({
      where: { clientId: req.params.id },
      include: {
        campaigns: true
      }
    });
    
    if (!clientRecord) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      data: clientRecord
    });
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client'
    });
  }
});

// Create new client (admin or client_manager only)
router.post('/', requireAuthentication, requireRole(['admin', 'client_manager']), async (req, res) => {
  try {
    const newClient = await prisma.client.create({
      data: req.body,
      include: {
        campaigns: true
      }
    });
    
    res.status(201).json({
      success: true,
      data: newClient
    });
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create client'
    });
  }
});

// Update client (admin or client_manager only)
router.put('/:id', requireAuthentication, requireRole(['admin', 'client_manager']), async (req, res) => {
  try {
    const updatedClient = await prisma.client.update({
      where: { clientId: req.params.id },
      data: req.body,
      include: {
        campaigns: true
      }
    });
    
    res.json({
      success: true,
      data: updatedClient
    });
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update client'
    });
  }
});

// Delete client (admin only)
router.delete('/:id', requireAuthentication, requireRole(['admin']), async (req, res) => {
  try {
    await prisma.client.delete({
      where: { clientId: req.params.id }
    });
    
    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete client'
    });
  }
});

module.exports = router;
