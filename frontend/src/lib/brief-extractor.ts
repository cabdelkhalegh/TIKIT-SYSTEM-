/**
 * Campaign Brief AI Extraction
 * Uses OpenAI when OPENAI_API_KEY is set, otherwise falls back to keyword heuristics.
 */

export interface BriefFields {
  campaign_goals: string;
  target_audience: string;
  deliverables: string;
  timeline: string;
  budget_hint: string;
  tone_of_voice: string;
  key_messages: string;
}

const EMPTY_BRIEF: BriefFields = {
  campaign_goals: '',
  target_audience: '',
  deliverables: '',
  timeline: '',
  budget_hint: '',
  tone_of_voice: '',
  key_messages: '',
};

// --------------- OpenAI extraction ---------------

async function extractWithOpenAI(text: string): Promise<BriefFields> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('No OPENAI_API_KEY');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a campaign-brief parser. Given a raw brief text, extract these fields as a JSON object with string values:
- campaign_goals
- target_audience
- deliverables
- timeline
- budget_hint
- tone_of_voice
- key_messages

If a field cannot be determined, return an empty string for that field. Return ONLY the JSON object.`,
        },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    campaign_goals: parsed.campaign_goals ?? '',
    target_audience: parsed.target_audience ?? '',
    deliverables: parsed.deliverables ?? '',
    timeline: parsed.timeline ?? '',
    budget_hint: parsed.budget_hint ?? '',
    tone_of_voice: parsed.tone_of_voice ?? '',
    key_messages: parsed.key_messages ?? '',
  };
}

// --------------- Keyword heuristic fallback ---------------

function grabSection(text: string, headings: string[]): string {
  const lines = text.split('\n');
  const results: string[] = [];
  let capturing = false;

  for (const line of lines) {
    const lower = line.toLowerCase().trim();

    // Check if this line starts a matching section
    if (headings.some((h) => lower.startsWith(h) || lower.includes(h + ':'))) {
      capturing = true;
      // Grab content after the heading on the same line
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const rest = line.slice(colonIdx + 1).trim();
        if (rest) results.push(rest);
      }
      continue;
    }

    // Stop capturing when we hit another heading-like line
    if (capturing && /^[A-Z#\-*]/.test(line.trim()) && line.trim().length < 80 && line.includes(':')) {
      break;
    }

    if (capturing && line.trim()) {
      results.push(line.trim());
    }
  }

  return results.join(' ').trim();
}

function extractBudgetHint(text: string): string {
  // Look for currency patterns
  const currencyMatch = text.match(
    /(?:budget|cost|spend|investment|price)[:\s]*[^\n]*?(\$[\d,.]+[kKmM]?|\d[\d,.]*\s*(?:USD|AED|SAR|EUR|GBP))/i
  );
  if (currencyMatch) return currencyMatch[0].trim();

  const standaloneMatch = text.match(/\$[\d,.]+[kKmM]?/);
  if (standaloneMatch) return standaloneMatch[0];

  return grabSection(text, ['budget', 'cost', 'investment', 'spend', 'pricing']);
}

function extractWithKeywords(text: string): BriefFields {
  return {
    campaign_goals: grabSection(text, [
      'goal', 'objective', 'aim', 'purpose', 'campaign goal', 'campaign objective',
    ]),
    target_audience: grabSection(text, [
      'target audience', 'audience', 'demographic', 'target market', 'who',
    ]),
    deliverables: grabSection(text, [
      'deliverable', 'output', 'content', 'asset', 'what we need', 'scope',
    ]),
    timeline: grabSection(text, [
      'timeline', 'schedule', 'deadline', 'date', 'duration', 'when',
    ]),
    budget_hint: extractBudgetHint(text),
    tone_of_voice: grabSection(text, [
      'tone', 'voice', 'style', 'brand voice', 'tone of voice', 'messaging style',
    ]),
    key_messages: grabSection(text, [
      'key message', 'message', 'tagline', 'slogan', 'talking point', 'value prop',
    ]),
  };
}

// --------------- Public API ---------------

export async function extractBrief(text: string): Promise<{
  fields: BriefFields;
  method: 'openai' | 'keyword';
}> {
  if (!text || !text.trim()) {
    return { fields: { ...EMPTY_BRIEF }, method: 'keyword' };
  }

  // Try OpenAI first
  if (process.env.OPENAI_API_KEY) {
    try {
      const fields = await extractWithOpenAI(text);
      return { fields, method: 'openai' };
    } catch (err) {
      console.warn('OpenAI extraction failed, falling back to keywords:', err);
    }
  }

  // Keyword fallback
  const fields = extractWithKeywords(text);
  return { fields, method: 'keyword' };
}
