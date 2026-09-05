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
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';
import { colors, fonts, radii } from '@/constants/theme';
import { categoryEmoji, categoryLabel, formatConfidence } from '@/lib/format';
import { mockParseRequest } from '@/lib/mockParse';
import { useBarakahStore } from '@/store/barakahStore';
import type { Category, ParsedRequest, Urgency } from '@/types/barakah';
import { ALL_CATEGORIES } from '@/types/barakah';

const CONFIDENCE_THRESHOLD = 0.6;

export default function RequestScreen() {
  const insets = useSafeAreaInsets();
  const submitRequest = useBarakahStore((s) => s.submitRequest);

  const [rawText, setRawText] = useState(
    'Need a ride to Jummah tomorrow around 1pm, near ICPC'
  );
  const [parsing, setParsing] = useState(false);
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

  function onSubmit() {
    if (!parsed) return;
    const id = submitRequest(rawText, parsed);
    router.replace(`/request/${id}`);
  }

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
              placeholder="e.g. Need a ride to Jummah tomorrow near ICPC…"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <PillButton
              label={parsing ? 'Reading…' : 'Parse with Barakah AI'}
              onPress={runParse}
              disabled={parsing || !rawText.trim()}
              style={{ marginTop: 12 }}
            />
            {parsing ? (
              <View style={styles.parsing}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.parsingText}>Barakah AI is reading your request…</Text>
              </View>
            ) : null}
          </GlassCard>

          {parsed ? (
            <GlassCard>
              <Text style={styles.section}>Review parsed fields</Text>
              <Text style={styles.meta}>
                Confidence {formatConfidence(parsed.confidence)}
                {manualCategory ? ' · low confidence — pick a category' : ''}
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
                      <Text
                        style={[
                          styles.chipText,
                          parsed.category === cat && styles.chipTextOn,
                        ]}>
                        {categoryEmoji[cat]} {categoryLabel(cat)}
                        {cat === 'childcare' || cat === 'elder_transport' ? ' · T3' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

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
                  Tier 3 / ICPC only in this MVP — you can still submit as a roadmap demo, but
                  peer helpers won’t fulfill it.
                </Text>
              )}

              <PillButton label="Submit request" onPress={onSubmit} style={{ marginTop: 14 }} />
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(26,35,50,0.06)',
  },
  chipOn: { backgroundColor: colors.primary },
  chipLocked: { borderWidth: 1, borderColor: 'rgba(216,155,44,0.45)' },
  chipText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: '#fff' },
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
  warn: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.warning,
    marginTop: 12,
    lineHeight: 18,
  },
});
