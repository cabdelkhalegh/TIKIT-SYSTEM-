/**
 * Campaign Risk Scoring Service
 * Auto-calculates risk score based on missing/incomplete campaign fields
 * Thresholds: low (<2), medium (2-4), high (5+) per data-model.md
 */

/**
 * Calculate risk score for a campaign
 * @param {Object} campaign - Campaign object from Prisma
 * @returns {{ score: number, level: 'low'|'medium'|'high', breakdown: Array }}
 */
function calculateRisk(campaign) {
  let score = 0;
  const breakdown = [];

  // Missing budget: +3
  if (!campaign.totalBudget && campaign.totalBudget !== 0) {
    score += 3;
    breakdown.push({ field: 'budget', points: 3, reason: 'Missing campaign budget' });
  }

  // Missing start date: +2
  if (!campaign.startDate) {
    score += 2;
    breakdown.push({ field: 'startDate', points: 2, reason: 'Missing start date' });
  }

  // Missing end date: +2
  if (!campaign.endDate) {
    score += 2;
    breakdown.push({ field: 'endDate', points: 2, reason: 'Missing end date' });
  }

  // Missing client: +2
  if (!campaign.clientId) {
    score += 2;
    breakdown.push({ field: 'clientId', points: 2, reason: 'Missing client assignment' });
  }

  // Incomplete fields: up to +3
  let incompletePenalty = 0;
  if (!campaign.campaignName || campaign.campaignName.trim() === '') {
    incompletePenalty += 1;
    breakdown.push({ field: 'name', points: 1, reason: 'Missing campaign name' });
  }
  if (!campaign.campaignDescription) {
    incompletePenalty += 1;
    breakdown.push({ field: 'description', points: 1, reason: 'Missing campaign description' });
  }
  if (!campaign.campaignObjectives) {
    incompletePenalty += 1;
    breakdown.push({ field: 'objectives', points: 1, reason: 'Missing campaign objectives' });
  }
  score += Math.min(incompletePenalty, 3);

  // Determine risk level
  let level;
  if (score < 2) {
    level = 'low';
  } else if (score <= 4) {
    level = 'medium';
  } else {
    level = 'high';
  }

  return { score, level, breakdown };
}

module.exports = { calculateRisk };
