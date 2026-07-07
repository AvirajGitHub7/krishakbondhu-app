import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Root Index Route
 * 
 * This file prevents Expo Router from throwing a 404 "Unmatched Route" error on launch.
 * The actual redirection logic to /onboarding, /login, or /home happens inside _layout.tsx.
 * This component simply displays a loading spinner matching the splash screen background
 * until the _layout.tsx useEffect triggers the router.replace().
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0F3A20" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Match splash screen background color
    justifyContent: 'center',
    alignItems: 'center',
  },
});
