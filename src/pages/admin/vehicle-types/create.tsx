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
  CREATE_VEHICLE_TYPE_MUTATION,
  defaultVehicleType,
} from "graphql/vehicleType";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function VehicleTypeCreate() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  //  const textColorSecondary = "gray.400";
  const [vehicleType, setVehicleType] = useState(defaultVehicleType);
  const router = useRouter();

  const [handleCreateVehicleType, {}] = useMutation(
    CREATE_VEHICLE_TYPE_MUTATION,
    {
      variables: {
        input: {
          name: vehicleType.name,
        },
      },
      onCompleted: (data) => {
        toast({
          title: "VehicleType created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        router.push(`/admin/vehicle-types/${data.createVehicleType.id}`);
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
              onClick={() => handleCreateVehicleType()}
            >
              Create
            </Button>
          </FormControl>
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default VehicleTypeCreate;
