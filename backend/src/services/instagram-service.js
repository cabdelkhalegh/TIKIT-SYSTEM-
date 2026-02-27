/**
 * Instagram Service
 * Handles Instagram Graph API interactions for influencer discovery
 * T043: Three search modes + profile/post metrics
 * Falls back to demo data when Instagram connection is not configured
 */

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

// Check if Instagram credentials are configured
function isConnected() {
  return !!(INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_APP_ID);
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_PROFILES = [
  {
    igUserId: 'demo_001',
    username: 'beautybylayla',
    fullName: 'Layla M.',
    bio: 'Beauty & skincare enthusiast | Dubai-based',
    profilePicture: null,
    followerCount: 85000,
    followingCount: 1200,
    mediaCount: 340,
    engagementRate: 3.2,
    isDemoData: true,
  },
  {
    igUserId: 'demo_002',
    username: 'fitnesswithomar',
    fullName: 'Omar K.',
    bio: 'Fitness coach | Transformation specialist | Abu Dhabi',
    profilePicture: null,
    followerCount: 120000,
    followingCount: 850,
    mediaCount: 560,
    engagementRate: 4.1,
    isDemoData: true,
  },
  {
    igUserId: 'demo_003',
    username: 'dubaifoodies',
    fullName: 'Sara & Ahmed',
    bio: 'Food lovers exploring Dubai one bite at a time',
    profilePicture: null,
    followerCount: 210000,
    followingCount: 1500,
    mediaCount: 890,
    engagementRate: 2.8,
    isDemoData: true,
  },
  {
    igUserId: 'demo_004',
    username: 'techreviewsuae',
    fullName: 'Khalid T.',
    bio: 'Tech reviewer | Unboxings | UAE tech scene',
    profilePicture: null,
    followerCount: 55000,
    followingCount: 430,
    mediaCount: 220,
    engagementRate: 5.6,
    isDemoData: true,
  },
  {
    igUserId: 'demo_005',
    username: 'fashionistadxb',
    fullName: 'Hana R.',
    bio: 'Fashion blogger | Modest fashion | Collaborations open',
    profilePicture: null,
    followerCount: 175000,
    followingCount: 980,
    mediaCount: 670,
    engagementRate: 3.7,
    isDemoData: true,
  },
];

function filterDemoProfiles(query, field) {
  const q = query.toLowerCase();
  return DEMO_PROFILES.filter((p) =>
    p[field].toLowerCase().includes(q)
  );
}

// ─── Live API Helpers ───────────────────────────────────────────────────────

async function graphGet(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Instagram API error: ${res.status}`);
  }
  return res.json();
}

// ─── Public Methods ─────────────────────────────────────────────────────────

/**
 * Search influencers by name using Pages API with linked IG accounts
 */
async function searchByName(query) {
  if (!isConnected()) {
    return {
      results: filterDemoProfiles(query, 'fullName'),
      isDemoData: true,
    };
  }

  try {
    const url = `${GRAPH_API_BASE}/pages/search?q=${encodeURIComponent(query)}&fields=id,name,link,instagram_business_account{id,username,name,followers_count,follows_count,media_count,biography,profile_picture_url}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const data = await graphGet(url);

    const results = (data.data || [])
      .filter((page) => page.instagram_business_account)
      .map((page) => {
        const ig = page.instagram_business_account;
        return {
          igUserId: ig.id,
          username: ig.username,
          fullName: ig.name || page.name,
          bio: ig.biography || '',
          profilePicture: ig.profile_picture_url || null,
          followerCount: ig.followers_count || 0,
          followingCount: ig.follows_count || 0,
          mediaCount: ig.media_count || 0,
          engagementRate: null,
          isDemoData: false,
        };
      });

    return { results, isDemoData: false };
  } catch (error) {
    console.error('Instagram searchByName error:', error.message);
    throw error;
  }
}

/**
 * Search by username using business_discovery endpoint
 */
