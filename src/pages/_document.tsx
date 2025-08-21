/* eslint-disable @next/next/no-sync-scripts */
import { Link } from "@chakra-ui/react";
import { ColorModeScript } from "@chakra-ui/system";
import { Head, Html, Main, NextScript } from "next/document";
// import Script from "next/script";
import theme from "theme/theme";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <Link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />

        {/* Add google fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          // crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&family=Montserrat:wght@400;700&display=swap"
          rel="stylesheet"
        ></link>
      </Head>

      <body id="root">
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
