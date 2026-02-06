// TIKIT System - Database Seed Script
// PRD Section 4.2, 4.3 & 4.4: Test data for Client, Campaign, and Influencer Entities

const { PrismaClient } = require('@prisma/client')

const dbClient = new PrismaClient()

async function seedTikitDatabase() {
  console.log('🌱 Seeding TIKIT database with test clients, campaigns, and influencers...')

  // Sample client data for testing
  const testClient1 = await dbClient.client.create({
    data: {
      legalCompanyName: 'FreshBrew Coffee Corporation',
      brandDisplayName: 'FreshBrew',
      industryVertical: 'Food & Beverage',
      primaryContactEmails: JSON.stringify(['sarah.johnson@freshbrew.com', 'marketing@freshbrew.com']),
      billingContactEmails: JSON.stringify(['accounts@freshbrew.com']),
      preferredCommChannels: JSON.stringify(['email', 'slack', 'phone']),
      totalAdSpend: 0,
      performanceMetricsJson: JSON.stringify({ impressions: 0, conversions: 0 })
    }
  })

  const testClient2 = await dbClient.client.create({
    data: {
      legalCompanyName: 'TechStyle Apparel Ltd',
      brandDisplayName: 'TechStyle',
      industryVertical: 'Fashion & Retail',
      primaryContactEmails: JSON.stringify(['director@techstyle.io']),
      billingContactEmails: JSON.stringify(['finance@techstyle.io', 'billing@techstyle.io']),
      preferredCommChannels: JSON.stringify(['email', 'teams']),
      totalAdSpend: 15000.50,
      performanceMetricsJson: JSON.stringify({ reach: 250000, engagement: 12500 })
    }
  })

  const testClient3 = await dbClient.client.create({
    data: {
      legalCompanyName: 'WellnessHub International Inc',
      brandDisplayName: 'WellnessHub',
      industryVertical: 'Health & Wellness',
      primaryContactEmails: JSON.stringify(['partnerships@wellnesshub.com']),
      billingContactEmails: JSON.stringify(['ap@wellnesshub.com']),
      preferredCommChannels: JSON.stringify(['email']),
      totalAdSpend: 8750.00,
      performanceMetricsJson: null
    }
  })

  console.log('✅ Created test client:', testClient1.brandDisplayName)
  console.log('✅ Created test client:', testClient2.brandDisplayName)
  console.log('✅ Created test client:', testClient3.brandDisplayName)

  // Sample campaign data for testing
  console.log('\n🎯 Seeding campaigns...')

  const campaign1 = await dbClient.campaign.create({
    data: {
      campaignName: 'Spring Coffee Launch 2026',
      campaignDescription: 'Launch campaign for new seasonal coffee blends targeting young professionals',
      campaignObjectives: JSON.stringify([
        'Increase brand awareness by 30%',
        'Drive 10,000 website visits',
        'Generate 1,000 product trials'
      ]),
      clientId: testClient1.clientId,
      status: 'active',
      totalBudget: 25000,
      allocatedBudget: 15000,
      spentBudget: 8500,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-05-31'),
      launchDate: new Date('2026-03-15'),
      targetAudienceJson: JSON.stringify({
        ageRange: '25-40',
        interests: ['coffee', 'lifestyle', 'productivity'],
        locations: ['New York', 'Los Angeles', 'Chicago']
      }),
      targetPlatformsJson: JSON.stringify(['instagram', 'tiktok', 'youtube']),
      performanceKPIsJson: JSON.stringify({
        targetImpressions: 500000,
        targetEngagement: 50000,
        targetConversions: 1000
      }),
      actualPerformanceJson: JSON.stringify({
        impressions: 320000,
        engagement: 28000,
        conversions: 640
      })
    }
  })

  const campaign2 = await dbClient.campaign.create({
    data: {
      campaignName: 'Summer Fashion Collection',
      campaignDescription: 'Influencer-driven campaign for summer apparel line',
      campaignObjectives: JSON.stringify([
        'Launch new summer collection',
        'Partner with 15 fashion influencers',
        'Achieve $500K in sales'
      ]),
      clientId: testClient2.clientId,
      status: 'active',
      totalBudget: 75000,
      allocatedBudget: 60000,
      spentBudget: 45000,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-08-31'),
      launchDate: new Date('2026-05-15'),
      targetAudienceJson: JSON.stringify({
        ageRange: '18-35',
        interests: ['fashion', 'style', 'trends'],
        locations: ['USA', 'Canada', 'UK']
      }),
      targetPlatformsJson: JSON.stringify(['instagram', 'tiktok', 'pinterest']),
      performanceKPIsJson: JSON.stringify({
        targetImpressions: 2000000,
        targetEngagement: 150000,
        targetSales: 500000
      }),
      actualPerformanceJson: JSON.stringify({
        impressions: 1850000,
        engagement: 142000,
        sales: 480000
      })
    }
  })

  const campaign3 = await dbClient.campaign.create({
    data: {
      campaignName: 'Wellness Awareness Month',
      campaignDescription: 'Educational campaign promoting mental and physical wellness',
      campaignObjectives: JSON.stringify([
        'Build thought leadership',
        'Grow social following by 25%',
        'Drive app downloads'
      ]),
      clientId: testClient3.clientId,
      status: 'draft',
      totalBudget: 35000,
      allocatedBudget: 0,
      spentBudget: 0,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-30'),
      targetAudienceJson: JSON.stringify({
        ageRange: '25-55',
        interests: ['wellness', 'fitness', 'mental health'],
        locations: ['Global']
      }),
      targetPlatformsJson: JSON.stringify(['youtube', 'instagram', 'linkedin']),
      performanceKPIsJson: JSON.stringify({
        targetImpressions: 1000000,
        targetFollowers: 50000,
        targetAppDownloads: 10000
      }),
      actualPerformanceJson: null
    }
  })

  const campaign4 = await dbClient.campaign.create({
    data: {
      campaignName: 'Holiday Gifting Campaign',
      campaignDescription: 'End-of-year gift guide featuring coffee subscription boxes',
      campaignObjectives: JSON.stringify([
        'Drive holiday sales',
        'Acquire new subscribers',
        'Partner with lifestyle influencers'
      ]),
      clientId: testClient1.clientId,
      status: 'completed',
      totalBudget: 40000,
      allocatedBudget: 40000,
      spentBudget: 38500,
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-12-31'),
      launchDate: new Date('2025-11-15'),
      targetAudienceJson: JSON.stringify({
        ageRange: '25-50',
        interests: ['gifts', 'coffee', 'subscriptions'],
        locations: ['USA']
      }),
      targetPlatformsJson: JSON.stringify(['instagram', 'youtube', 'facebook']),
      performanceKPIsJson: JSON.stringify({
        targetImpressions: 800000,
        targetSales: 200000,
        targetSubscribers: 2000
      }),
      actualPerformanceJson: JSON.stringify({
        impressions: 920000,
        sales: 245000,
        subscribers: 2400
      })
    }
  })

  console.log('✅ Created campaign:', campaign1.campaignName, `(${campaign1.status})`)
  console.log('✅ Created campaign:', campaign2.campaignName, `(${campaign2.status})`)
  console.log('✅ Created campaign:', campaign3.campaignName, `(${campaign3.status})`)
  console.log('✅ Created campaign:', campaign4.campaignName, `(${campaign4.status})`)

  // Sample influencer data for testing
  console.log('\n👥 Seeding influencers...')

  const influencer1 = await dbClient.influencer.create({
    data: {
      fullName: 'Sarah Chen',
      displayName: '@sarahlifestyle',
      email: 'sarah.chen@influencer.com',
      phone: '+1-555-0101',
      bio: 'Lifestyle & wellness content creator sharing daily inspiration. Coffee enthusiast ☕',
      city: 'Los Angeles',
      country: 'USA',
      socialMediaHandles: JSON.stringify({
        instagram: '@sarahlifestyle',
        tiktok: '@sarahchen',
        youtube: 'SarahLifestyle'
      }),
      primaryPlatform: 'instagram',
      audienceMetrics: JSON.stringify({
        instagram: { followers: 185000, engagement_rate: 4.2, avg_likes: 7800 },
        tiktok: { followers: 95000, engagement_rate: 6.1, avg_views: 45000 },
        youtube: { subscribers: 42000, avg_views: 15000 }
      }),
      contentCategories: JSON.stringify(['lifestyle', 'wellness', 'coffee', 'daily routines']),
      performanceHistory: JSON.stringify({
        total_campaigns: 12,
        avg_engagement_rate: 4.5,
        avg_reach: 150000
      }),
      availabilityStatus: 'available',
      ratePerPost: 2500,
      ratePerVideo: 5000,
      ratePerStory: 500,
      isVerified: true,
      qualityScore: 92
    }
  })

  const influencer2 = await dbClient.influencer.create({
    data: {
      fullName: 'Marcus Thompson',
      displayName: '@marcusstyle',
      email: 'marcus.t@creators.io',
      phone: '+1-555-0202',
      bio: 'Fashion & style expert. Helping you level up your wardrobe 👔',
      city: 'New York',
      country: 'USA',
      socialMediaHandles: JSON.stringify({
        instagram: '@marcusstyle',
        tiktok: '@marcusthompson',
        pinterest: 'MarcusStyleGuide'
      }),
      primaryPlatform: 'instagram',
      audienceMetrics: JSON.stringify({
        instagram: { followers: 320000, engagement_rate: 5.8, avg_likes: 18500 },
        tiktok: { followers: 280000, engagement_rate: 7.2, avg_views: 125000 },
        pinterest: { followers: 65000, monthly_views: 450000 }
      }),
      contentCategories: JSON.stringify(['fashion', 'menswear', 'style tips', 'trends']),
      performanceHistory: JSON.stringify({
        total_campaigns: 28,
        avg_engagement_rate: 6.2,
        avg_reach: 280000
      }),
      availabilityStatus: 'busy',
      ratePerPost: 4500,
      ratePerVideo: 8000,
      ratePerStory: 800,
      isVerified: true,
      qualityScore: 95
    }
  })

  const influencer3 = await dbClient.influencer.create({
    data: {
      fullName: 'Emily Rodriguez',
      displayName: '@emilywellness',
      email: 'emily.r@wellness.com',
      phone: '+1-555-0303',
      bio: 'Certified yoga instructor & mental wellness advocate 🧘‍♀️ Spreading positivity',
      city: 'Austin',
      country: 'USA',
      socialMediaHandles: JSON.stringify({
        instagram: '@emilywellness',
        youtube: 'EmilyWellnessJourney',
        linkedin: 'emily-rodriguez-wellness'
      }),
      primaryPlatform: 'youtube',
      audienceMetrics: JSON.stringify({
        instagram: { followers: 145000, engagement_rate: 5.1, avg_likes: 7400 },
        youtube: { subscribers: 220000, avg_views: 85000, avg_watch_time: '8:30' },
        linkedin: { connections: 12000, avg_engagement: 850 }
      }),
      contentCategories: JSON.stringify(['wellness', 'yoga', 'mental health', 'mindfulness']),
      performanceHistory: JSON.stringify({
        total_campaigns: 15,
        avg_engagement_rate: 5.3,
        avg_reach: 180000
      }),
      availabilityStatus: 'available',
      ratePerPost: 2800,
      ratePerVideo: 6500,
      ratePerStory: 600,
      isVerified: true,
      qualityScore: 89
    }
  })

  const influencer4 = await dbClient.influencer.create({
    data: {
      fullName: 'Alex Kim',
      displayName: '@alexkimcreates',
      email: 'alex.kim@content.co',
      phone: '+1-555-0404',
      bio: 'Creative photographer & storyteller 📸 Capturing moments that matter',
      city: 'San Francisco',
      country: 'USA',
      socialMediaHandles: JSON.stringify({
        instagram: '@alexkimcreates',
        tiktok: '@alexkim',
        youtube: 'AlexKimCreates'
      }),
      primaryPlatform: 'instagram',
      audienceMetrics: JSON.stringify({
        instagram: { followers: 98000, engagement_rate: 6.5, avg_likes: 6400 },
        tiktok: { followers: 125000, engagement_rate: 8.1, avg_views: 78000 },
        youtube: { subscribers: 55000, avg_views: 22000 }
      }),
      contentCategories: JSON.stringify(['photography', 'creative', 'lifestyle', 'travel']),
      performanceHistory: JSON.stringify({
        total_campaigns: 8,
        avg_engagement_rate: 7.1,
        avg_reach: 95000
      }),
      availabilityStatus: 'available',
      ratePerPost: 1800,
      ratePerVideo: 3500,
      ratePerStory: 400,
      isVerified: false,
      qualityScore: 85
    }
  })

  const influencer5 = await dbClient.influencer.create({
    data: {
      fullName: 'Jessica Martinez',
      displayName: '@jessicafoodie',
      email: 'jessica.m@foodcreators.net',
      phone: '+1-555-0505',
      bio: 'Food blogger & recipe developer 🍳 Making cooking fun and accessible',
      city: 'Chicago',
      country: 'USA',
      socialMediaHandles: JSON.stringify({
        instagram: '@jessicafoodie',
        tiktok: '@jessicacooks',
        facebook: 'JessicaFoodieOfficial'
      }),
      primaryPlatform: 'tiktok',
      audienceMetrics: JSON.stringify({
        instagram: { followers: 165000, engagement_rate: 4.8, avg_likes: 7900 },
        tiktok: { followers: 420000, engagement_rate: 9.2, avg_views: 285000 },
        facebook: { followers: 78000, avg_engagement: 3200 }
      }),
      contentCategories: JSON.stringify(['food', 'cooking', 'recipes', 'lifestyle']),
      performanceHistory: JSON.stringify({
        total_campaigns: 22,
        avg_engagement_rate: 7.8,
        avg_reach: 320000
      }),
      availabilityStatus: 'available',
      ratePerPost: 3200,
      ratePerVideo: 6000,
      ratePerStory: 700,
      isVerified: true,
      qualityScore: 91
    }
  })

  console.log('✅ Created influencer:', influencer1.displayName, `(${influencer1.primaryPlatform})`)
  console.log('✅ Created influencer:', influencer2.displayName, `(${influencer2.primaryPlatform})`)
  console.log('✅ Created influencer:', influencer3.displayName, `(${influencer3.primaryPlatform})`)
  console.log('✅ Created influencer:', influencer4.displayName, `(${influencer4.primaryPlatform})`)
  console.log('✅ Created influencer:', influencer5.displayName, `(${influencer5.primaryPlatform})`)

  // Create campaign-influencer relationships
  console.log('\n🤝 Creating campaign-influencer collaborations...')

  // Campaign 1: Spring Coffee Launch - Sarah (lifestyle) and Jessica (food)
  const collab1 = await dbClient.campaignInfluencer.create({
    data: {
      campaignId: campaign1.campaignId,
      influencerId: influencer1.influencerId,
      role: 'Brand Ambassador',
      collaborationStatus: 'active',
      agreedDeliverables: JSON.stringify(['2 Instagram posts', '5 Instagram stories', '1 Reel']),
      deliveredContent: JSON.stringify(['1 Instagram post', '3 Instagram stories']),
      agreedPayment: 8000,
      paymentStatus: 'partial',
      performanceMetrics: JSON.stringify({
        total_reach: 195000,
        total_engagement: 8200,
        engagement_rate: 4.2
      }),
      acceptedAt: new Date('2026-02-20')
    }
  })

  const collab2 = await dbClient.campaignInfluencer.create({
    data: {
      campaignId: campaign1.campaignId,
      influencerId: influencer5.influencerId,
      role: 'Content Creator',
      collaborationStatus: 'active',
      agreedDeliverables: JSON.stringify(['3 TikTok videos', '2 Instagram posts']),
      deliveredContent: JSON.stringify(['2 TikTok videos', '1 Instagram post']),
      agreedPayment: 12000,
      paymentStatus: 'partial',
      performanceMetrics: JSON.stringify({
        total_reach: 380000,
        total_engagement: 29500,
        engagement_rate: 7.8
      }),
      acceptedAt: new Date('2026-02-25')
    }
  })

  // Campaign 2: Summer Fashion - Marcus (fashion expert)
  const collab3 = await dbClient.campaignInfluencer.create({
    data: {
      campaignId: campaign2.campaignId,
      influencerId: influencer2.influencerId,
      role: 'Lead Ambassador',
      collaborationStatus: 'active',
      agreedDeliverables: JSON.stringify(['4 Instagram posts', '8 Stories', '2 TikTok videos', '1 YouTube video']),
      deliveredContent: JSON.stringify(['3 Instagram posts', '8 Stories', '2 TikTok videos']),
      agreedPayment: 25000,
      paymentStatus: 'partial',
      performanceMetrics: JSON.stringify({
        total_reach: 520000,
        total_engagement: 31200,
        engagement_rate: 6.0
      }),
      acceptedAt: new Date('2026-04-15')
    }
  })

  // Campaign 3: Wellness Awareness (draft) - Emily invited
  const collab4 = await dbClient.campaignInfluencer.create({
    data: {
      campaignId: campaign3.campaignId,
      influencerId: influencer3.influencerId,
      role: 'Wellness Expert',
      collaborationStatus: 'invited',
      agreedDeliverables: JSON.stringify(['3 YouTube videos', '2 Instagram posts', '1 LinkedIn article']),
      agreedPayment: 18000,
      paymentStatus: 'pending'
    }
  })

  // Campaign 4: Holiday Gifting (completed) - Sarah and Alex
  const collab5 = await dbClient.campaignInfluencer.create({
    data: {
      campaignId: campaign4.campaignId,
      influencerId: influencer1.influencerId,
      role: 'Content Creator',
      collaborationStatus: 'completed',
      agreedDeliverables: JSON.stringify(['3 Instagram posts', '10 Stories', '2 Reels']),
      deliveredContent: JSON.stringify(['3 Instagram posts', '10 Stories', '2 Reels']),
      agreedPayment: 9500,
      paymentStatus: 'paid',
      performanceMetrics: JSON.stringify({
        total_reach: 210000,
        total_engagement: 9800,
        engagement_rate: 4.7
      }),
      acceptedAt: new Date('2025-10-15'),
      completedAt: new Date('2025-12-28')
    }
  })

  const collab6 = await dbClient.campaignInfluencer.create({
    data: {
      campaignId: campaign4.campaignId,
      influencerId: influencer4.influencerId,
      role: 'Photographer',
      collaborationStatus: 'completed',
      agreedDeliverables: JSON.stringify(['5 Instagram posts', '15 Stories', '3 Reels']),
      deliveredContent: JSON.stringify(['5 Instagram posts', '15 Stories', '3 Reels']),
      agreedPayment: 7500,
      paymentStatus: 'paid',
      performanceMetrics: JSON.stringify({
        total_reach: 125000,
        total_engagement: 8900,
        engagement_rate: 7.1
      }),
      acceptedAt: new Date('2025-10-20'),
      completedAt: new Date('2025-12-30')
    }
  })

  console.log('✅ Created collaboration:', `${influencer1.displayName} → ${campaign1.campaignName}`)
  console.log('✅ Created collaboration:', `${influencer5.displayName} → ${campaign1.campaignName}`)
  console.log('✅ Created collaboration:', `${influencer2.displayName} → ${campaign2.campaignName}`)
  console.log('✅ Created collaboration:', `${influencer3.displayName} → ${campaign3.campaignName}`)
  console.log('✅ Created collaboration:', `${influencer1.displayName} → ${campaign4.campaignName}`)
  console.log('✅ Created collaboration:', `${influencer4.displayName} → ${campaign4.campaignName}`)
  
  console.log('\n🎉 Database seeding completed successfully!')
  console.log(`📊 Summary: ${3} clients, ${4} campaigns, ${5} influencers, ${6} collaborations`)
}

seedTikitDatabase()
  .catch((error) => {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  })
  .finally(async () => {
    await dbClient.$disconnect()
  })
