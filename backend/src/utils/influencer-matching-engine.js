/**
 * Influencer Matching Engine
 * Intelligent algorithm for matching influencers to campaigns
 */

class InfluencerMatchingEngine {
  /**
   * Calculate match score between an influencer and campaign
   * @param {Object} influencer - Influencer data
   * @param {Object} campaign - Campaign data
   * @returns {Object} Match result with score and breakdown
   */
  static calculateMatchScore(influencer, campaign) {
    const scoreBreakdown = {
      platformAlignment: 0,
      audienceSizeFit: 0,
      engagementQuality: 0,
      contentRelevance: 0,
      budgetCompatibility: 0,
      qualityReliability: 0
    };

    // 1. Platform Alignment (25 points)
    scoreBreakdown.platformAlignment = this.scorePlatformAlignment(
      influencer.socialMediaHandles,
      campaign.targetPlatforms
    );

    // 2. Audience Size Fit (20 points)
    scoreBreakdown.audienceSizeFit = this.scoreAudienceSizeFit(
      influencer.audienceMetrics,
      campaign.budgetTotal
    );

    // 3. Engagement Quality (20 points)
    scoreBreakdown.engagementQuality = this.scoreEngagementQuality(
      influencer.audienceMetrics
    );

    // 4. Content Relevance (15 points)
    scoreBreakdown.contentRelevance = this.scoreContentRelevance(
      influencer.contentCategories,
      campaign.objectives
    );

    // 5. Budget Compatibility (10 points)
    scoreBreakdown.budgetCompatibility = this.scoreBudgetCompatibility(
      influencer,
      campaign.budgetTotal,
      campaign.budgetAllocated
    );

    // 6. Quality & Reliability (10 points)
    scoreBreakdown.qualityReliability = this.scoreQualityReliability(
      influencer.isVerified,
      influencer.qualityScore
    );

    const totalScore = Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0);

