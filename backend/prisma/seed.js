const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  // WARNING: These passwords are plaintext for development ONLY
  // In production, ALWAYS use bcrypt or similar to hash passwords:
  // const bcrypt = require('bcrypt');
  // const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@tikit.com' },
    update: {},
    create: {
      email: 'admin@tikit.com',
      name: 'Admin User',
      password: 'dev_password_only', // NEVER use plaintext passwords in production!
      role: 'admin',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user@tikit.com' },
    update: {},
    create: {
      email: 'user@tikit.com',
      name: 'Regular User',
      password: 'dev_password_only', // NEVER use plaintext passwords in production!
      role: 'user',
    },
  });

  console.log('✅ Created users:', { user1, user2 });

  // Create sample tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Setup development environment',
      description: 'Configure Docker and development tools',
      status: 'completed',
      priority: 'high',
      userId: user1.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Implement Prisma ORM',
      description: 'Add Prisma for database management',
      status: 'in-progress',
      priority: 'high',
      userId: user1.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Create user authentication',
      description: 'Implement JWT authentication',
      status: 'open',
      priority: 'medium',
      userId: user2.id,
    },
  });

  console.log('✅ Created tickets:', { ticket1, ticket2, ticket3 });
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
