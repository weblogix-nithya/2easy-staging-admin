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
import GooglePlacesAutocomplete, {
  geocodeByPlaceId,
} from "react-google-places-autocomplete";

function CustomerAddressEdit() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  // const textColorSecondary = "gray.400";
  const [customerAddress, setCustomerAddress] = useState(
    defaultCustomerAddress,
  );
  const [originalCustomerAddress, setOriginalCustomerAddress] = useState(null);

  // const [customerAddressStatuses, setCustomerAddressStatuses] = useState([]);
  // const [customerAddressTypes, setCustomerAddressTypes] = useState([]);
  const router = useRouter();
  const { id } = router.query;
  // const [googleAddress, setGoogleAddress] = useState(null);

 const {
  loading: customerAddressLoading,
} = useQuery(GET_CUSTOMER_ADDRESS_QUERY, {
  variables: {
    id: id,
  },
  onCompleted: (data) => {
    if (data?.customerAddress == null) {
      router.push("/admin/customer-addresses");
    }
    setCustomerAddress({ ...customerAddress, ...data?.customerAddress });
    setOriginalCustomerAddress({ ...data?.customerAddress });
  },
  onError(error) {
    console.log("onError");
    console.log(error);
  },
});


  const hasChanges = () => {
    return (
      JSON.stringify(customerAddress) !==
      JSON.stringify(originalCustomerAddress)
    );
  };

  const [handleUpdateCustomerAddress, {}] = useMutation(
    UPDATE_CUSTOMER_ADDRESS_MUTATION,
    {
      variables: {
        input: {
          id: customerAddress.id,
          name: customerAddress.name,
          customer_id: customerAddress.customer_id,
          pick_up_name: customerAddress.pick_up_name,
          pick_up_notes: customerAddress.pick_up_notes,
          address: customerAddress.address,
          address_business_name: customerAddress.address_business_name,
          address_line_1: customerAddress.address_line_1,
          address_line_2: customerAddress.address_line_2,
          address_postal_code: customerAddress.address_postal_code,
          address_city: customerAddress.address_city,
          address_state: customerAddress.address_state,
          address_country: customerAddress.address_country,
          lng: customerAddress.lng,
          lat: customerAddress.lat,
        },
      },
      onCompleted: (_data) => {
        toast({
          title: "CustomerAddress updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setOriginalCustomerAddress({ ...customerAddress });
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const [handleDeleteCustomerAddress, {}] = useMutation(
    DELETE_CUSTOMER_ADDRESS_MUTATION,
    {
      variables: {
        id: id,
      },
      onCompleted: (_data) => {
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
    },
  );

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        <Grid>
          <Box p="16px" bg="white" borderRadius="8px" boxShadow="md">
            {!customerAddressLoading && (
              <FormControl>
                <FormLabel
                  display="flex"
                  // ms="4px"
                  fontSize="lg"
                  fontWeight="700"
                  color={textColor}
                  mb="8px"
                >
                  Address Details
                </FormLabel>

                <FormControl mb="16px">
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
                    Search address
                  </FormLabel>
                  <GooglePlacesAutocomplete
                    apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                    autocompletionRequest={{
                      componentRestrictions: {
                        country: ["au"],
                      },
                    }}
                    minLengthAutocomplete={2}
                    selectProps={{
                      value: {
                        label: customerAddress.address,
                        value: customerAddress.address,
                      },
                      onChange: (value) => {
                        if (!value) {
                          setCustomerAddress({
                            ...customerAddress,
                            googleAddress: null,
                            address: "",
                            address_line_1: "",
                            address_city: "",
                            address_state: "",
                            address_country: "",
                            lng: null,
                            lat: null,
                          });
                        } else {
                          geocodeByPlaceId(value.value.place_id)
                            .then((results) => {
                              const location = results[0].geometry.location;
                              const addressComponents =
                                results[0].address_components;

                              const getAddressComponent = (type: any) => {
                                const component = addressComponents.find(
                                  (comp) => comp.types.includes(type),
                                );
                                return component ? component.long_name : "";
                              };

                              setCustomerAddress({
                                ...customerAddress,
                                googleAddress: value,
                                address: value.label,
                                address_line_1:
                                  getAddressComponent("street_number") +
                                  " " +
                                  getAddressComponent("route"),
                                address_city:
                                  getAddressComponent("locality") ||
                                  getAddressComponent(
                                    "administrative_area_level_2",
                                  ),
                                address_state: getAddressComponent(
                                  "administrative_area_level_1",
                                ),
                                address_country: getAddressComponent("country"),
                                address_postal_code:
                                  getAddressComponent("postal_code"),
                                lng: location.lng(),
                                lat: location.lat(),
                              });
                            })
                            .catch((error) =>
                              console.error("Error in geocoding:", error),
                            );
                        }
                      },
                      styles: {
                        control: (provided) => ({
                          ...provided,
                          paddingLeft: "8px",
                          height: "48px",
                          backgroundColor: "white",
                          border: "1px solid #e3e3e3",
                          borderRadius: "8px",
                        }),
                        singleValue: (provided) => ({
                          ...provided,
                          paddingLeft: "8px",
                          fontFamily: "Manrope",
                          fontSize: "14px",
                          fontWeight: "500",
                        }),
                        option: (provided) => ({
                          ...provided,
                          fontFamily: "Manrope",
                          fontSize: "14px",
                          fontWeight: "500",
                        }),
                        container: (provided) => ({
                          ...provided,
                          width: "100%",
                        }),
                        input: (provided) => ({
                          ...provided,
                          paddingLeft: "8px",
                          minWidth: "100",
                          width: "100%",
                          fontFamily: "Manrope",
                          fontSize: "14px",
                          fontWeight: "500",
                        }),
                      },
                    }}
                  />
                </FormControl>

                <FormControl mb="16px">
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
                    Business or Building Name
                  </FormLabel>
                  <Input
                    value={customerAddress.address_business_name}
                    onChange={(e) =>
                      setCustomerAddress({
                        ...customerAddress,
                        address_business_name: e.target.value,
                      })
                    }
                  />
                </FormControl>

                <FormControl mb="16px">
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
                    Address line 1
                  </FormLabel>
                  <Input
                    value={customerAddress.address_line_1}
                    onChange={(e) =>
                      setCustomerAddress({
                        ...customerAddress,
                        address_line_1: e.target.value,
                      })
                    }
                  />
                </FormControl>

                <FormControl mb="16px">
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
                    Apt / Suite / Floor
                  </FormLabel>
                  <Input
                    value={customerAddress.address_line_2}
                    onChange={(e) =>
                      setCustomerAddress({
                        ...customerAddress,
                        address_line_2: e.target.value,
                      })
                    }
                  />
                </FormControl>

                <FormControl mb="16px">
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
                    Address City
                  </FormLabel>
                  <Input
                    value={customerAddress.address_city}
                    onChange={(e) =>
                      setCustomerAddress({
                        ...customerAddress,
                        address_city: e.target.value,
                      })
                    }
                  />
                </FormControl>

                <FormControl mb="16px">
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
                    Address state
                  </FormLabel>
                  <Input
                    value={customerAddress.address_state}
                    onChange={(e) =>
                      setCustomerAddress({
                        ...customerAddress,
                        address_state: e.target.value,
                      })
                    }
                  />
                </FormControl>

                <FormControl mb="16px">
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
                    Address Country
                  </FormLabel>
                  <Input
                    value={customerAddress.address_country}
                    onChange={(e) =>
                      setCustomerAddress({
                        ...customerAddress,
                        address_country: e.target.value,
                      })
                    }
                  />
                </FormControl>

                <FormControl mb="16px">
                  <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
                    Address Postcode
                  </FormLabel>
                  <Input
                    value={customerAddress.address_postal_code}
                    onChange={(e) =>
                      setCustomerAddress({
                        ...customerAddress,
                        address_postal_code: e.target.value,
                      })
                    }
                  />
                </FormControl>

                <Button
                  fontSize="sm"
                  variant="brand"
                  fontWeight="500"
                  w="100%"
                  h="50"
                  mb="24px"
                  onClick={() => handleUpdateCustomerAddress()}
                  isLoading={customerAddressLoading}
                  disabled={!hasChanges()}
                >
                  Update
                </Button>

                <AreYouSureAlert
                  onDelete={handleDeleteCustomerAddress}
                ></AreYouSureAlert>
                <Button
                  // mb="16px"
                  ml='10px'
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/admin/customers/${customerAddress.customer_id}`,
                    )
                  }
                >
                  Back
                </Button>
              </FormControl>
            )}
          </Box>
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default CustomerAddressEdit;
