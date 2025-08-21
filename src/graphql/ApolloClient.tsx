import {
  ApolloClient,
  ApolloLink,
  from,
  HttpOptions,
  InMemoryCache,
  NormalizedCacheObject} from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { destroyCookie, parseCookies } from "nookies";
import { useMemo } from "react";

export let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

const clearAllCookies = () => {
  const cookieNames = [
    "access_token",
    "user_name",
    "user_email",
    "customer_id",
    "driver_id",
    "company_id",
    "is_admin",
    "is_company_admin",
    "user_id",
    "state",
  ];

  // const paths = ["/", "/admin", "/admin/jobs", "*"];

  // cookieNames.forEach(name => {
  //   paths.forEach(path => {
  //   destroyCookie(null, name, { path });
  // });

  
  cookieNames.forEach((name) => {
    destroyCookie(null, name, { path: "/" });
  });

  // Optional: clear localStorage/sessionStorage if you use them
  localStorage.clear();
  sessionStorage.clear();
};

const createLink = (opts: HttpOptions = {}) => {
  return createUploadLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
    credentials: "include",
    fetchOptions: {
      credentials: "include",
    },
    ...opts,
  });
};

function createApolloClient() {
  const uploadLink = createLink();

const errorLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    const { errors } = response;
    const networkError = (response as any).networkError;
    const graphQLErrors = errors;

    if (
      networkError?.message?.includes("401") ||
      graphQLErrors?.some((error: { message: string }) =>
        error.message.toLowerCase().includes("unauthenticated")
      )
    ) {
      // Redirect to login page and pass the current URL as `redirectTo`
      const redirectTo = window.location.pathname + window.location.search;
      
      clearAllCookies(); // Clear cookies upon unauthentication

      apolloClient?.clearStore().then(() => {
        window.location.href = `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`;
      });
    }

    return response;  // Return the response
  });
});

  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: from([errorLink, uploadLink]),
    cache: new InMemoryCache({ addTypename: false }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: "all",
      },
    },
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
  const token = cookies.access_token || "";

  const options: HttpOptions = {
    headers: {
      Authorization: token ? `Bearer ${token}` : null,
    },
  };

  apolloClient.setLink(createLink(options));
};
