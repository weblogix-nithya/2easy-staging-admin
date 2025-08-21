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
  defaultVehicleType,
  DELETE_VEHICLE_TYPE_MUTATION,
  GET_VEHICLE_TYPE_QUERY,
  UPDATE_VEHICLE_TYPE_MUTATION,
} from "graphql/vehicleType";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function VehicleTypeEdit() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  //  const textColorSecondary = "gray.400";
  const [vehicleType, setVehicleType] = useState(defaultVehicleType);
  const router = useRouter();
  const { id } = router.query;

  const {
    loading: vehicleTypeLoading,
    // data: vehicleTypeData,
    // refetch: getVehicleType,
  } = useQuery(GET_VEHICLE_TYPE_QUERY, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      if (data?.vehicleType == null) {
        router.push("/admin/vehicle-types");
      }
      setVehicleType({ ...vehicleType, ...data?.vehicleType });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [handleUpdateVehicleType, {}] = useMutation(
    UPDATE_VEHICLE_TYPE_MUTATION,
    {
      variables: {
        input: vehicleType,
      },
      onCompleted: () => {
        toast({
          title: "VehicleType updated",
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

  const [handleDeleteVehicleType, {}] = useMutation(
    DELETE_VEHICLE_TYPE_MUTATION,
    {
      variables: {
        id: id,
      },
      onCompleted: () => {
        toast({
          title: "VehicleType deleted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        router.push("/admin/vehicle-types");
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
          {!vehicleTypeLoading && (
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
                value={vehicleType.name}
                onChange={(e) =>
                  setVehicleType({
                    ...vehicleType,
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
                onClick={() => handleUpdateVehicleType()}
                isLoading={vehicleTypeLoading}
              >
                Update
              </Button>
              <AreYouSureAlert
                onDelete={handleDeleteVehicleType}
              ></AreYouSureAlert>
            </FormControl>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default VehicleTypeEdit;