async function searchByUsername(username) {
  // Strip leading @ if present
  const handle = username.replace(/^@/, '');

  if (!isConnected()) {
    return {
      results: filterDemoProfiles(handle, 'username'),
      isDemoData: true,
    };
  }

  try {
    // business_discovery requires our own IG user ID
    const meUrl = `${GRAPH_API_BASE}/me?fields=id&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const me = await graphGet(meUrl);

    const url = `${GRAPH_API_BASE}/${me.id}?fields=business_discovery.username(${handle}){id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,media.limit(12){like_count,comments_count,timestamp}}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const data = await graphGet(url);
    const bd = data.business_discovery;

    if (!bd) {
      return { results: [], isDemoData: false };
    }

    // Calculate engagement rate from recent media
    let engagementRate = null;
    if (bd.media?.data?.length && bd.followers_count > 0) {
      const totalEng = bd.media.data.reduce(
        (sum, m) => sum + (m.like_count || 0) + (m.comments_count || 0),
        0
      );
      engagementRate =
        Math.round(
          (totalEng / bd.media.data.length / bd.followers_count) * 100 * 100
        ) / 100;
    }

    const profile = {
      igUserId: bd.id,
      username: bd.username,
      fullName: bd.name || handle,
      bio: bd.biography || '',
      profilePicture: bd.profile_picture_url || null,
      followerCount: bd.followers_count || 0,
      followingCount: bd.follows_count || 0,
      mediaCount: bd.media_count || 0,
      engagementRate,
      isDemoData: false,
    };

    return { results: [profile], isDemoData: false };
  } catch (error) {
    console.error('Instagram searchByUsername error:', error.message);
    throw error;
  }
}

/**
 * Search by hashtag — resolve media owners
 */
async function searchByHashtag(hashtag) {
  const tag = hashtag.replace(/^#/, '');

  if (!isConnected()) {
    // Return all demo profiles for hashtag search
    return {
      results: DEMO_PROFILES.filter((p) =>
        p.bio.toLowerCase().includes(tag.toLowerCase())
      ).length
        ? DEMO_PROFILES.filter((p) =>
            p.bio.toLowerCase().includes(tag.toLowerCase())
          )
        : DEMO_PROFILES.slice(0, 3),
      isDemoData: true,
    };
  }

  try {
    // Get our IG user id
    const meUrl = `${GRAPH_API_BASE}/me?fields=id&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const me = await graphGet(meUrl);

    // Resolve hashtag ID
    const hashUrl = `${GRAPH_API_BASE}/ig_hashtag_search?user_id=${me.id}&q=${encodeURIComponent(tag)}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const hashData = await graphGet(hashUrl);
    const hashId = hashData.data?.[0]?.id;

    if (!hashId) {
      return { results: [], isDemoData: false };
    }

    // Get recent media for hashtag
    const mediaUrl = `${GRAPH_API_BASE}/${hashId}/recent_media?user_id=${me.id}&fields=id,caption,like_count,comments_count,permalink,owner{id,username}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const mediaData = await graphGet(mediaUrl);

    // Dedupe owners
    const ownerMap = new Map();
    for (const media of mediaData.data || []) {
      if (media.owner && !ownerMap.has(media.owner.id)) {
        ownerMap.set(media.owner.id, {
          igUserId: media.owner.id,
          username: media.owner.username || 'unknown',
          fullName: media.owner.username || 'Unknown',
          bio: '',
          profilePicture: null,
          followerCount: null,
          followingCount: null,
          mediaCount: null,
          engagementRate: null,
          isDemoData: false,
        });
      }
    }

    return { results: Array.from(ownerMap.values()), isDemoData: false };
  } catch (error) {
    console.error('Instagram searchByHashtag error:', error.message);
    throw error;
  }
}

/**
 * Fetch detailed profile metrics for a given IG user ID
 */
async function fetchProfileMetrics(igUserId) {
  if (!isConnected()) {
    const demo = DEMO_PROFILES.find((p) => p.igUserId === igUserId);
    return demo
      ? { ...demo, isDemoData: true }
      : { isDemoData: true, error: 'Demo user not found' };
  }

  try {
    const url = `${GRAPH_API_BASE}/${igUserId}?fields=id,username,name,followers_count,follows_count,media_count,biography,profile_picture_url,media.limit(12){like_count,comments_count,timestamp}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const data = await graphGet(url);

    let engagementRate = null;
    if (data.media?.data?.length && data.followers_count > 0) {
      const totalEng = data.media.data.reduce(
        (sum, m) => sum + (m.like_count || 0) + (m.comments_count || 0),
        0
      );
      engagementRate =
        Math.round(
          (totalEng / data.media.data.length / data.followers_count) * 100 * 100
        ) / 100;
    }

    return {
      igUserId: data.id,
      username: data.username,
      fullName: data.name,
      bio: data.biography || '',
      profilePicture: data.profile_picture_url || null,
      followerCount: data.followers_count,
      followingCount: data.follows_count,
      mediaCount: data.media_count,
      engagementRate,
      isDemoData: false,
    };
  } catch (error) {
    console.error('Instagram fetchProfileMetrics error:', error.message);
    throw error;
  }
}

/**
 * Fetch metrics for a specific media post
 */
async function fetchPostMetrics(mediaId) {
  if (!isConnected()) {
    return {
      mediaId,
      likes: Math.floor(Math.random() * 5000),
      comments: Math.floor(Math.random() * 200),
      reach: Math.floor(Math.random() * 50000),
      impressions: Math.floor(Math.random() * 80000),
      isDemoData: true,
    };
  }

  try {
    const url = `${GRAPH_API_BASE}/${mediaId}?fields=id,like_count,comments_count,timestamp&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const data = await graphGet(url);

    // Insights require separate call for reach/impressions
    let reach = null;
    let impressions = null;
    try {
      const insightsUrl = `${GRAPH_API_BASE}/${mediaId}/insights?metric=reach,impressions&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
      const insightsData = await graphGet(insightsUrl);
      for (const metric of insightsData.data || []) {
        if (metric.name === 'reach') reach = metric.values?.[0]?.value;
        if (metric.name === 'impressions') impressions = metric.values?.[0]?.value;
      }
    } catch {
      // Insights may not be available for all media
    }

    return {
      mediaId: data.id,
      likes: data.like_count || 0,
      comments: data.comments_count || 0,
      reach,
      impressions,
      isDemoData: false,
    };
  } catch (error) {
    console.error('Instagram fetchPostMetrics error:', error.message);
    throw error;
  }
}

