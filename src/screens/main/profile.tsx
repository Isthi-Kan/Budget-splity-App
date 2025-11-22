import { Button, Text, View } from "react-native";
import { logoutUser } from "../../services/firebase/auth";

export default function Profile() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Profile</Text>
      <Button title="Logout" onPress={logoutUser} />
    </View>
  );
}
