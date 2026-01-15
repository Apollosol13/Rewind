import { Redirect } from 'expo-router';

export default function Index() {
  // The _layout will handle auth check and redirect appropriately
  return <Redirect href="/auth" />;
}
