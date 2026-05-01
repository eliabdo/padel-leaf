import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fetchCourts, type Court } from "./src/lib/api";
import BookingScreen from "./src/screens/BookingScreen";
import ConfirmationScreen from "./src/screens/ConfirmationScreen";

export type RootStackParamList = {
  Booking: { courts: Court[] };
  Confirmation: {
    bookingId: number;
    courtName: string;
    startsAtIso: string;
    durationMinutes: number;
    customerName: string;
    paymentMethod: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const FOREST = "#2D5016";
const CREAM = "#FAF8F3";

export default function App() {
  const [courts, setCourts] = useState<Court[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourts()
      .then(setCourts)
      .catch(() => setError("Could not load courts. Check your connection."));
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!courts) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={FOREST} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Booking"
        screenOptions={{
          headerStyle: { backgroundColor: FOREST },
          headerTintColor: CREAM,
          headerTitleStyle: { fontWeight: "700", fontSize: 17 },
          headerBackTitle: "Back",
          contentStyle: { backgroundColor: CREAM },
        }}
      >
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          initialParams={{ courts }}
          options={{ title: "Reserve a Court" }}
        />
        <Stack.Screen
          name="Confirmation"
          component={ConfirmationScreen}
          options={{
            title: "Confirmed",
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: FOREST,
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.7,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
