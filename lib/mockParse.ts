import type { Category, ParsedRequest, Urgency } from '@/types/barakah';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function detectCategory(text: string): { category: Category; confidenceBoost: number } {
  const t = text.toLowerCase();
  if (/\b(childcare|babysit|watch (my|the) kids|daycare)\b/.test(t)) {
    return { category: 'childcare', confidenceBoost: 0.2 };
  }
  // Tier 3 categories are tested first and matched broadly. Filing an elderly
  // person's ride as a plain 'ride' would route it to Tier 2 neighbours, which
  // is the exact misrouting the tier system exists to prevent — so kinship
  // plus a care signal counts, not just the literal word "elderly".
  const elderKin =
    /\b(grandmother|grandfather|grandma|grandpa|granny|nana|jaddah|jiddo|teta|mother|father|mom|dad)\b/;
  const elderCare =
    /\b(elder|elderly|senior|wheelchair|walker|cane|dialysis|chemo|assisted living|nursing home|hospice|care home|hard of hearing|needs? assistance)\b/;
  if (elderCare.test(t) || (elderKin.test(t) && /\b(ride|lift|drive|appointment|doctor|clinic|hospital)\b/.test(t))) {
    return { category: 'elder_transport', confidenceBoost: 0.15 };
  }
  if (/\b(ride|drive|jummah|jumuah|carpool|lift|drop.?off|pick.?up)\b/.test(t)) {
    return { category: 'ride', confidenceBoost: 0.25 };
  }
  if (/\b(food|grocer(?:y|ies)?|meal|pantry|hungry|iftar|suhoor|eat)\b/.test(t)) {
    return { category: 'food', confidenceBoost: 0.25 };
  }
  if (/\b(mov(e|ing)|boxes|furniture|truck)\b/.test(t)) {
    return { category: 'moving_help', confidenceBoost: 0.2 };
  }
  if (/\b(laptop|chromebook|computer for school)\b/.test(t)) {
    return { category: 'laptop', confidenceBoost: 0.2 };
  }
  if (/\b(new muslim|revert|convert|shahada)\b/.test(t)) {
    return { category: 'new_muslim_resources', confidenceBoost: 0.2 };
  }
  // Nothing matched. Previously this fell through to 'ride', which meant an
  // unrecognised request was silently filed as the wrong thing. 'other' is the
  // honest answer, and the low confidence sends the requester to the picker.
  return { category: 'other', confidenceBoost: -0.3 };
}

function detectUrgency(text: string): Urgency {
  const t = text.toLowerCase();
  if (/\b(now|asap|urgent|immediately|right away|tonight|this evening)\b/.test(t)) {
    return 'immediate';
  }
  return 'scheduled';
}

function detectTimeWindow(text: string): string {
  const t = text.toLowerCase();
  const timeMatch = t.match(/\b(\d{1,2})\s*(am|pm)\b/);
  if (t.includes('tomorrow') && timeMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const next = hour === 12 ? 1 : hour + 1;
    return `tomorrow ${timeMatch[1]}${timeMatch[2]}-${next}${timeMatch[2]}`;
  }
  if (t.includes('tomorrow')) return 'tomorrow';
  if (t.includes('friday') || t.includes('jummah') || t.includes('jumuah')) {
    return timeMatch ? `Friday ${timeMatch[1]}${timeMatch[2]}` : 'Friday midday';
  }
  if (t.includes('saturday')) return 'Saturday';
  if (t.includes('sunday')) return 'Sunday';
  if (t.includes('this evening') || t.includes('tonight')) return 'this evening';
  if (t.includes('morning')) return 'morning';
  if (timeMatch) return `around ${timeMatch[1]}${timeMatch[2]}`;
  return 'flexible';
}

/** Reject captures that are clearly a time, a prayer, or filler. */
function isPlaceLike(candidate: string): boolean {
  const c = candidate.trim();
  if (c.length < 3) return false;
  if (/\d/.test(c)) return false; // "1pm", "around 5"
  if (/^(the\s+)?(morning|afternoon|evening|night|noon|midday)$/i.test(c)) return false;
  if (/\b(jumu?m?[ua]h|fajr|dhuhr|asr|maghrib|isha|prayer|salah)\b/i.test(c)) return false;
  return true;
}

function detectLocation(text: string): string {
  // Ordered by how strongly each preposition indicates where the requester
  // actually *is*, rather than where they are going or when. "around" is
  // deliberately absent — it introduces times far more often than places.
  const patterns = [
    /\b(?:near|next to|close to|by)\s+([^,.]+)/i,
    /\bfrom\s+([^,.]+)/i,
    /\b(?:at|on)\s+([^,.]+)/i,
  ];

  for (const re of patterns) {
    const hit = text.match(re)?.[1];
    if (hit && isPlaceLike(hit)) return hit.trim();
  }

  // No usable place. Left blank so geocoding falls back to the community
  // anchor rather than inventing a neighbourhood the requester never named.
  return '';
}

function detectPreference(text: string): string | null {
  if (/same.?gender|sister|brother only|female helper|male helper/i.test(text)) {
    const m = text.match(/(same-gender helper|female helper|male helper|sister|brother only)/i);
    return m ? m[0].toLowerCase() : 'prefers same-gender helper';
  }
  return null;
}

/** First clause of the request, trimmed — a usable title for an 'other'. */
function summarise(text: string): string {
  const clause = text.split(/[.,;\n]/)[0].trim();
  const short = clause.length > 60 ? `${clause.slice(0, 57).trimEnd()}...` : clause;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** Mock AI parse with fake latency. No paid LLM. */
export async function mockParseRequest(rawText: string): Promise<ParsedRequest> {
  await delay(900 + Math.floor(Math.random() * 500));

  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      category: 'other',
      urgency: 'scheduled',
      time_window: 'flexible',
      location_text: '',
      preference: null,
      confidence: 0.15,
      customLabel: null,
    };
  }

  const { category, confidenceBoost } = detectCategory(trimmed);
  let confidence = 0.55 + confidenceBoost;
  if (trimmed.length > 40) confidence += 0.08;
  if (/\b(near|at|around)\b/i.test(trimmed)) confidence += 0.05;
  confidence = Math.max(0.15, Math.min(0.98, confidence));

  return {
    category,
    urgency: detectUrgency(trimmed),
    time_window: detectTimeWindow(trimmed),
    location_text: detectLocation(trimmed),
    preference: detectPreference(trimmed),
    confidence: Math.round(confidence * 100) / 100,
    // When nothing matched, the requester's own words are the best label we
    // have for what they need.
    customLabel: category === 'other' ? summarise(trimmed) : null,
  };
}
