// TIKIT Admin Routes — Phase 6 US4 (T056)
// All endpoints restricted to Director role
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const accessControl = require('../middleware/access-control');
const securityManager = require('../utils/security-manager');

const prisma = new PrismaClient();
const adminRouter = express.Router();

// All admin routes require authentication + Director role
adminRouter.use(
  accessControl.requireAuthentication.bind(accessControl),
  accessControl.requireV2Role('director').bind(accessControl)
);

// ─── GET /admin/registrations — List pending registrations ──────────────────
adminRouter.get('/registrations', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'pending',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;

    const allowedSortFields = { createdAt: 'createdAt', companyName: 'companyName' };
    const orderField = allowedSortFields[sortBy] || 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [registrations, total] = await Promise.all([
      prisma.companyRegistration.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [orderField]: orderDir },
        include: {
          user: {
            select: {
              userId: true,
              email: true,
              fullName: true,
              displayName: true,
              phone: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.companyRegistration.count({ where }),
    ]);

    // Parse JSON fields for response
    const formatted = registrations.map((r) => ({
      id: r.id,
      user: {
        id: r.user.userId,
        email: r.user.email,
        displayName: r.user.displayName || r.user.fullName,
        phone: r.user.phone,
        createdAt: r.user.createdAt,
      },
      companyName: r.companyName,
      vatTrnNumber: r.vatTrnNumber,
      licenseNumber: r.licenseNumber,
      expiryDate: r.expiryDate,
      businessAddress: r.businessAddress,
      activities: r.activities ? JSON.parse(r.activities) : [],
      ownerNames: r.ownerNames ? JSON.parse(r.ownerNames) : [],
      licenseFileUrl: r.licenseFileUrl,
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.json({
      success: true,
      data: {
        registrations: formatted,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    console.error('List registrations failed:', err);
    res.status(500).json({ success: false, error: 'Failed to list registrations' });
  }
});

// ─── POST /admin/registrations/:id/approve ──────────────────────────────────
adminRouter.post('/registrations/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { role = 'client' } = req.body;

    const registration = await prisma.companyRegistration.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Registration is not in pending status' });
    }

    // Validate role
    const validRoles = ['director', 'campaign_manager', 'reviewer', 'finance', 'client', 'influencer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: `Invalid role: ${role}` });
    }

    // Transaction: approve registration + activate user + assign role
    await prisma.$transaction([
      prisma.companyRegistration.update({
        where: { id },
        data: {
          status: 'approved',
          reviewedBy: req.authenticatedUser.userId,
        },
      }),
      prisma.user.update({
        where: { userId: registration.userId },
        data: { isActive: true },
      }),
      prisma.userRole.create({
        data: {
          userId: registration.userId,
          role,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        registrationId: id,
        userId: registration.userId,
        status: 'approved',
        assignedRole: role,
        userActivated: true,
        message: 'Registration approved. User can now log in.',
      },
    });
  } catch (err) {
    console.error('Approve registration failed:', err);
    res.status(500).json({ success: false, error: 'Failed to approve registration' });
  }
});

// ─── POST /admin/registrations/:id/reject ───────────────────────────────────
adminRouter.post('/registrations/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'reason is required when rejecting a registration',
      });
    }

    const registration = await prisma.companyRegistration.findUnique({
      where: { id },
    });

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Registration is not in pending status' });
    }

    await prisma.companyRegistration.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: req.authenticatedUser.userId,
      },
    });

    res.json({
      success: true,
      data: {
        registrationId: id,
        status: 'rejected',
        rejectionReason: reason,
        message: 'Registration rejected.',
      },
    });
  } catch (err) {
    console.error('Reject registration failed:', err);
    res.status(500).json({ success: false, error: 'Failed to reject registration' });
  }
});

