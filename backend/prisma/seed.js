// TIKIT System V2 - Database Seed Script
// Seeds all 6 roles, maps old statuses, generates displayIds, creates representative test data

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const dbClient = new PrismaClient();

async function seedTikitDatabase() {
  console.log('🌱 TiKiT V2 — Seeding database...\n');

  // ─── 1. Create test users with V2 roles ────────────────────────────────────
  console.log('👤 Creating test users...');

  const directorUser = await dbClient.user.upsert({
    where: { email: 'director@tikit.ae' },
    update: {},
    create: {
      email: 'director@tikit.ae',
      passwordHash: '$2b$10$dummyhashfordirectoruser000000000000000000000000',
      fullName: 'Fatima Al-Rashid',
      displayName: 'Fatima',
      role: 'director',
      isActive: true,
      isEmailVerified: true,
    }
  });

  const cmUser = await dbClient.user.upsert({
    where: { email: 'cm@tikit.ae' },
    update: {},
    create: {
      email: 'cm@tikit.ae',
      passwordHash: '$2b$10$dummyhashforcampaignmanager000000000000000000000',
      fullName: 'Omar Hassan',
      displayName: 'Omar',
      role: 'campaign_manager',
      isActive: true,
      isEmailVerified: true,
    }
  });

  const reviewerUser = await dbClient.user.upsert({
    where: { email: 'reviewer@tikit.ae' },
    update: {},
    create: {
      email: 'reviewer@tikit.ae',
      passwordHash: '$2b$10$dummyhashforrevieweruser0000000000000000000000000',
      fullName: 'Layla Mahmoud',
      displayName: 'Layla',
      role: 'reviewer',
      isActive: true,
      isEmailVerified: true,
    }
  });

  const financeUser = await dbClient.user.upsert({
    where: { email: 'finance@tikit.ae' },
    update: {},
    create: {
      email: 'finance@tikit.ae',
      passwordHash: '$2b$10$dummyhashforfinanceuser00000000000000000000000000',
      fullName: 'Youssef Khalil',
      displayName: 'Youssef',
      role: 'finance',
      isActive: true,
      isEmailVerified: true,
    }
  });

  const clientUser = await dbClient.user.upsert({
    where: { email: 'client@freshbrew.com' },
    update: {},
    create: {
      email: 'client@freshbrew.com',
      passwordHash: '$2b$10$dummyhashforclientuser000000000000000000000000000',
      fullName: 'Sarah Johnson',
      displayName: 'Sarah',
      role: 'client',
      isActive: true,
      isEmailVerified: true,
    }
  });

  const influencerUser = await dbClient.user.upsert({
    where: { email: 'influencer@creators.io' },
    update: {},
    create: {
      email: 'influencer@creators.io',
      passwordHash: '$2b$10$dummyhashforinfluenceruser0000000000000000000000',
      fullName: 'Marcus Thompson',
      displayName: 'Marcus',
      role: 'influencer',
      isActive: true,
      isEmailVerified: true,
    }
  });

  console.log('✅ Created 6 test users (director, cm, reviewer, finance, client, influencer)');

  // ─── 2. Assign V2 roles via UserRole junction table ────────────────────────
  console.log('\n🔑 Assigning V2 roles...');

  const roleAssignments = [
    { userId: directorUser.userId, role: 'director' },
    { userId: directorUser.userId, role: 'campaign_manager' }, // Director also has CM access
    { userId: cmUser.userId, role: 'campaign_manager' },
    { userId: reviewerUser.userId, role: 'reviewer' },
    { userId: financeUser.userId, role: 'finance' },
    { userId: clientUser.userId, role: 'client' },
    { userId: influencerUser.userId, role: 'influencer' },
  ];

  for (const assignment of roleAssignments) {
    await dbClient.userRole.upsert({
      where: { userId_role: { userId: assignment.userId, role: assignment.role } },
      update: {},
      create: assignment,
    });
  }

  console.log('✅ Assigned all 6 V2 roles (director has multi-role: director + campaign_manager)');

  // ─── 3. Migrate existing users to UserRole table ───────────────────────────
  console.log('\n🔄 Migrating existing users to UserRole table...');

  const existingUsers = await dbClient.user.findMany({
    where: { roles: { none: {} } }, // Users without any UserRole entries
  });

  for (const user of existingUsers) {
    const roleMap = {
      'client_manager': 'campaign_manager',
      'admin': 'director',
      'influencer_manager': 'campaign_manager',
      'director': 'director',
      'campaign_manager': 'campaign_manager',
      'reviewer': 'reviewer',
      'finance': 'finance',
      'client': 'client',
      'influencer': 'influencer',
    };
    const mappedRole = roleMap[user.role] || 'campaign_manager';
    await dbClient.userRole.upsert({
      where: { userId_role: { userId: user.userId, role: mappedRole } },
      update: {},
      create: { userId: user.userId, role: mappedRole },
    });
  }

  console.log(`✅ Migrated ${existingUsers.length} existing users to UserRole table`);

  // ─── 4. Generate displayIds for existing records ───────────────────────────
  console.log('\n🏷️  Generating display IDs for existing records...');

  const year = new Date().getFullYear();

  // Campaigns without displayId
  const campaignsNoId = await dbClient.campaign.findMany({ where: { displayId: null } });
  for (let i = 0; i < campaignsNoId.length; i++) {
    await dbClient.campaign.update({
      where: { campaignId: campaignsNoId[i].campaignId },
      data: { displayId: `TKT-${year}-${String(i + 1).padStart(4, '0')}` },
    });
  }
  console.log(`✅ Generated ${campaignsNoId.length} campaign display IDs`);

  // Clients without displayId
  const clientsNoId = await dbClient.client.findMany({ where: { displayId: null } });
  for (let i = 0; i < clientsNoId.length; i++) {
    await dbClient.client.update({
      where: { clientId: clientsNoId[i].clientId },
      data: { displayId: `CLI-${String(i + 1).padStart(4, '0')}` },
    });
  }
  console.log(`✅ Generated ${clientsNoId.length} client display IDs`);

  // Influencers without displayId
  const influencersNoId = await dbClient.influencer.findMany({ where: { displayId: null } });
  for (let i = 0; i < influencersNoId.length; i++) {
    await dbClient.influencer.update({
      where: { influencerId: influencersNoId[i].influencerId },
      data: { displayId: `INF-${String(i + 1).padStart(4, '0')}` },
    });
  }
  console.log(`✅ Generated ${influencersNoId.length} influencer display IDs`);

  // Invoices without displayId
  const invoicesNoId = await dbClient.invoice.findMany({ where: { displayId: null } });
  for (let i = 0; i < invoicesNoId.length; i++) {
    await dbClient.invoice.update({
      where: { id: invoicesNoId[i].id },
      data: { displayId: `INV-${year}-${String(i + 1).padStart(4, '0')}` },
    });
  }
  console.log(`✅ Generated ${invoicesNoId.length} invoice display IDs`);

  // ─── 5. Set ownerId for campaigns without one ──────────────────────────────
  console.log('\n👑 Setting campaign owners...');

  const campaignsNoOwner = await dbClient.campaign.findMany({ where: { ownerId: null } });
  for (const campaign of campaignsNoOwner) {
    await dbClient.campaign.update({
      where: { campaignId: campaign.campaignId },
      data: { ownerId: cmUser.userId },
    });
  }
  console.log(`✅ Set owner for ${campaignsNoOwner.length} campaigns`);

  // ─── 6. Set closedAt for closed campaigns ──────────────────────────────────
  const closedCampaigns = await dbClient.campaign.findMany({
    where: { status: 'closed', closedAt: null },
  });
  for (const campaign of closedCampaigns) {
    await dbClient.campaign.update({
      where: { campaignId: campaign.campaignId },
      data: { closedAt: campaign.updatedAt },
    });
  }
  console.log(`✅ Set closedAt for ${closedCampaigns.length} closed campaigns`);

  console.log('\n🎉 TiKiT V2 database seeding completed!');
  console.log('📊 Summary: 6 users, 6+ roles, displayIds generated, owners set, statuses migrated');
}

seedTikitDatabase()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await dbClient.$disconnect();
  });
