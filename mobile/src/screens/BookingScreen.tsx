import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import {
  next14Days, dateOnlyKey, formatTime, ALLOWED_DURATIONS, Duration,
} from "../lib/booking";
import { fetchAvailability, createBooking, Court, AvailabilityResp } from "../lib/api";

const G = {
  forest:    "#1a3d2b",
  forestMid: "#16a34a",
  cream:     "#f8f5ef",
  sage:      "#e8f0eb",
  charcoal:  "#1f2937",
  soft:      "#6b7280",
  border:    "rgba(22,163,74,0.18)",
  red:       "#e8192c",
  yellow:    "#fede00",
};

type Props = NativeStackScreenProps<RootStackParamList, "Booking">;

export default function BookingScreen({ navigation, route }: Props) {
  const { courts } = route.params;
  const dates = next14Days();

  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [duration, setDuration]         = useState<Duration>(90);
  const [courtId, setCourtId]           = useState<number>(courts[0]?.id ?? 0);
  const [availability, setAvailability] = useState<AvailabilityResp | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"venue"|"whish"|"omt">("venue");
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const data = await fetchAvailability(dateOnlyKey(selectedDate), duration);
      setAvailability(data);
    } catch {
      setAvailability(null);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, duration]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const courtAvail = availability?.courts.find((c) => c.id === courtId);

  async function handleConfirm() {
    if (!selectedSlot) return;
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Missing info", "Please fill in your name, email, and phone.");
      return;
    }
    setSubmitting(true);
    try {
      const { id } = await createBooking({
        courtId,
        startsAtIso: selectedSlot,
        durationMinutes: duration,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        paymentMethod,
      });
      navigation.replace("Confirmation", {
        bookingId: id,
        courtName: courts.find((c) => c.id === courtId)?.name ?? "",
        startsAtIso: selectedSlot,
        durationMinutes: duration,
        paymentMethod,
        customerName: name.trim(),
      });
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const COURT_COLORS: Record<string, string> = {
    Laurel: "#15803d", Oak: "#b45309", Olive: "#0369a1",
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: G.cream }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>PADEL LEAF</Text>
          <Text style={styles.heroTitle}>Reserve a Court</Text>
          <Text style={styles.heroSub}>Mezher, Bsalim · Outdoor · 3 courts</Text>
        </View>

        {/* DATE */}
        <Section label="Date">
          <View style={styles.dateGrid}>
            {dates.map((d) => {
              const key = dateOnlyKey(d);
              const isSel = dateOnlyKey(selectedDate) === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.dateCell, isSel && styles.dateCellSel]}
                  onPress={() => setSelectedDate(d)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dateDow, isSel && styles.textCream]}>
                    {d.toLocaleDateString("en-GB", { weekday: "short" })}
                  </Text>
                  <Text style={[styles.dateNum, isSel && styles.textCream]}>
                    {d.getDate()}
                  </Text>
                  <Text style={[styles.dateMon, isSel && styles.textCreamSoft]}>
                    {d.toLocaleDateString("en-GB", { month: "short" })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* DURATION */}
        <Section label="Duration">
          <View style={styles.row}>
            {ALLOWED_DURATIONS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.pill, duration === m && styles.pillSel]}
                onPress={() => setDuration(m as Duration)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, duration === m && styles.textCream]}>
                  {m} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* COURT */}
        <Section label="Court">
          <View style={styles.row}>
            {courts.map((c) => {
              const isSel = courtId === c.id;
              const color = COURT_COLORS[c.name] ?? G.forestMid;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pill, isSel && { backgroundColor: color, borderColor: color }]}
                  onPress={() => { setCourtId(c.id); setSelectedSlot(null); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pillText, isSel && styles.textCream]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* TIME SLOTS */}
        <Section label="Time">
          {loadingSlots ? (
            <ActivityIndicator color={G.forestMid} style={{ marginVertical: 12 }} />
          ) : courtAvail?.allBlocked ? (
            <View style={styles.blockedBox}>
              <Text style={styles.blockedText}>🚫 Court unavailable for this date</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {(courtAvail?.slots ?? []).map((s) => {
                const isSel = s.startIso === selectedSlot;
                return (
                  <TouchableOpacity
                    key={s.startIso}
                    style={[
                      styles.slotCell,
                      !s.available && styles.slotUnavailable,
                      isSel && styles.slotSel,
                    ]}
                    onPress={() => s.available && setSelectedSlot(s.startIso)}
                    activeOpacity={s.available ? 0.75 : 1}
                    disabled={!s.available}
                  >
                    <Text style={[
                      styles.slotText,
                      !s.available && styles.slotTextUnavail,
                      isSel && styles.textCream,
                    ]}>
                      {formatTime(new Date(s.startIso))}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Section>

        {/* CONFIRM CARD — only after slot picked */}
        {selectedSlot && (
          <View style={styles.card}>
            {/* Payment method */}
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.payRow}>
              <TouchableOpacity
                style={[styles.payBtn, paymentMethod === "venue" && styles.payBtnForest]}
                onPress={() => setPaymentMethod("venue")}
                activeOpacity={0.8}
              >
                <Text style={[styles.payBtnText, paymentMethod === "venue" && styles.textCream]}>
                  💵  Pay at Venue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payBtn, paymentMethod === "whish" && { backgroundColor: G.red, borderColor: G.red }]}
                onPress={() => setPaymentMethod("whish")}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: "https://padel-leaf.vercel.app/whish-icon.png" }}
                  style={styles.payIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payBtn, paymentMethod === "omt" && { backgroundColor: G.yellow, borderColor: G.yellow }]}
                onPress={() => setPaymentMethod("omt")}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: "https://padel-leaf.vercel.app/omt-logo.svg" }}
                  style={styles.omtLogo}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            {paymentMethod === "whish" && (
              <Text style={styles.payNote}>
                You will receive Whish payment instructions by email after booking.
              </Text>
            )}
            {paymentMethod === "omt" && (
              <Text style={[styles.payNote, { color: "#92400e", backgroundColor: "#fffbeb", borderColor: "rgba(254,222,0,0.50)" }]}>
                You will receive OMT Pay instructions by email after booking.
              </Text>
            )}

            {/* Contact info */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Your Details</Text>
            <Field label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Ahmad Khalil" />
            <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+961 xx xxx xxx" keyboardType="phone-pad" />
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.confirmBtnText}>Confirm Reservation →</Text>
              }
            </TouchableOpacity>

            <Text style={styles.policy}>
              Free cancellation up to 24 hours before your session.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: any; autoCapitalize?: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "words"}
        style={[styles.input, focused && styles.inputFocused]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: G.cream },
  container: { paddingBottom: 24 },

  hero: {
    backgroundColor: G.forest,
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  heroLabel: { color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: 3, fontWeight: "700", marginBottom: 8 },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  heroSub:   { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 6 },

  section:      { paddingHorizontal: 20, paddingTop: 24 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: G.forestMid, textTransform: "uppercase", marginBottom: 12 },

  // Date grid
  dateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dateCell: {
    width: "22%", paddingVertical: 10, borderRadius: 12,
    backgroundColor: "#fff", borderWidth: 1, borderColor: G.border,
    alignItems: "center", justifyContent: "center",
  },
  dateCellSel: { backgroundColor: G.forest, borderColor: G.forest },
  dateDow:  { fontSize: 9, fontWeight: "700", color: G.soft, textTransform: "uppercase", letterSpacing: 0.5 },
  dateNum:  { fontSize: 18, fontWeight: "800", color: G.charcoal, marginVertical: 2 },
  dateMon:  { fontSize: 9, color: G.soft },
  textCream:     { color: "#fff" },
  textCreamSoft: { color: "rgba(255,255,255,0.65)" },

  // Pills
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#fff", borderWidth: 1, borderColor: G.border,
  },
  pillSel:  { backgroundColor: G.forest, borderColor: G.forest },
  pillText: { fontSize: 14, fontWeight: "600", color: G.charcoal },

  // Slots
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotCell: {
    width: "30%", paddingVertical: 12, borderRadius: 10,
    backgroundColor: "#fff", borderWidth: 1, borderColor: G.border,
    alignItems: "center",
  },
  slotSel:         { backgroundColor: G.forest, borderColor: G.forest },
  slotUnavailable: { backgroundColor: "#f3f4f6", borderColor: "rgba(0,0,0,0.06)", opacity: 0.5 },
  slotText:        { fontSize: 13, fontWeight: "600", color: G.charcoal },
  slotTextUnavail: { textDecorationLine: "line-through", color: G.soft },
  blockedBox: {
    padding: 16, borderRadius: 12,
    backgroundColor: "rgba(220,38,38,0.06)", borderWidth: 1, borderColor: "rgba(220,38,38,0.20)",
  },
  blockedText: { color: "#dc2626", fontSize: 14 },

  // Card
  card: {
    marginHorizontal: 20, marginTop: 24,
    backgroundColor: G.sage, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: G.border,
  },

  // Payment
  payRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  payBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: G.border,
    alignItems: "center", justifyContent: "center",
  },
  payBtnForest: { backgroundColor: G.forest, borderColor: G.forest },
  payBtnText:   { fontSize: 12, fontWeight: "600", color: G.charcoal },
  payIcon:  { width: 28, height: 28, borderRadius: 14 },
  omtLogo:  { width: 48, height: 20 },
  payNote: {
    fontSize: 11, color: "#b91c1c", backgroundColor: "#fff5f5",
    borderWidth: 1, borderColor: "rgba(232,25,44,0.20)",
    borderRadius: 10, padding: 10, marginBottom: 4, lineHeight: 17,
  },

  // Form
  fieldLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: G.forestMid, textTransform: "uppercase", marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: G.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: G.charcoal,
  },
  inputFocused: { borderColor: G.forestMid, shadowColor: G.forestMid, shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },

  // Submit
  confirmBtn: {
    backgroundColor: G.forest, borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 8,
    shadowColor: G.forest, shadowOpacity: 0.30, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  policy: { fontSize: 11, color: G.soft, textAlign: "center", marginTop: 12, lineHeight: 16 },
});
