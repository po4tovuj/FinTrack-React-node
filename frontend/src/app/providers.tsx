'use client';

import { ApolloProvider } from '@apollo/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SessionProvider } from 'next-auth/react';
import { apolloClient } from '@/lib/apollo';
import { store, persistor } from '@/store';
import { useState, useEffect } from 'react';

/**
 * Providers component that wraps the entire application with necessary context providers
 * - Redux Provider for state management
 * - PersistGate for Redux persistence (with SSR safety)
 * - Apollo Provider for GraphQL client
 * - SessionProvider for NextAuth authentication
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // On server-side, render without PersistGate to avoid hydration issues
  if (!isClient) {
    return (
      <SessionProvider>
        <Provider store={store}>
          <ApolloProvider client={apolloClient}>
            {children}
          </ApolloProvider>
        </Provider>
      </SessionProvider>
    );
  }

  // On client-side, use PersistGate for persistence
  return (
    <SessionProvider>
      <Provider store={store}>
        <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
          <ApolloProvider client={apolloClient}>
            {children}
          </ApolloProvider>
        </PersistGate>
      </Provider>
    </SessionProvider>
  );
}