    return {
      influencerId: influencer.id,
      matchScore: Math.round(totalScore * 10) / 10,
      scoreBreakdown,
      recommendation: this.getRecommendationLevel(totalScore)
    };
  }

  /**
   * Score platform alignment
   */
  static scorePlatformAlignment(influencerPlatforms, campaignPlatforms) {
    if (!influencerPlatforms || !campaignPlatforms || campaignPlatforms.length === 0) {
      return 0;
    }

    const platformKeys = Object.keys(influencerPlatforms);
    const matchingPlatforms = platformKeys.filter(platform => 
      campaignPlatforms.includes(platform)
    );

    if (matchingPlatforms.length === 0) return 0;
    
    const matchRatio = matchingPlatforms.length / campaignPlatforms.length;
    return Math.min(matchRatio * 25, 25);
  }

  /**
   * Score audience size fit based on campaign budget
   */
  static scoreAudienceSizeFit(audienceMetrics, budgetTotal) {
    if (!audienceMetrics || !budgetTotal) return 0;

    // Calculate average followers across platforms
    const platforms = Object.keys(audienceMetrics);
    if (platforms.length === 0) return 0;

    const totalFollowers = platforms.reduce((sum, platform) => {
      return sum + (audienceMetrics[platform]?.followers || 0);
    }, 0);
    const avgFollowers = totalFollowers / platforms.length;

    // Define optimal follower ranges based on budget
    let optimalRange;
    if (budgetTotal < 5000) {
      optimalRange = { min: 10000, max: 100000 }; // Micro influencers
    } else if (budgetTotal < 20000) {
      optimalRange = { min: 50000, max: 250000 }; // Mid-tier
    } else if (budgetTotal < 50000) {
      optimalRange = { min: 100000, max: 500000 }; // Macro
    } else {
      optimalRange = { min: 200000, max: 2000000 }; // Mega
    }

    // Score based on how well followers fit the optimal range
    if (avgFollowers >= optimalRange.min && avgFollowers <= optimalRange.max) {
      return 20; // Perfect fit
    } else if (avgFollowers < optimalRange.min) {
      const ratio = avgFollowers / optimalRange.min;
      return ratio * 15; // Below optimal
    } else {
      const ratio = optimalRange.max / avgFollowers;
      return ratio * 15; // Above optimal
    }
  }

  /**
   * Score engagement quality
   */
  static scoreEngagementQuality(audienceMetrics) {
    if (!audienceMetrics) return 0;

    const platforms = Object.keys(audienceMetrics);
    if (platforms.length === 0) return 0;

    const engagementRates = platforms.map(platform => 
      audienceMetrics[platform]?.engagementRate || 0
    );

    const avgEngagement = engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length;

    // Scoring based on engagement benchmarks
    // Micro: >5%, Mid: >3%, Macro: >2%, Mega: >1%
    if (avgEngagement >= 5) return 20;
    if (avgEngagement >= 3) return 18;
    if (avgEngagement >= 2) return 15;
    if (avgEngagement >= 1) return 12;
    return avgEngagement * 10; // Linear for very low engagement
  }

  /**
   * Score content relevance
   */
  static scoreContentRelevance(influencerCategories, campaignObjectives) {
    if (!influencerCategories || !campaignObjectives || influencerCategories.length === 0) {
      return 0;
    }

    // Extract keywords from campaign objectives
    const objectiveText = JSON.stringify(campaignObjectives).toLowerCase();
    
    // Count how many influencer categories appear in objectives
    const relevantCategories = influencerCategories.filter(category => 
      objectiveText.includes(category.toLowerCase())
    );

    const relevanceRatio = relevantCategories.length / influencerCategories.length;
    return relevanceRatio * 15;
  }

  /**
   * Score budget compatibility
   */
  static scoreBudgetCompatibility(influencer, budgetTotal, budgetAllocated) {
    const availableBudget = budgetTotal - (budgetAllocated || 0);
    if (availableBudget <= 0) return 0;

    // Estimate influencer cost (rate per post * expected posts)
    const estimatedCost = (influencer.ratePerPost || 0) * 3; // Assume 3 posts

    if (estimatedCost === 0) return 5; // Neutral if no rate info

    if (estimatedCost <= availableBudget * 0.3) {
      return 10; // Well within budget
    } else if (estimatedCost <= availableBudget * 0.5) {
      return 8;
    } else if (estimatedCost <= availableBudget) {
      return 5;
    }
    return 0; // Over budget
  }

  /**
   * Score quality and reliability
   */
  static scoreQualityReliability(isVerified, qualityScore) {
    let score = 0;
    
    // Verified status (3 points)
    if (isVerified) {
      score += 3;
    }

    // Quality score (7 points)
    if (qualityScore) {
      score += (qualityScore / 100) * 7;
    }

    return score;
  }

  /**
   * Get recommendation level based on score
   */
  static getRecommendationLevel(score) {
    if (score >= 80) return 'highly_recommended';
    if (score >= 60) return 'recommended';
    if (score >= 40) return 'consider';
    return 'not_recommended';
  }

  /**
   * Find best matching influencers for a campaign
   */
  static findBestMatches(influencers, campaign, limit = 10) {
    const scoredInfluencers = influencers.map(influencer => ({
      ...influencer,
      ...this.calculateMatchScore(influencer, campaign)
    }));

    // Sort by match score descending
    scoredInfluencers.sort((a, b) => b.matchScore - a.matchScore);

    return scoredInfluencers.slice(0, limit);
  }

  /**
   * Calculate similarity between two influencers
   */
  static calculateSimilarity(influencer1, influencer2) {
    let similarityScore = 0;

    // Platform overlap (30%)
    const platforms1 = Object.keys(influencer1.socialMediaHandles || {});
    const platforms2 = Object.keys(influencer2.socialMediaHandles || {});
    const commonPlatforms = platforms1.filter(p => platforms2.includes(p));
    similarityScore += (commonPlatforms.length / Math.max(platforms1.length, platforms2.length)) * 30;

    // Category overlap (30%)
    const categories1 = influencer1.contentCategories || [];
    const categories2 = influencer2.contentCategories || [];
    const commonCategories = categories1.filter(c => categories2.includes(c));
    similarityScore += (commonCategories.length / Math.max(categories1.length, categories2.length)) * 30;

    // Follower count similarity (20%)
    const followers1 = this.getAverageFollowers(influencer1.audienceMetrics);
    const followers2 = this.getAverageFollowers(influencer2.audienceMetrics);
    if (followers1 > 0 && followers2 > 0) {
      const ratio = Math.min(followers1, followers2) / Math.max(followers1, followers2);
      similarityScore += ratio * 20;
    }

    // Engagement rate similarity (20%)
    const engagement1 = this.getAverageEngagement(influencer1.audienceMetrics);
    const engagement2 = this.getAverageEngagement(influencer2.audienceMetrics);
    if (engagement1 > 0 && engagement2 > 0) {
      const ratio = Math.min(engagement1, engagement2) / Math.max(engagement1, engagement2);
      similarityScore += ratio * 20;
    }

    return Math.round(similarityScore * 10) / 10;
  }

  /**
   * Get average followers across platforms
   */
  static getAverageFollowers(audienceMetrics) {
    if (!audienceMetrics) return 0;
    const platforms = Object.keys(audienceMetrics);
    if (platforms.length === 0) return 0;
    
    const total = platforms.reduce((sum, platform) => {
      return sum + (audienceMetrics[platform]?.followers || 0);
    }, 0);
    
    return total / platforms.length;
  }

  /**
   * Get average engagement across platforms
   */
  static getAverageEngagement(audienceMetrics) {
    if (!audienceMetrics) return 0;
    const platforms = Object.keys(audienceMetrics);
    if (platforms.length === 0) return 0;
    
    const total = platforms.reduce((sum, platform) => {
      return sum + (audienceMetrics[platform]?.engagementRate || 0);
    }, 0);
    
    return total / platforms.length;
  }
}

module.exports = InfluencerMatchingEngine;
