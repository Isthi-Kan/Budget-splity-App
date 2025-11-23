import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-group"
        options={{
          headerShown: true,
          title: "Create Group",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="group/[id]"
        options={{
          headerShown: true,
          title: "Group Details",
        }}
      />
    </Stack>
  );
}
