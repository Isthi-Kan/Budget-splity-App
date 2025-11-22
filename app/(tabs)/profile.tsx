import { View, Text, Button } from "react-native";
import { logoutUser } from "../../firebase/auth";

export default function Profile() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Profile</Text>
      <Button title="Logout" onPress={logoutUser} />
    </View>
  );
}
