// TIKIT System - Database Seed Script
// PRD Section 4.2: Test data for Client Entity

const { PrismaClient } = require('@prisma/client')

const dbClient = new PrismaClient()

async function seedTikitDatabase() {
  console.log('🌱 Seeding TIKIT database with test clients...')

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
  console.log('🎉 Database seeding completed successfully!')
}

seedTikitDatabase()
  .catch((error) => {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  })
  .finally(async () => {
    await dbClient.$disconnect()
  })
