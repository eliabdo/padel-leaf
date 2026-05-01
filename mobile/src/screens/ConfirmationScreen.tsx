import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Confirmation">;

export default function ConfirmationScreen({ route, navigation }: Props) {
  const { bookingId, courtName, startsAtIso, durationMinutes, customerName, paymentMethod } =
    route.params;

  const startDate = new Date(startsAtIso);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const formatDateLong = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const paymentInstructions: Record<string, string> = {
    venue: "Payment is due at the venue on the day of your session.",
    whish: "You will receive Whish payment instructions by email shortly.",
    omt: "You will receive OMT Pay instructions by email shortly.",
  };

  const paymentLabel: Record<string, string> = {
    venue: "💵  Pay at Venue",
    whish: "Whish Money",
    omt: "OMT Pay",
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Icon */}
      <View style={styles.iconWrap}>
        <Text style={styles.checkmark}>✓</Text>
      </View>

      <Text style={styles.heading}>Booking Confirmed!</Text>
      <Text style={styles.subheading}>
        See you on the court, {customerName.split(" ")[0]}.
      </Text>

      {/* Details card */}
      <View style={styles.card}>
        <Row label="Booking ID" value={`#${bookingId}`} />
        <Divider />
        <Row label="Court" value={courtName} />
        <Divider />
        <Row label="Date" value={formatDateLong(startDate)} />
        <Divider />
        <Row
          label="Time"
          value={`${formatTime(startDate)} – ${formatTime(endDate)}`}
        />
        <Divider />
        <Row label="Duration" value={`${durationMinutes} min`} />
        <Divider />
        <Row label="Payment" value={paymentLabel[paymentMethod] ?? paymentMethod} />
      </View>

      {/* Payment instructions */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>{paymentInstructions[paymentMethod]}</Text>
      </View>

      {/* Cancellation note */}
      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          Free cancellation up to 24 hours before your session. Same-day
          cancellations are charged in full.
        </Text>
      </View>

      {/* Back to home */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.popToTop()}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Make Another Booking →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const FOREST = "#2D5016";
const CREAM = "#FAF8F3";
const SAGE = "#8BAD5A";
const CHARCOAL = "#2C2C2C";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: CREAM,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: FOREST,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  checkmark: {
    color: CREAM,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: FOREST,
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    color: CHARCOAL,
    opacity: 0.6,
    marginBottom: 28,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(45,80,22,0.12)",
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 13,
  },
  rowLabel: {
    fontSize: 13,
    color: CHARCOAL,
    opacity: 0.55,
    fontWeight: "500",
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    color: CHARCOAL,
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(45,80,22,0.08)",
  },
  infoBox: {
    width: "100%",
    backgroundColor: "rgba(139,173,90,0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: FOREST,
    lineHeight: 19,
    fontWeight: "500",
  },
  noteBox: {
    width: "100%",
    backgroundColor: "rgba(45,80,22,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(45,80,22,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 32,
  },
  noteText: {
    fontSize: 12,
    color: CHARCOAL,
    opacity: 0.55,
    lineHeight: 18,
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: FOREST,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: CREAM,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
