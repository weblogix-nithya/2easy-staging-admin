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
  defaultRoutePoint,
  DELETE_ROUTE_POINT_MUTATION,
  GET_ROUTE_POINT_QUERY,
  UPDATE_ROUTE_POINT_MUTATION,
} from "graphql/routePoint";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function RoutePointEdit() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  //  const textColorSecondary = "gray.400";
  const [routePoint, setRoutePoint] = useState(defaultRoutePoint);
  const router = useRouter();
  const { id } = router.query;

  const {
    loading: routePointLoading,
    // data: routePointData,
    // refetch: getRoutePoint,
  } = useQuery(GET_ROUTE_POINT_QUERY, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      if (data?.routePoint == null) {
        router.push("/admin/route-points");
      }
      setRoutePoint({ ...routePoint, ...data?.routePoint });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [handleUpdateRoutePoint, {}] = useMutation(
    UPDATE_ROUTE_POINT_MUTATION,
    {
      variables: {
        input: routePoint,
      },
      onCompleted: () => {
        toast({
          title: "RoutePoint updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const [handleDeleteRoutePoint, {}] = useMutation(
    DELETE_ROUTE_POINT_MUTATION,
    {
      variables: {
        id: id,
      },
      onCompleted: () => {
        toast({
          title: "RoutePoint deleted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        router.push("/admin/route-points");
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "97px", xl: "97px" }}>
        {/* Main Fields */}
        <Grid>
          {!routePointLoading && (
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
                value={routePoint.name}
                onChange={(e) =>
                  setRoutePoint({
                    ...routePoint,
                    [e.target.name]: e.target.value,
                  })
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
                onClick={() => handleUpdateRoutePoint()}
                isLoading={routePointLoading}
              >
                Update
              </Button>
              <AreYouSureAlert
                onDelete={handleDeleteRoutePoint}
              ></AreYouSureAlert>
            </FormControl>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default RoutePointEdit;
