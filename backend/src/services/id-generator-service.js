/**
 * Human-Readable ID Generator Service
 * Formats: TKT-YYYY-XXXX (campaigns), CLI-XXXX (clients), INF-XXXX (influencers), INV-YYYY-XXXX (invoices)
 * Uses Prisma to query count for sequential numbering (per R-007)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate a campaign display ID: TKT-YYYY-XXXX
 */
async function generateCampaignId() {
  const year = new Date().getFullYear();
  const count = await prisma.campaign.count({
    where: {
      displayId: { startsWith: `TKT-${year}-` }
    }
  });
  const seq = String(count + 1).padStart(4, '0');
  return `TKT-${year}-${seq}`;
}

/**
 * Generate a client display ID: CLI-XXXX
 */
async function generateClientId() {
  const count = await prisma.client.count({
    where: {
      displayId: { not: null }
    }
  });
  const seq = String(count + 1).padStart(4, '0');
  return `CLI-${seq}`;
}

/**
 * Generate an influencer display ID: INF-XXXX
 */
async function generateInfluencerId() {
  const count = await prisma.influencer.count({
    where: {
      displayId: { not: null }
    }
  });
  const seq = String(count + 1).padStart(4, '0');
  return `INF-${seq}`;
}

/**
 * Generate an invoice display ID: INV-YYYY-XXXX
 */
async function generateInvoiceId() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      displayId: { startsWith: `INV-${year}-` }
    }
  });
  const seq = String(count + 1).padStart(4, '0');
  return `INV-${year}-${seq}`;
}

module.exports = {
  generateCampaignId,
  generateClientId,
  generateInfluencerId,
  generateInvoiceId,
};
