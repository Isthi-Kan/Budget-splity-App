import React from "react";
import { Image, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GroupSummary } from "../../../../types";
import { styles } from "../styles";

interface BalancesProps {
  summary: GroupSummary | null;
}

export const Balances = ({ summary }: BalancesProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Member Status</Text>
      {summary?.balances?.map((balance, index) => (
        <Animated.View
          key={balance.uid}
          entering={FadeInDown.delay(index * 100).springify()}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <View style={styles.balanceAvatar}>
              {balance.photoURL ? (
                <Image
                  source={{ uri: balance.photoURL }}
                  style={{ width: "100%", height: "100%", borderRadius: 12 }}
                />
              ) : (
                <Text style={styles.balanceInitials}>
                  {(
                    balance.name ||
                    balance.displayName ||
                    balance.email ||
                    balance.uid
                  )
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceName} numberOfLines={1}>
                {balance.name ||
                  balance.displayName ||
                  balance.email ||
                  balance.uid}
              </Text>
              {balance.email &&
              balance.email !== (balance.name || balance.displayName || "") ? (
                <Text style={styles.balanceBadgeText} numberOfLines={1}>
                  {balance.email}
                </Text>
              ) : null}
              <View style={styles.balanceBadge}>
                <Text style={styles.balanceBadgeText}>
                  {balance.balance === 0
                    ? "Settled"
                    : balance.balance > 0
                    ? "Owed Money"
                    : "Owing Money"}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.statValue,
                { color: balance.balance >= 0 ? "#059669" : "#dc2626" },
              ]}
            >
              {balance.balance >= 0 ? "+" : "-"}Rs{" "}
              {Math.abs(balance.balance).toFixed(0)}
            </Text>
          </View>

          <View style={styles.balanceStats}>
            <View style={styles.balanceStatItem}>
              <Text style={styles.balanceStatLabel}>Paid</Text>
              <Text style={styles.balanceStatValue}>
                Rs {balance.totalPaid.toFixed(0)}
              </Text>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStatItem}>
              <Text style={styles.balanceStatLabel}>Share</Text>
              <Text style={styles.balanceStatValue}>
                Rs {balance.totalOwes.toFixed(0)}
              </Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};
