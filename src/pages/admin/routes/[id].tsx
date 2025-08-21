// Chakra imports
import { useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Input,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import AreYouSureAlert from "components/alert/AreYouSureAlert";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  defaultRoute,
  DELETE_ROUTE_MUTATION,
  GET_ROUTE_QUERY,
  UPDATE_ROUTE_MUTATION,
} from "graphql/route";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function RouteEdit() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  //  const textColorSecondary = "gray.400";
  const [route, setRoute] = useState(defaultRoute);
  const router = useRouter();
  const { id } = router.query;

  const {
    loading: routeLoading,
    // data: routeData,
    // refetch: getRoute,
  } = useQuery(GET_ROUTE_QUERY, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      if (data?.route == null) {
        router.push("/admin/routes");
      }
      setRoute({ ...route, ...data?.route });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [handleUpdateRoute, {}] = useMutation(UPDATE_ROUTE_MUTATION, {
    variables: {
      input: route,
    },
    onCompleted: () => {
      toast({
        title: "Route updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteRoute, {}] = useMutation(DELETE_ROUTE_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: () => {
      toast({
        title: "Route deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/routes");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "97px", xl: "97px" }}>
        {/* Main Fields */}
        <Grid>
          {!routeLoading && (
            <FormControl>
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="8px"
              >
                Name
              </FormLabel>
              <Input
                isRequired={true}
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                type="text"
                name="name"
                value={route.name}
                onChange={(e) =>
                  setRoute({ ...route, [e.target.name]: e.target.value })
                }
                placeholder="John"
                mb="24px"
                fontWeight="500"
                size="lg"
              />
              <Button
                fontSize="sm"
                variant="brand"
                fontWeight="500"
                w="100%"
                h="50"
                mb="24px"
                onClick={() => handleUpdateRoute()}
                isLoading={routeLoading}
              >
                Update
              </Button>
              <AreYouSureAlert onDelete={handleDeleteRoute}></AreYouSureAlert>
            </FormControl>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default RouteEdit;
