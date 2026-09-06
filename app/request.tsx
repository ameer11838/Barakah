import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricBackdrop } from '@/components/GeometricBackdrop';
import { Reveal, STAGGER_MS } from '@/components/motion/Reveal';
import { TypingCaret } from '@/components/motion/TypingCaret';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ConfidenceMeter, CONFIDENCE_THRESHOLD } from '@/components/ui/ConfidenceMeter';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { fonts, radii, type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { categoryLabel } from '@/lib/format';
import { streamParse, type StreamField } from '@/lib/streamParse';
import { useBarakahStore } from '@/store/barakahStore';
import type { ParsedRequest, Urgency } from '@/types/barakah';
import { ALL_CATEGORIES } from '@/types/barakah';

type Phase = 'idle' | 'streaming' | 'done';
type Settled = { field: StreamField; value: string };

const FIELD_LABELS: Record<StreamField, string> = {
  category: 'Category',
  urgency: 'Urgency',
  time_window: 'Time',
  location_text: 'Location',
  preference: 'Preference',
};

export default function RequestScreen() {
  const insets = useSafeAreaInsets();
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const submitRequest = useBarakahStore((s) => s.submitRequest);
  const scrollRef = useRef<ScrollView | null>(null);

  const [rawText, setRawText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [parsed, setParsed] = useState<ParsedRequest | null>(null);
  const [manualCategory, setManualCategory] = useState(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [settled, setSettled] = useState<Settled[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);

  /**
   * Every stream run gets an id. A run whose id is stale — because the user
   * hit parse again, or left the screen — drops its events on the floor
   * instead of writing state into an unmounted component.
   */
  const runIdRef = useRef(0);
  useEffect(() => () => { runIdRef.current += 1; }, []);

  async function runParse() {
    if (!rawText.trim() || phase === 'streaming') return;
    const runId = ++runIdRef.current;

    setPhase('streaming');
    setTranscript('');
    setSettled([]);
    setConfidence(null);
    setParsed(null);

    for await (const event of streamParse(rawText)) {
      if (runIdRef.current !== runId) return;
      switch (event.type) {
        case 'token':
          setTranscript((t) => t + event.text);
          break;
        case 'field':
          setSettled((s) => [...s, { field: event.field, value: event.value }]);
          break;
        case 'confidence':
          setConfidence(event.value);
          break;
        case 'done':
          setParsed(event.parsed);
          setManualCategory(event.parsed.confidence < CONFIDENCE_THRESHOLD);
          setPhase('done');
          break;
      }
    }
  }

  function updateParsed(patch: Partial<ParsedRequest>) {
    if (!parsed) return;
    setParsed({ ...parsed, ...patch });
  }

  async function onSubmit() {
    if (!parsed || submitting) return;
    // 'Something else' is only meaningful with a description of what it is.
    if (parsed.category === 'other' && !parsed.customLabel?.trim()) return;
    setSubmitting(true);
    try {
      const id = await submitRequest(rawText, parsed);
      router.replace(`/request/${id}`);
    } finally {
      setSubmitting(false);
    }
  }

  const needsCustomLabel = parsed?.category === 'other' && !parsed.customLabel?.trim();
  const streaming = phase === 'streaming';

  return (
    <View style={styles.root}>
      <GeometricBackdrop />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 20,
            gap: 14,
          }}
          // Keep the newest tokens in view without yanking the page once the
          // user is reading a finished parse.
          onContentSizeChange={() => {
            if (streaming) scrollRef.current?.scrollToEnd({ animated: true });
          }}
          keyboardShouldPersistTaps="handled">
          <Reveal style={styles.topBar}>
            <Text style={styles.title}>Request help</Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </Reveal>

          <Reveal delay={STAGGER_MS}>
            <GlassCard strong>
              <Text style={styles.label}>What&rsquo;s needed?</Text>
              <TextInput
                value={rawText}
                onChangeText={setRawText}
                multiline
                placeholder="Need a ride to Jummah tomorrow around 1pm, near the masjid"
                placeholderTextColor={c.textMuted}
                style={styles.input}
              />
              <PillButton
                label={streaming ? 'Reading...' : phase === 'done' ? 'Read again' : 'Parse with Barakah AI'}
                onPress={runParse}
                disabled={streaming || !rawText.trim()}
                style={{ marginTop: 12 }}
              />
            </GlassCard>
          </Reveal>

          {phase !== 'idle' ? (
            <Reveal delay={40}>
              <GlassCard>
                <View style={styles.aiHeader}>
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={13} color={c.primaryDark} />
                  </View>
                  <Text style={styles.aiTitle}>Barakah AI</Text>
                  {streaming ? <Text style={styles.aiState}>reading</Text> : null}
                </View>

                <Text style={styles.transcript}>
                  {transcript}
                  {streaming ? <TypingCaret /> : null}
                </Text>

                {settled.length ? (
                  <View style={styles.settledWrap}>
                    {settled.map((s, i) => (
                      // Keyed by field so each row animates in exactly once,
                      // on the beat its clause finished.
                      <Reveal key={s.field} delay={0} distance={10} style={styles.settledRow}>
                        <Text style={styles.settledLabel}>{FIELD_LABELS[s.field]}</Text>
                        <Text style={styles.settledValue} numberOfLines={1}>
                          {s.value}
                        </Text>
                        <Ionicons name="checkmark-circle" size={15} color={c.success} />
                      </Reveal>
                    ))}
                  </View>
                ) : null}

                {confidence != null ? <ConfidenceMeter value={confidence} /> : null}
              </GlassCard>
            </Reveal>
          ) : null}

          {phase === 'done' && parsed ? (
            <Reveal delay={STAGGER_MS}>
              <GlassCard>
                <Text style={styles.section}>Check the parsed fields</Text>
                <Text style={styles.meta}>
                  {manualCategory
                    ? 'Low confidence — pick the right category.'
                    : 'Edit anything that looks wrong before sending.'}
                </Text>

                <View style={styles.chips}>
                  {ALL_CATEGORIES.map((cat, i) => (
                    <Reveal key={cat} delay={i * 28} distance={8}>
                      <Pressable
                        onPress={() => updateParsed({ category: cat })}
                        style={[
                          styles.chip,
                          parsed.category === cat && styles.chipOn,
                          (cat === 'childcare' || cat === 'elder_transport') && styles.chipLocked,
                        ]}>
                        <CategoryIcon
                          category={cat}
                          size={14}
                          boxed={false}
                          color={parsed.category === cat ? c.onPrimary : c.primaryDark}
                        />
                        <Text
                          style={[styles.chipText, parsed.category === cat && styles.chipTextOn]}>
                          {categoryLabel(cat)}
                          {cat === 'childcare' || cat === 'elder_transport' ? ' · T3' : ''}
                        </Text>
                      </Pressable>
                    </Reveal>
                  ))}
                </View>

                {parsed.category === 'other' ? (
                  <Reveal distance={10} style={styles.otherBox}>
                    <Text style={styles.otherTitle}>Tell us what you need</Text>
                    <Text style={styles.otherHint}>
                      Not everything fits a category. Describe it in a few words and it goes
                      out to verified helpers the same way.
                    </Text>
                    <TextInput
                      value={parsed.customLabel ?? ''}
                      onChangeText={(customLabel) => updateParsed({ customLabel })}
                      placeholder="e.g. help arranging a janazah"
                      placeholderTextColor={c.textMuted}
                      style={styles.fieldInput}
                      maxLength={80}
                    />
                  </Reveal>
                ) : null}

                <Field
                  label="Urgency"
                  value={parsed.urgency}
                  onToggle={() =>
                    updateParsed({
                      urgency: (parsed.urgency === 'immediate'
                        ? 'scheduled'
                        : 'immediate') as Urgency,
                    })
                  }
                />
                <Editable
                  label="Time window"
                  value={parsed.time_window}
                  onChange={(time_window) => updateParsed({ time_window })}
                />
                <Editable
                  label="Location"
                  value={parsed.location_text}
                  onChange={(location_text) => updateParsed({ location_text })}
                />
                <Editable
                  label="Preference"
                  value={parsed.preference ?? ''}
                  onChange={(preference) =>
                    updateParsed({ preference: preference.trim() ? preference : null })
                  }
                />

                {(parsed.category === 'childcare' || parsed.category === 'elder_transport') && (
                  <Text style={styles.warn}>
                    Childcare and elder transport need a Tier 3 helper — background-checked or
                    on a partner institution&apos;s vetted roster. Neighbours will not be paged
                    for it.
                  </Text>
                )}

                <PillButton
                  label={submitting ? 'Sending...' : 'Submit request'}
                  onPress={onSubmit}
                  disabled={submitting || needsCustomLabel}
                  style={{ marginTop: 14 }}
                />
                {needsCustomLabel ? (
                  <Text style={styles.meta}>Add a short description to send this.</Text>
                ) : null}
              </GlassCard>
            </Reveal>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: string;
  onToggle: () => void;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable onPress={onToggle} style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value} (tap to toggle)</Text>
    </Pressable>
  );
}

function Editable({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.fieldInput}
        placeholderTextColor={c.textMuted}
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontFamily: fonts.bold, fontSize: 28, color: c.text, letterSpacing: -0.5 },
    close: { fontFamily: fonts.semibold, fontSize: 16, color: c.primary },
    label: { fontFamily: fonts.semibold, fontSize: 14, color: c.text, marginBottom: 8 },
    input: {
      minHeight: 110,
      borderRadius: radii.md,
      backgroundColor: c.inputBg,
      padding: 14,
      fontFamily: fonts.regular,
      fontSize: 16,
      color: c.text,
      textAlignVertical: 'top',
    },

    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aiBadge: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
    aiTitle: { fontFamily: fonts.bold, fontSize: 14, color: c.text, flex: 1 },
    aiState: { fontFamily: fonts.medium, fontSize: 12, color: c.primary },
    transcript: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 21,
      color: c.textSecondary,
      marginTop: 10,
      minHeight: 21,
    },
    settledWrap: { marginTop: 12, gap: 6 },
    settledRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: radii.sm,
      backgroundColor: c.panelBg,
    },
    settledLabel: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted, width: 74 },
    settledValue: { fontFamily: fonts.semibold, fontSize: 14, color: c.text, flex: 1 },

    section: { fontFamily: fonts.bold, fontSize: 16, color: c.text },
    meta: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted, marginTop: 4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radii.pill,
      backgroundColor: c.overlay,
    },
    chipOn: { backgroundColor: c.primary },
    chipLocked: { borderWidth: 1, borderColor: c.warningSoft },
    chipText: { fontFamily: fonts.medium, fontSize: 12, color: c.textSecondary },
    chipTextOn: { color: c.onPrimary },
    field: { marginTop: 12 },
    fieldLabel: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted },
    fieldValue: { fontFamily: fonts.semibold, fontSize: 15, color: c.text, marginTop: 4 },
    fieldInput: {
      marginTop: 4,
      borderRadius: radii.sm,
      backgroundColor: c.inputBg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: c.text,
    },
    otherBox: {
      marginTop: 14,
      padding: 12,
      borderRadius: radii.md,
      backgroundColor: c.panelBg,
    },
    otherTitle: { fontFamily: fonts.semibold, fontSize: 14, color: c.text },
    otherHint: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 4,
      marginBottom: 8,
      lineHeight: 17,
    },
    warn: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: c.warning,
      marginTop: 12,
      lineHeight: 18,
    },
  });