/**
 * T081: Capture KPIs for an influencer — used by auto-capture schedules
 * Calls business_discovery API for connected influencers, returns metrics.
 * Falls back to demo data when not connected.
 */
async function captureKPIs(handleOrIgUserId) {
  const handle = (handleOrIgUserId || '').replace(/^@/, '');

  if (!isConnected()) {
    // Demo mode: return plausible random metrics
    const demo = DEMO_PROFILES.find(
      (p) => p.username === handle || p.igUserId === handle
    );
    const baseFollowers = demo ? demo.followerCount : 50000;
    return {
      reach: baseFollowers + Math.floor(Math.random() * 20000),
      impressions: Math.floor(baseFollowers * 1.5 + Math.random() * 30000),
      engagement: Math.floor(baseFollowers * 0.04 + Math.random() * 1000),
      clicks: Math.floor(Math.random() * 500 + 50),
      capturedAt: new Date().toISOString(),
      isDemoData: true,
    };
  }

  try {
    // Get our own IG user ID for business_discovery
    const meUrl = `${GRAPH_API_BASE}/me?fields=id&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const me = await graphGet(meUrl);

    // Fetch profile via business_discovery
    const url = `${GRAPH_API_BASE}/${me.id}?fields=business_discovery.username(${handle}){id,followers_count,media.limit(12){like_count,comments_count,timestamp,insights.metric(reach,impressions){name,values}}}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const data = await graphGet(url);
    const bd = data.business_discovery;

    if (!bd) {
      throw new Error(`Could not find Instagram profile for @${handle}`);
    }

    let totalReach = bd.followers_count || 0;
    let totalImpressions = 0;
    let totalEngagement = 0;

    if (bd.media?.data) {
      for (const media of bd.media.data) {
        totalEngagement += (media.like_count || 0) + (media.comments_count || 0);
        if (media.insights?.data) {
          for (const insight of media.insights.data) {
            if (insight.name === 'reach') totalReach += insight.values?.[0]?.value || 0;
            if (insight.name === 'impressions') totalImpressions += insight.values?.[0]?.value || 0;
          }
        }
      }
    }

    // If no impressions from insights, estimate from reach
    if (totalImpressions === 0) {
      totalImpressions = Math.floor(totalReach * 1.4);
    }

    return {
      reach: totalReach,
      impressions: totalImpressions,
      engagement: totalEngagement,
      clicks: null, // clicks not available from business_discovery
      capturedAt: new Date().toISOString(),
      isDemoData: false,
    };
  } catch (error) {
    console.error('Instagram captureKPIs error:', error.message);
    throw error;
  }
}

module.exports = {
  isConnected,
  searchByName,
  searchByUsername,
  searchByHashtag,
  fetchProfileMetrics,
  fetchPostMetrics,
  captureKPIs,
};
