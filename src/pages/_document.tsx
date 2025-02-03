/* eslint-disable @next/next/no-sync-scripts */
import { ColorModeScript } from "@chakra-ui/system";
import { Head, Html, Main, NextScript } from "next/document";
import theme from "theme/theme";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="apple-touch-icon" href="/logo192.png" />
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
        {/* <script
          async
          type="text/javascript"
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places&loading=async`}
        /> */}
      </Head>

      <body id="root">
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
