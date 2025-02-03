import { Center, Spinner } from "@chakra-ui/react";
import { Box, SimpleGrid } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import React, { useEffect } from "react";

export default function Home() {
  const cookies = parseCookies();
  const token = cookies.access_token ? cookies.access_token : null;
  const router = useRouter();

  useEffect(() => {
    if (token !== null) {
      router.push("/admin/dashboard");
    } else {
      router.push("/auth/login");
    }
  });

  return (
    <div>
      <Center h="100vh">
        <SimpleGrid columns={1}>
          <Box>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
            />
          </Box>
        </SimpleGrid>
      </Center>
    </div>
  );
}
