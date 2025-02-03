import "styles/Fonts.css";
import "styles/App.css";
import "styles/Components.css";
import "styles/Contact.css";
import "styles/Elements.css";
import "@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css";
import "react-calendar/dist/Calendar.css";
import "styles/MiniCalendar.css";
import "styles/DatePickerCalendar.css";

import { ApolloProvider } from "@apollo/client";
import { useApollo } from "graphql/ApolloClient";
import { AppProps } from "next/app";
import Head from "next/head";
import React from "react";
import { Provider } from "react-redux";
import { store } from "store/store";

import { Chakra } from "../Chakra";

// Handle FA6 quirks in NextJS: https://fontawesome.com/docs/web/use-with/react/use-with#getting-font-awesome-css-to-work
// import { config } from "@fortawesome/fontawesome-svg-core";
const { library, config } = require("@fortawesome/fontawesome-svg-core");
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

// Set up FA6 Pro icon access
// import { library } from "@fortawesome/fontawesome-svg-core";
import { fal } from "@fortawesome/pro-light-svg-icons";
import { far } from "@fortawesome/pro-regular-svg-icons";
import { fas } from "@fortawesome/pro-solid-svg-icons";
library.add(fas, far, fal);

function MyApp({ Component, pageProps }: AppProps) {
  const apolloClient = useApollo(pageProps.initialApolloState);
  const title = `${process.env.NEXT_PUBLIC_APP_NAME} UI Dashboard`;

  return (
    <ApolloProvider client={apolloClient}>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <Provider store={store}>
        <Chakra cookies={pageProps.cookies}>
          <Component {...pageProps} />
        </Chakra>
      </Provider>
    </ApolloProvider>
  );
}

export default MyApp;

export { getServerSideProps } from "../Chakra";
