import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts, radii } from '@/constants/theme';
import { categoryLabel, formatConfidence } from '@/lib/format';
import { mockParseRequest } from '@/lib/mockParse';
import { useBarakahStore } from '@/store/barakahStore';
import type { ParsedRequest, Urgency } from '@/types/barakah';
import { ALL_CATEGORIES } from '@/types/barakah';

const CONFIDENCE_THRESHOLD = 0.6;

export default function RequestScreen() {
  const insets = useSafeAreaInsets();
  const submitRequest = useBarakahStore((s) => s.submitRequest);

  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [parsed, setParsed] = useState<ParsedRequest | null>(null);
  const [manualCategory, setManualCategory] = useState(false);

  async function runParse() {
    setParsing(true);
    try {
      const result = await mockParseRequest(rawText);
      setParsed(result);
      setManualCategory(result.confidence < CONFIDENCE_THRESHOLD);
    } finally {
      setParsing(false);
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

  const needsCustomLabel =
    parsed?.category === 'other' && !parsed.customLabel?.trim();

  return (
    <View style={styles.root}>
      <GeometricBackdrop />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 20,
            gap: 14,
          }}
          keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <Text style={styles.title}>Request help</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          <GlassCard strong>
            <Text style={styles.label}>What’s needed?</Text>
            <TextInput
              value={rawText}
              onChangeText={setRawText}
              multiline
              placeholder="Need a ride to Jummah tomorrow around 1pm, near the masjid"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <PillButton
              label={parsing ? 'Reading...' : 'Parse with Barakah AI'}
              onPress={runParse}
              disabled={parsing || !rawText.trim()}
              style={{ marginTop: 12 }}
            />
            {parsing ? (
              <View style={styles.parsing}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.parsingText}>Reading your request...</Text>
              </View>
            ) : null}
          </GlassCard>

          {parsed ? (
            <GlassCard>
              <Text style={styles.section}>Check the parsed fields</Text>
              <Text style={styles.meta}>
                Confidence {formatConfidence(parsed.confidence)}
                {manualCategory ? '. Low confidence; pick a category.' : ''}
              </Text>

              {(manualCategory || true) && (
                <View style={styles.chips}>
                  {ALL_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
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
                        color={parsed.category === cat ? colors.onPrimary : colors.primaryDark}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          parsed.category === cat && styles.chipTextOn,
                        ]}>
                        {categoryLabel(cat)}
                        {cat === 'childcare' || cat === 'elder_transport' ? ' · T3' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {parsed.category === 'other' ? (
                <View style={styles.otherBox}>
                  <Text style={styles.otherTitle}>Tell us what you need</Text>
                  <Text style={styles.otherHint}>
                    Not everything fits a category. Describe it in a few words and it goes
                    out to verified helpers the same way.
                  </Text>
                  <TextInput
                    value={parsed.customLabel ?? ''}
                    onChangeText={(customLabel) => updateParsed({ customLabel })}
                    placeholder="e.g. help arranging a janazah"
                    placeholderTextColor={colors.textMuted}
                    style={styles.fieldInput}
                    maxLength={80}
                  />
                </View>
              ) : null}

              <Field
                label="Urgency"
                value={parsed.urgency}
                onToggle={() =>
                  updateParsed({
                    urgency: (parsed.urgency === 'immediate' ? 'scheduled' : 'immediate') as Urgency,
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
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.fieldInput}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text, letterSpacing: -0.5 },
  close: { fontFamily: fonts.semibold, fontSize: 16, color: colors.primary },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, marginBottom: 8 },
  input: {
    minHeight: 110,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
  parsing: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  parsingText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  section: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.overlay,
  },
  chipOn: { backgroundColor: colors.primary },
  chipLocked: { borderWidth: 1, borderColor: colors.warningSoft },
  chipText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: colors.onPrimary },
  field: { marginTop: 12 },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  fieldValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, marginTop: 4 },
  fieldInput: {
    marginTop: 4,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  otherBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  otherTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  otherHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 17,
  },
  warn: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.warning,
    marginTop: 12,
    lineHeight: 18,
  },
});
