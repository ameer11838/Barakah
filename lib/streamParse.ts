import { categoryLabel } from '@/lib/format';
import { mockParseRequest } from '@/lib/mockParse';
import type { ParsedRequest } from '@/types/barakah';

/**
 * Streaming presentation of the parse.
 *
 * The parse itself is unchanged — mockParseRequest is still the single source
 * of truth for what a request means. What changes is the delivery: instead of
 * a spinner that hides a fixed delay and then dumps six fields at once, the
 * reasoning is narrated token by token and each field settles as it is
 * decided.
 *
 * The one genuinely useful trick here is that the parse promise is started
 * before the first token is emitted, so the narration plays *during* the
 * latency rather than after it. That is how real streaming endpoints behave,
 * and it means the animation costs almost nothing in wall-clock time.
 */

export type StreamField =
  | 'category'
  | 'urgency'
  | 'time_window'
  | 'location_text'
  | 'preference';

export type ParseEvent =
  /** One more token of narration to append to the transcript. */
  | { type: 'token'; text: string }
  /** A field has been decided, with the value to show for it. */
  | { type: 'field'; field: StreamField; value: string }
  /** Final confidence, revealed once the fields are all in. */
  | { type: 'confidence'; value: number }
  | { type: 'done'; parsed: ParsedRequest };

/** Per-token cadence. Fast enough to feel fluent, slow enough to read. */
const TOKEN_MS = 32;
/** Beat between one clause finishing and the next starting. */
const CLAUSE_MS = 190;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Emit a phrase one word at a time, keeping the trailing space. */
async function* speak(phrase: string): AsyncGenerator<ParseEvent> {
  const words = phrase.split(' ');
  for (let i = 0; i < words.length; i++) {
    await wait(TOKEN_MS);
    yield { type: 'token', text: i === 0 ? words[i] : ` ${words[i]}` };
  }
}

/**
 * Narration for a settled parse. Written as short declarative clauses because
 * they stream better than one long sentence — each clause lands with its
 * field.
 */
type Clause = { text: string; field: StreamField; value: string };

function clausesFor(parsed: ParsedRequest): Clause[] {
  const out: Clause[] = [];

  out.push({
    text:
      parsed.category === 'other'
        ? 'No standard category fits, so filing as something else.'
        : `This reads as ${categoryLabel(parsed.category).toLowerCase()}.`,
    field: 'category',
    value:
      parsed.category === 'other'
        ? (parsed.customLabel?.trim() || 'Something else')
        : categoryLabel(parsed.category),
  });

  out.push({
    text:
      parsed.urgency === 'immediate'
        ? 'Treating it as needed right away.'
        : 'Treating it as scheduled, not urgent.',
    field: 'urgency',
    value: parsed.urgency === 'immediate' ? 'Immediate' : 'Scheduled',
  });

  out.push({
    text: `Timing: ${parsed.time_window}.`,
    field: 'time_window',
    value: parsed.time_window,
  });

  out.push({
    text: parsed.location_text
      ? `Near ${parsed.location_text}.`
      : 'No place named, so centring on your area.',
    field: 'location_text',
    value: parsed.location_text || 'Your area',
  });

  if (parsed.preference) {
    out.push({
      text: `Noted a preference: ${parsed.preference}.`,
      field: 'preference',
      value: parsed.preference,
    });
  }

  return out;
}

export async function* streamParse(rawText: string): AsyncGenerator<ParseEvent> {
  // Start the work first, narrate second. The opening line plays over the
  // parse latency instead of being queued behind it.
  const pending = mockParseRequest(rawText);

  yield* speak('Reading your request...');

  const parsed = await pending;

  for (const clause of clausesFor(parsed)) {
    await wait(CLAUSE_MS);
    yield { type: 'token', text: '\n' };
    yield* speak(clause.text);
    yield { type: 'field', field: clause.field, value: clause.value };
  }

  await wait(CLAUSE_MS);
  yield { type: 'confidence', value: parsed.confidence };
  await wait(240);
  yield { type: 'done', parsed };
}
