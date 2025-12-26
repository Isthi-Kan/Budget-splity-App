import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GroupSummary } from "../../../../types";
import { styles } from "../styles";

interface InsightsProps {
  summary: GroupSummary | null;
}

export const Insights = ({ summary }: InsightsProps) => {
  return (
    <View style={styles.section}>
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.statsGrid}
      >
        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons name="receipt-outline" size={20} color="#DAA520" />
          </View>
          <Text style={styles.statLabel}>Total Bills</Text>
          <Text style={styles.statValue}>{summary?.totalExpenses || 0}</Text>
        </View>
        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons name="cash-outline" size={20} color="#059669" />
          </View>
          <Text style={styles.statLabel}>Total Spend</Text>
          <Text style={styles.statValue}>
            Rs {(summary?.totalAmount || 0).toFixed(0)}
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        style={{ marginTop: 24 }}
      >
        <Text style={styles.sectionTitle}>Top Spenders</Text>
        {summary?.topSpenders?.length === 0 ? (
          <Text style={styles.emptyText}>No data available yet.</Text>
        ) : (
          summary?.topSpenders?.slice(0, 3).map((spender, index) => (
            <View key={spender.uid} style={styles.listCard}>
              <View
                style={[
                  styles.listIconContainer,
                  { backgroundColor: index === 0 ? "#fffef3" : "#f8fafc" },
                ]}
              >
                <Ionicons
                  name={index === 0 ? "trophy" : "person-outline"}
                  size={20}
                  color={index === 0 ? "#DAA520" : "#64748b"}
                />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>
                  {spender.name || (spender as any).email || spender.uid}
                </Text>
                {(() => {
                  const title = spender.name || "";
                  const email = (spender as any).email || "";
                  if (email && email !== title) {
                    return <Text style={styles.listSubtitle}>{email}</Text>;
                  }
                  if (!title && email) {
                    const local = email.split("@")[0];
                    return <Text style={styles.listSubtitle}>{local}</Text>;
                  }
                  return null;
                })()}
              </View>
              <Text style={styles.listValue}>
                Rs {spender.amount.toFixed(0)}
              </Text>
            </View>
          ))
        )}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(500).springify()}
        style={{ marginTop: 24 }}
      >
        <Text style={styles.sectionTitle}>By Category</Text>
        {Object.entries(summary?.expensesByCategory || {}).map(
          ([category, amount]) => (
            <View key={category} style={styles.listCard}>
              <View style={styles.listIconContainer}>
                <Ionicons name="pricetag-outline" size={18} color="#DAA520" />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{category}</Text>
              </View>
              <Text style={styles.listValue}>Rs {amount.toFixed(0)}</Text>
            </View>
          )
        )}
      </Animated.View>
    </View>
  );
};
