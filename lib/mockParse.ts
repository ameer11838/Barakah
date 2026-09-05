import type { Category, ParsedRequest, Urgency } from '@/types/barakah';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function detectCategory(text: string): { category: Category; confidenceBoost: number } {
  const t = text.toLowerCase();
  if (/\b(childcare|babysit|watch (my|the) kids|daycare)\b/.test(t)) {
    return { category: 'childcare', confidenceBoost: 0.2 };
  }
  if (/\b(elder|elderly|senior transport)\b/.test(t)) {
    return { category: 'elder_transport', confidenceBoost: 0.15 };
  }
  if (/\b(ride|drive|jummah|jumuah|carpool|lift|drop.?off|pick.?up)\b/.test(t)) {
    return { category: 'ride', confidenceBoost: 0.25 };
  }
  if (/\b(food|grocer|meal|pantry|hungry|iftar|suhoor)\b/.test(t)) {
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
  return { category: 'ride', confidenceBoost: -0.35 };
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
    return `tomorrow ${timeMatch[1]}${timeMatch[2]}–${next}${timeMatch[2]}`;
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

function detectLocation(text: string): string {
  const near = text.match(/\b(?:near|at|around|by)\s+([^,.]+)/i);
  if (near) return near[1].trim();
  if (/icpc|masjid|derrom/i.test(text)) return 'near ICPC';
  if (/main ave|main street/i.test(text)) return 'near Main Ave';
  if (/eastside/i.test(text)) return 'near Eastside Park';
  if (/university|college|passaic/i.test(text)) return 'near the university';
  return 'Paterson area';
}

function detectPreference(text: string): string | null {
  if (/same.?gender|sister|brother only|female helper|male helper/i.test(text)) {
    const m = text.match(/(same-gender helper|female helper|male helper|sister|brother only)/i);
    return m ? m[0].toLowerCase() : 'prefers same-gender helper';
  }
  return null;
}

/** Mock AI parse with fake latency — no paid LLM. */
export async function mockParseRequest(rawText: string): Promise<ParsedRequest> {
  await delay(900 + Math.floor(Math.random() * 500));

  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      category: 'ride',
      urgency: 'scheduled',
      time_window: 'flexible',
      location_text: 'Paterson area',
      preference: null,
      confidence: 0.2,
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
  };
}
