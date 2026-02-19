export const dynamic = 'force-dynamic';

// Influencers CRUD - List and Create
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRole, errorResponse, successResponse } from '@/lib/api-helpers';

// GET /api/v1/influencers
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const verified = searchParams.get('verified');

    const where: any = {};
    if (platform) where.primaryPlatform = platform;
    if (status) where.availabilityStatus = status;
    if (verified !== null) where.isVerified = verified === 'true';

    const influencers = await prisma.influencer.findMany({
      where,
      include: {
        campaignInfluencers: {
          include: {
            campaign: {
              select: {
                campaignId: true,
                campaignName: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        qualityScore: 'desc',
      },
    });

    // Transform JSON strings to objects/arrays for frontend
    const transformedInfluencers = influencers.map(influencer => {
      const location = influencer.city && influencer.country 
        ? `${influencer.city}, ${influencer.country}`
        : influencer.city || influencer.country || null;

      return {
        id: influencer.influencerId,
        influencerId: influencer.influencerId,
        fullName: influencer.fullName,
        displayName: influencer.displayName,
        email: influencer.email,
        phone: influencer.phone,
        bio: influencer.bio,
        profileImageUrl: influencer.profileImageUrl,
        location,
        city: influencer.city,
        country: influencer.country,
        socialMediaHandles: influencer.socialMediaHandles 
          ? JSON.parse(influencer.socialMediaHandles) 
          : {},
        primaryPlatform: influencer.primaryPlatform || 'instagram',
        audienceMetrics: influencer.audienceMetrics 
          ? JSON.parse(influencer.audienceMetrics) 
          : { followers: 0, engagementRate: 0 },
        contentCategories: influencer.contentCategories 
          ? JSON.parse(influencer.contentCategories) 
          : [],
        performanceHistory: influencer.performanceHistory 
          ? JSON.parse(influencer.performanceHistory) 
          : null,
        status: influencer.availabilityStatus,
        verified: influencer.isVerified,
        qualityScore: influencer.qualityScore || 0,
        ratePerPost: influencer.ratePerPost,
        ratePerVideo: influencer.ratePerVideo,
        ratePerStory: influencer.ratePerStory,
        campaignInfluencers: influencer.campaignInfluencers,
        createdAt: influencer.createdAt,
        updatedAt: influencer.updatedAt,
      };
    });

    return successResponse(transformedInfluencers);
  } catch (error: any) {
    console.error('Error fetching influencers:', error);
    return errorResponse('Failed to fetch influencers');
  }
});

// POST /api/v1/influencers
export const POST = withRole(['admin', 'influencer_manager'], async (req: NextRequest) => {
  try {
    const body = await req.json();

    const influencer = await prisma.influencer.create({
      data: body,
    });

    return successResponse(influencer, 'Influencer created successfully', 201);
  } catch (error: any) {
    console.error('Error creating influencer:', error);
    return errorResponse('Failed to create influencer');
  }
});
