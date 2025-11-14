import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { TAB_IDENTIFY } from "../navigation/routes";

export default function HomeScreen({ navigation }) {
  const userName = "Ali";

  return (
    <LinearGradient colors={["#FFFFFF", "#F7FFED"]} style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userName}</Text>
          <Text style={styles.tagline}>Discover Sarawak's Biodiversity</Text>
        </View>
      </View>

      {/* Main Action Cards */}
      <View style={styles.cardsContainer}>
        {/* Primary Action - Identify Plants */}
        <TouchableOpacity
          style={styles.primaryCard}
          onPress={() => navigation.navigate(TAB_IDENTIFY)}
        >
          <LinearGradient 
            colors={["#F6EFB9", "#E3E59B"]} 
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardText}>
                <Text style={styles.primaryTitle}>Identify Plants</Text>
                <Text style={styles.primarySubtitle}>Snap a photo to identify any plant</Text>
              </View>
              <Image
                source={require("../../assets/IdentifyIcon.png")}
                style={styles.primaryIcon}
              />
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardHint}>Tap to start →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary Actions Row */}
        <View style={styles.secondaryRow}>
          {/* Heatmap Card */}
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={() => navigation.navigate("Heatmap")}
          >
            <LinearGradient 
              colors={["#9C9872", "#B1AD8B"]} 
              style={styles.cardGradient}
            >
              <View style={styles.secondaryContent}>
                <Image
                  source={require("../../assets/MapIcon.png")}
                  style={styles.secondaryIcon}
                />
                <Text style={styles.secondaryTitle}>Explore Heatmap</Text>
                <Text style={styles.secondaryDescription}>View plant observations</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Discover Card */}
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={() => navigation.navigate("Search")}
          >
            <LinearGradient 
              colors={["#A5C8A3", "#7FB97D"]} 
              style={styles.cardGradient}
            >
              <View style={styles.secondaryContent}>
                <Image
                  source={require("../../assets/FavoriteIcon.png")}
                  style={styles.secondaryIcon}
                />
                <Text style={styles.secondaryTitle}>Discover More</Text>
                <Text style={styles.secondaryDescription}>Browse plant species</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features Section with MUI Icons */}
      <View style={styles.featuresSection}>
        <View style={styles.featureItem}>
          <Ionicons name="leaf" size={18} color="#2F6C4F" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Rich Biodiversity</Text>
            <Text style={styles.featureDescription}>Explore Sarawak's unique plant species</Text>
          </View>
        </View>
        
        <View style={styles.featureDivider} />
        
        <View style={styles.featureItem}>
          <Ionicons name="pulse" size={18} color="#2F6C4F" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Real-time Data</Text>
            <Text style={styles.featureDescription}>Access current plant observations</Text>
          </View>
        </View>
        
        <View style={styles.featureDivider} />
        
        <View style={styles.featureItem}>
          <Ionicons name="time" size={18} color="#2F6C4F" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>24/7 Available</Text>
            <Text style={styles.featureDescription}>Identify plants anytime, anywhere</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    marginTop: 10,
    marginBottom: 25, 
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#244332",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "flex-start",
    gap: 20,
    marginBottom: 10,
  },
  primaryCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    height: 180, 
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 16,
    height: 160, 
  },
  secondaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 22, 
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardText: {
    flex: 1,
  },
  primaryTitle: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#2F3E46",
    marginBottom: 6,
  },
  primarySubtitle: {
    fontSize: 15, 
    color: "#4A5568",
    fontWeight: "500",
  },
  primaryIcon: {
    width: 105, 
    height: 85, 
    resizeMode: "contain",
  },
  cardFooter: {
    marginTop: 12,
  },
  cardHint: {
    fontSize: 14,
    color: "#2F3E46",
    fontWeight: "600",
    opacity: 0.8,
  },
  secondaryContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10, 
  },
  secondaryIcon: {
    width: 45, 
    height: 45, 
    resizeMode: "contain",
  },
  secondaryTitle: {
    fontSize: 17, 
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  secondaryDescription: {
    fontSize: 13, 
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.9,
  },
  featuresSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  featureText: {
    flex: 1,
    marginLeft: 10,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#244332",
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    lineHeight: 14,
  },
  featureDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 6,
  },
});