import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Replace the uri property with the following:
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql', // Get GraphQL endpoint from env
  credentials: 'include',
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
