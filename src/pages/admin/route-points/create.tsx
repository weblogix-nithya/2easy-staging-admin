// Chakra imports
import { useMutation } from "@apollo/client";
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
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  CREATE_ROUTE_POINT_MUTATION,
  defaultRoutePoint,
} from "graphql/routePoint";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function RoutePointCreate() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const [routePoint, setRoutePoint] = useState(defaultRoutePoint);
  const router = useRouter();

  const [handleCreateRoutePoint, {}] = useMutation(
    CREATE_ROUTE_POINT_MUTATION,
    {
      variables: {
        input: {
          name: routePoint.name,
        },
      },
      onCompleted: (data) => {
        toast({
          title: "RoutePoint created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        router.push(`/admin/route-points/${data.createRoutePoint.id}`);
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
              onClick={() => handleCreateRoutePoint()}
            >
              Create
            </Button>
          </FormControl>
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default RoutePointCreate;
