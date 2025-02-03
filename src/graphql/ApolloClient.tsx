import {
  ApolloClient,
  HttpOptions,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { parseCookies } from "nookies";
import { useMemo } from "react";

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

const createLink = (opts: HttpOptions = {}) => {
  return createUploadLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
    ...opts,
  });
};

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    // link: new HttpLink({
    //   uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
    // }),
    link: createLink(),
    cache: new InMemoryCache({ addTypename: false }),
  });
}

export function initializeApollo(initialState = {}) {
  const _apolloClient = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();
    // Restore the cache using the data passed from getStaticProps/getServerSideProps
    // combined with the existing cached data
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;
  setAuthToken();
  return _apolloClient;
}

export function useApollo(initialState: NormalizedCacheObject) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}

export const setAuthToken = () => {
  const cookies = parseCookies();
  const token = cookies.access_token ? cookies.access_token : "";

  const options: HttpOptions = {
    headers: {
      Authorization: token ? `Bearer ${token}` : null,
    },
  };

  apolloClient.setLink(createLink(options));
};
