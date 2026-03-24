import AsyncStorage from "@react-native-async-storage/async-storage";

export const checkIfFirstLaunch = async () => {
  const value = await AsyncStorage.getItem("hasSeenWelcome");

  if (value === null) {
    // First time ever opening app
    await AsyncStorage.setItem("hasSeenWelcome", "true");
    return true;
  }

  return false;
};