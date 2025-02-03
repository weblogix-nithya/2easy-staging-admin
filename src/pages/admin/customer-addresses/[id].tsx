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
  defaultCustomerAddress,
  DELETE_CUSTOMER_ADDRESS_MUTATION,
  GET_CUSTOMER_ADDRESS_QUERY,
  UPDATE_CUSTOMER_ADDRESS_MUTATION,
} from "graphql/customerAddress";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function CustomerAddressEdit() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const [customerAddress, setCustomerAddress] = useState(defaultCustomerAddress);
  const [customerAddressStatuses, setCustomerAddressStatuses] = useState([]);
  const [customerAddressTypes, setCustomerAddressTypes] = useState([]);
  const router = useRouter();
  const { id } = router.query;

  const {
    loading: customerAddressLoading,
    data: customerAddressData,
    refetch: getCustomerAddress,
  } = useQuery(GET_CUSTOMER_ADDRESS_QUERY, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      if (data?.customerAddress == null) {
        router.push("/admin/customer-addresses");
      }
      setCustomerAddress({ ...customerAddress, ...data?.customerAddress });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [handleUpdateCustomerAddress, {}] = useMutation(UPDATE_CUSTOMER_ADDRESS_MUTATION, {
    variables: {
      input: customerAddress,
    },
    onCompleted: (data) => {
      toast({
        title: "CustomerAddress updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteCustomerAddress, {}] = useMutation(DELETE_CUSTOMER_ADDRESS_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      toast({
        title: "CustomerAddress deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/customer-addresses");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        {/* Main Fields */}
        <Grid>
          {!customerAddressLoading && (
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
                value={customerAddress.name}
                onChange={(e) =>
                  setCustomerAddress({ ...customerAddress, [e.target.name]: e.target.value })
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
                onClick={() => handleUpdateCustomerAddress()}
                isLoading={customerAddressLoading}
              >
                Update
              </Button>
              <AreYouSureAlert onDelete={handleDeleteCustomerAddress}></AreYouSureAlert>
            </FormControl>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default CustomerAddressEdit;
