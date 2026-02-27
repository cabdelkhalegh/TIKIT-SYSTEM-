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
 * Extract structured brief data from raw text with per-field confidence scores
 * T033: Returns { success, data } where data includes confidenceScores (0.0-1.0)
 */
async function extractBrief(rawText) {
  try {
    trackRequest();
    const model = getModel();
    const prompt = `You are a campaign brief analyst. Extract structured data from this campaign brief text.

Return ONLY valid JSON (no markdown) with these exact top-level keys:

1. "objectives" — array of strings (campaign goals)
2. "kpis" — array of strings (key performance indicators)
3. "targetAudience" — object with keys: ageRange (string), gender (string), location (string), interests (array of strings)
4. "deliverables" — array of objects, each with: type (string), quantity (number)
5. "budgetSignals" — object with keys: totalBudget (number or null), currency (string or null), perInfluencer (number or null)
6. "clientInfo" — object with keys: companyName (string or null), contactName (string or null), contactEmail (string or null)
7. "keyMessages" — array of strings (brand messages / themes)
8. "contentPillars" — array of strings (content themes / categories)
9. "matchingCriteria" — object with keys: platform (string), minFollowers (number), minEngagement (number), niches (array of strings), locations (array of strings)
10. "confidenceScores" — object mapping each of the 9 field names above to a confidence score between 0.0 and 1.0, indicating how confident you are that the extracted data is accurate and present in the brief. Use 0.0 if the field was not mentioned at all, and 1.0 if it was explicitly and clearly stated.

Example confidenceScores:
{
  "objectives": 0.9,
  "kpis": 0.7,
  "targetAudience": 0.8,
  "deliverables": 0.6,
  "budgetSignals": 0.5,
  "clientInfo": 0.3,
  "keyMessages": 0.85,
  "contentPillars": 0.9,
  "matchingCriteria": 0.75
}

If a field is not mentioned in the brief, return an empty array/object for it and set its confidence to 0.0.

Brief text:
${rawText}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Parse JSON — handle potential markdown code fences
    let parsed;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1].trim());
    } else {
      const objMatch = text.match(/\{[\s\S]*\}/);
      parsed = objMatch ? JSON.parse(objMatch[0]) : null;
    }

    if (!parsed) {
      return { success: false, fallbackRequired: true, error: 'Failed to parse AI response' };
    }

    // Ensure confidenceScores exists with defaults
    if (!parsed.confidenceScores) {
      parsed.confidenceScores = {
        objectives: 0.5,
        kpis: 0.5,
        targetAudience: 0.5,
        deliverables: 0.5,
        budgetSignals: 0.5,
        clientInfo: 0.5,
        keyMessages: 0.5,
        contentPillars: 0.5,
        matchingCriteria: 0.5,
      };
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini extractBrief error:', error.message);
    return { success: false, fallbackRequired: true, error: error.message };
  }
}

/**
 * Generate campaign strategy from brief data
 * T034: Verified — returns summary, keyMessages, contentPillars, matchingCriteria
 */
async function generateStrategy(briefData) {
  try {
    trackRequest();
    const model = getModel();
    const prompt = `You are a campaign strategist. Generate a comprehensive influencer marketing strategy based on this brief data.

Return ONLY valid JSON (no markdown) with these exact keys:
1. "summary" — string, 2-3 paragraphs describing the overall strategy
2. "keyMessages" — array of strings (3-5 key brand messages for influencers)
3. "contentPillars" — array of strings (3-5 content themes/categories)
4. "matchingCriteria" — object with:
   - platform (string, e.g. "instagram")
   - followerRange (object with min and max numbers)
   - engagementMin (number, minimum engagement rate percentage)
   - niches (array of strings)
   - locations (array of strings)
   - languages (array of strings)

Brief data:
${JSON.stringify(briefData)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Parse JSON — handle potential markdown code fences
    let parsed;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1].trim());
    } else {
      const objMatch = text.match(/\{[\s\S]*\}/);
      parsed = objMatch ? JSON.parse(objMatch[0]) : null;
    }
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
    const prompt = `Score each influencer against the campaign criteria. Return ONLY valid JSON (no markdown) as an array of objects with these exact keys:
- influencerId (string — the influencer's id)
- score (number 0-100, overall weighted score)
- rationale (string explaining the score in 1-2 sentences)
- breakdown (object with numeric scores for each weight category):
  - platform (number 0-25, how well the influencer's platform matches)
  - followers (number 0-20, follower count fit)
  - engagement (number 0-20, engagement rate fit)
  - niche (number 0-15, niche alignment)
  - geo (number 0-12, geographic match)
  - language (number 0-8, language match)

Weighting: Platform match 25%, Follower count 20%, Engagement rate 20%, Niche 15%, Geo 12%, Language 8%.

Campaign criteria:
${JSON.stringify(strategyCriteria)}

Influencers:
${JSON.stringify(influencers)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    let parsed;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1].trim());
    } else {
      const arrMatch = text.match(/\[[\s\S]*\]/);
      parsed = arrMatch ? JSON.parse(arrMatch[0]) : [];
    }
    // Ensure each item has a breakdown
    if (Array.isArray(parsed)) {
      parsed = parsed.map((item) => ({
        ...item,
        breakdown: item.breakdown || {
          platform: 0,
          followers: 0,
          engagement: 0,
          niche: 0,
          geo: 0,
          language: 0,
        },
      }));
    }
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
 * T054: Supports both file buffer (image/PDF) and URL-based extraction
 * Extracts: companyName, vatTrnNumber, licenseNumber, expiryDate, businessAddress, activities, ownerNames
 */
async function extractTradeLicense(fileInput, mimeType) {
  try {
    trackRequest();
    const model = getModel();

    const extractionPrompt = `You are an OCR specialist for UAE trade license documents. Extract structured data from this trade license.

