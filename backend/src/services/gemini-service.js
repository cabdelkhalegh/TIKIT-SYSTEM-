/**
 * Centralized Gemini AI Service
 * Uses Gemini 2.0 Flash for all AI operations (per R-005, Constitution Section VI)
 * All methods return {success: false, fallbackRequired: true, error} on failure
 * Tracks request count toward 1,500/day limit
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash';
const DAILY_LIMIT = 1500;
const WARN_THRESHOLD = 1350; // Warn at 90% of limit

// Request tracking
let requestCount = 0;
let lastResetDate = new Date().toDateString();

function trackRequest() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    requestCount = 0;
    lastResetDate = today;
  }
  requestCount++;
  if (requestCount >= WARN_THRESHOLD) {
    console.warn(`⚠️ Gemini API: ${requestCount}/${DAILY_LIMIT} requests used today (approaching limit)`);
  }
}

function getModel() {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable not set');
  }
  const genAI = new GoogleGenerativeAI(API_KEY);
  return genAI.getGenerativeModel({ model: MODEL_NAME });
}

/**
 * Extract structured brief data from raw text
 */
async function extractBrief(rawText) {
  try {
    trackRequest();
    const model = getModel();
    const prompt = `Extract structured data from this campaign brief. Return valid JSON with these fields:
- objectives (array of strings)
- kpis (array of strings)
- targetAudience (object with demographics, interests, behaviors)
- deliverables (array of strings)
- budgetSignals (object with budget range, currency, constraints)
- clientInfo (object with companyName, industry, contacts)
- keyMessages (array of strings)
- contentPillars (array of strings)
- matchingCriteria (object with platform, followerRange, engagementMin, niches, locations)
- confidenceScores (object mapping each field to a score 0-1)

Brief text:
${rawText}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini extractBrief error:', error.message);
    return { success: false, fallbackRequired: true, error: error.message };
  }
}

/**
 * Generate campaign strategy from brief data
 */
async function generateStrategy(briefData) {
  try {
    trackRequest();
    const model = getModel();
    const prompt = `Generate a campaign strategy based on this brief data. Return valid JSON with:
- summary (string, 2-3 paragraphs)
- keyMessages (array of strings)
- contentPillars (array of strings)
- matchingCriteria (object with platform, followerRange, engagementMin, niches, locations)

Brief data:
${JSON.stringify(briefData)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini generateStrategy error:', error.message);
    return { success: false, fallbackRequired: true, error: error.message };
  }
}

/**
 * Score influencers against campaign strategy criteria
 * Weighted: Platform 25%, Followers 20%, Engagement 20%, Niche/Geo/Language remaining
 */
async function scoreInfluencers(influencers, strategyCriteria) {
  try {
    trackRequest();
    const model = getModel();
    const prompt = `Score each influencer against the campaign criteria. Return valid JSON array with objects:
- influencerId (string)
- score (number 0-100)
- rationale (string explaining the score)

Weighting: Platform match 25%, Follower count 20%, Engagement rate 20%, Niche/Geo/Language 35%

Campaign criteria:
${JSON.stringify(strategyCriteria)}

Influencers:
${JSON.stringify(influencers)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini scoreInfluencers error:', error.message);
    return { success: false, fallbackRequired: true, error: error.message };
  }
}

/**
 * Generate narrative summary for campaign report
 */
async function generateReportNarrative(kpiSummary, campaignContext) {
  try {
    trackRequest();
    const model = getModel();
    const prompt = `Generate a professional campaign report narrative. Return valid JSON with:
- narrative (string, 3-5 paragraphs)
- highlights (array of key achievements)
- recommendations (array of next steps)

Campaign context:
${JSON.stringify(campaignContext)}

KPI Summary:
${JSON.stringify(kpiSummary)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini generateReportNarrative error:', error.message);
    return { success: false, fallbackRequired: true, error: error.message };
  }
}

/**
 * Generate closure intelligence document
 */
async function generateClosureIntelligence(campaignData, cxSurvey, postMortem, kpiSummary) {
  try {
    trackRequest();
    const model = getModel();
    const prompt = `Generate a comprehensive campaign closure intelligence document. Return valid JSON with:
- learnings (array of key takeaways)
- bestPractices (array of practices to replicate)
- wrapUp (string, comprehensive summary)

Campaign data:
${JSON.stringify(campaignData)}

CX Survey:
${JSON.stringify(cxSurvey)}

Post-mortem:
${JSON.stringify(postMortem)}

KPI Summary:
${JSON.stringify(kpiSummary)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini generateClosureIntelligence error:', error.message);
    return { success: false, fallbackRequired: true, error: error.message };
  }
}

/**
 * Extract trade license data via OCR
 */
async function extractTradeLicense(fileUrl) {
  try {
    trackRequest();
    const model = getModel();
    const prompt = `Extract structured data from this trade license document. Return valid JSON with:
- companyName (string)
- vatTrnNumber (string)
- licenseNumber (string)
- expiryDate (string, ISO date)
- businessAddress (string)
- activities (array of strings)
- ownerNames (array of strings)

Document URL: ${fileUrl}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini extractTradeLicense error:', error.message);
    return { success: false, fallbackRequired: true, error: error.message };
  }
}

module.exports = {
  extractBrief,
  generateStrategy,
  scoreInfluencers,
  generateReportNarrative,
  generateClosureIntelligence,
  extractTradeLicense,
};
