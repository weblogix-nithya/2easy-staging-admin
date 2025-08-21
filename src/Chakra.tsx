import {
  cookieStorageManagerSSR,
  localStorageManager,
} from "@chakra-ui/color-mode";
import { 
  ChakraProvider} from "@chakra-ui/react";
import { GetServerSidePropsContext } from "next";
import { ReactNode } from "react";
import theme from "theme/theme";


interface ChakraProps {
  cookies?: string;
  children: ReactNode;
}

export const Chakra = ({ children, cookies }: ChakraProps) => {
  const colorModeManager =
  typeof cookies === "string"
    ? cookieStorageManagerSSR(cookies)
    : localStorageManager;
  return (
    <ChakraProvider theme={theme} colorModeManager={colorModeManager}>
    {children}
  </ChakraProvider>
  );
};

export type ServerSideProps<T> = { props: T } | Promise<{ props: T }>;

export function getServerSideProps({
  req,
}: GetServerSidePropsContext): ServerSideProps<{ cookies?: string }> {
  return {
    props: {
      cookies: req.headers.cookie ?? "",
    },
  };
}
