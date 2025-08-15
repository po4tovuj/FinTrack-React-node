import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getSession } from 'next-auth/react';

/**
 * HTTP link for GraphQL endpoint
 */
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

/**
 * Auth link to add JWT token to requests
 */
const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from NextAuth session
  const session = await getSession();
  
  return {
    headers: {
      ...headers,
      authorization: session?.accessToken ? `Bearer ${session.accessToken}` : '',
    },
  };
});

/**
 * Error link to handle GraphQL and network errors
 */
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.map(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle authentication errors
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // Clear local storage and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/auth/login';
      }
    }
  }
});

/**
 * Apollo Client instance with authentication, error handling, and caching
 */
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        fields: {
          transactions: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          budgets: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Transaction: {
        keyFields: ['id'],
      },
      Budget: {
        keyFields: ['id'],
      },
      Category: {
        keyFields: ['id'],
      },
      Family: {
        keyFields: ['id'],
      },
      ShoppingList: {
        keyFields: ['id'],
        fields: {
          items: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
});