// ─── GET /admin/users — List all users with roles ───────────────────────────
adminRouter.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (role) {
      const roleFilters = role.split(',').map((r) => r.trim());
      where.roles = { some: { role: { in: roleFilters } } };
    }

    const allowedSortFields = {
      createdAt: 'createdAt',
      displayName: 'displayName',
      email: 'email',
      lastSignIn: 'lastLoginAt',
    };
    const orderField = allowedSortFields[sortBy] || 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [orderField]: orderDir },
        select: {
          userId: true,
          email: true,
          fullName: true,
          displayName: true,
          phone: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          roles: { select: { role: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formatted = users.map((u) => ({
      id: u.userId,
      email: u.email,
      displayName: u.displayName || u.fullName,
      phone: u.phone,
      isActive: u.isActive,
      isEmailVerified: u.isEmailVerified,
      roles: u.roles.map((r) => r.role),
      lastSignIn: u.lastLoginAt,
      createdAt: u.createdAt,
    }));

    res.json({
      success: true,
      data: {
        users: formatted,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    console.error('List users failed:', err);
    res.status(500).json({ success: false, error: 'Failed to list users' });
  }
});

// ─── PATCH /admin/users/:id/roles — Assign/remove roles ────────────────────
adminRouter.patch('/users/:id/roles', async (req, res) => {
  try {
    const { id } = req.params;
    const { add = [], remove = [] } = req.body;

    if (add.length === 0 && remove.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one of add or remove must be provided',
      });
    }

    const user = await prisma.user.findUnique({
      where: { userId: id },
      include: { roles: { select: { role: true } } },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Calculate resulting roles
    const currentRoles = new Set(user.roles.map((r) => r.role));
    remove.forEach((r) => currentRoles.delete(r));
    add.forEach((r) => currentRoles.add(r));
    const resultingRoles = Array.from(currentRoles);

    // Enforce Client/Influencer exclusivity
    const hasClient = resultingRoles.includes('client');
    const hasInfluencer = resultingRoles.includes('influencer');
    const hasInternal = resultingRoles.some((r) =>
      ['director', 'campaign_manager', 'reviewer', 'finance'].includes(r)
    );

    if (hasClient && (hasInfluencer || hasInternal)) {
      return res.status(400).json({
        success: false,
        error: 'Client role cannot be combined with other roles',
      });
    }

    if (hasInfluencer && (hasClient || hasInternal)) {
      return res.status(400).json({
        success: false,
        error: 'Influencer role cannot be combined with other roles',
      });
    }

    // Execute role changes in a transaction
    const operations = [];

    for (const roleName of remove) {
      operations.push(
        prisma.userRole.deleteMany({
          where: { userId: id, role: roleName },
        })
      );
    }

    for (const roleName of add) {
      operations.push(
        prisma.userRole.upsert({
          where: { userId_role: { userId: id, role: roleName } },
          create: { userId: id, role: roleName },
          update: {},
        })
      );
    }

    await prisma.$transaction(operations);

    // Fetch updated roles
    const updatedRoles = await prisma.userRole.findMany({
      where: { userId: id },
      select: { role: true },
    });

    res.json({
      success: true,
      data: {
        userId: id,
        roles: updatedRoles.map((r) => r.role),
        message: 'Roles updated successfully',
      },
    });
  } catch (err) {
    console.error('Update roles failed:', err);
    res.status(500).json({ success: false, error: 'Failed to update roles' });
  }
});

// ─── POST /admin/users/:id/reset-password ───────────────────────────────────
adminRouter.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'newPassword is required' });
    }

    // Validate password complexity
    const errors = [];
    if (newPassword.length < 8) errors.push('min 8 chars');
    if (!/[A-Z]/.test(newPassword)) errors.push('uppercase');
    if (!/[a-z]/.test(newPassword)) errors.push('lowercase');
    if (!/[0-9]/.test(newPassword)) errors.push('number');
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet complexity requirements',
      });
    }

    const user = await prisma.user.findUnique({ where: { userId: id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const hashedPassword = await securityManager.encryptUserPassword(newPassword);
    await prisma.user.update({
      where: { userId: id },
      data: {
        passwordHash: hashedPassword,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    res.json({
      success: true,
      data: {
        userId: id,
        message: 'Password reset successfully',
      },
    });
  } catch (err) {
    console.error('Admin reset password failed:', err);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// ─── POST /admin/users/:id/send-reset-email ─────────────────────────────────
adminRouter.post('/users/:id/send-reset-email', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { userId: id },
      select: { userId: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const resetToken = securityManager.createRandomSecurityToken();
    await prisma.user.update({
      where: { userId: id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Log for now — email service integration later
    console.log(`[Email] Password reset link for ${user.email}: /reset-password?token=${resetToken}`);

    res.json({
      success: true,
      data: {
        userId: id,
        email: user.email,
        message: 'Password reset email sent',
      },
    });
  } catch (err) {
    console.error('Send reset email failed:', err);
    res.status(500).json({ success: false, error: 'Failed to send reset email' });
  }
});

// ─── POST /admin/users/:id/unlock — Director unlocks locked account ─────────
adminRouter.post('/users/:id/unlock', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { userId: id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await prisma.user.update({
      where: { userId: id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    res.json({
      success: true,
      data: {
        userId: id,
        message: 'Account unlocked successfully',
      },
    });
  } catch (err) {
    console.error('Unlock account failed:', err);
    res.status(500).json({ success: false, error: 'Failed to unlock account' });
  }
});

// ─── DELETE /admin/users/:id — Soft-delete user ─────────────────────────────
adminRouter.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot delete yourself
    if (id === req.authenticatedUser.userId) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }

    const user = await prisma.user.findUnique({
      where: { userId: id },
      include: { roles: { select: { role: true } } },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if this is the last Director
    const isDirector = user.roles.some((r) => r.role === 'director');
    if (isDirector) {
      const directorCount = await prisma.userRole.count({
        where: { role: 'director' },
      });
      if (directorCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last Director user',
        });
      }
    }

    // Soft-delete: deactivate the user
    await prisma.user.update({
      where: { userId: id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      data: {
        userId: id,
        message: 'User deleted successfully',
      },
    });
  } catch (err) {
    console.error('Delete user failed:', err);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

module.exports = adminRouter;
