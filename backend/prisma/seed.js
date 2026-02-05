// TIKIT System - Database Seed Script
// PRD Section 4.2 & 4.3: Test data for Client and Campaign Entities

const { PrismaClient } = require('@prisma/client')

const dbClient = new PrismaClient()

async function seedTikitDatabase() {
  console.log('🌱 Seeding TIKIT database with test clients and campaigns...')

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
  
  console.log('\n🎉 Database seeding completed successfully!')
  console.log(`📊 Summary: ${3} clients, ${4} campaigns`)
}

seedTikitDatabase()
  .catch((error) => {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  })
  .finally(async () => {
    await dbClient.$disconnect()
  })