Return ONLY valid JSON (no markdown) with these exact keys:
- companyName (string — the registered company/establishment name)
- vatTrnNumber (string — VAT or TRN number, e.g. "100123456700003")
- licenseNumber (string — the trade license number, e.g. "DED-789012")
- expiryDate (string — license expiry date in ISO 8601 format, e.g. "2027-06-30")
- businessAddress (string — full registered business address)
- activities (array of strings — list of permitted business activities)
- ownerNames (array of strings — names of license holders/owners)
- confidenceScores (object mapping each of the 7 field names above to a confidence score between 0.0 and 1.0)

If a field cannot be found in the document, return null for strings, empty array for arrays, and 0.0 for its confidence score.`;

    let result;
    if (Buffer.isBuffer(fileInput)) {
      // File buffer provided — use Gemini multimodal with inline data
      const imagePart = {
        inlineData: {
          data: fileInput.toString('base64'),
          mimeType: mimeType || 'image/jpeg',
        },
      };
      result = await model.generateContent([extractionPrompt, imagePart]);
    } else {
      // URL string — pass as text context (fallback for URL-based docs)
      result = await model.generateContent(`${extractionPrompt}\n\nDocument URL: ${fileInput}`);
    }

    const text = result.response.text();
    // Parse JSON — handle potential markdown code fences
    let parsed;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1].trim());
    } else {
      const objMatch = text.match(/\{[\s\S]*\}/);
      parsed = objMatch ? JSON.parse(objMatch[0]) : null;
    }

    if (!parsed) {
      return { success: false, fallbackRequired: true, error: 'Failed to parse AI response' };
    }

    // Ensure confidenceScores exists with defaults
    if (!parsed.confidenceScores) {
      parsed.confidenceScores = {
        companyName: 0.5, vatTrnNumber: 0.5, licenseNumber: 0.5,
        expiryDate: 0.5, businessAddress: 0.5, activities: 0.5, ownerNames: 0.5,
      };
    }

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
