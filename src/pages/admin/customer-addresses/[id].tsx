// External Imports
import { useMutation, useQuery } from "@apollo/client";
// Chakra UI Imports
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
// Local Imports
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
import { useEffect, useState } from "react";

// import GooglePlacesAutocomplete, {
//   geocodeByPlaceId,
// } from "react-google-places-autocomplete";
import {
  fetchPlaceDetails,
  fetchSuggestions,
  getAddressComponent,
} from "../../../utils/autocomplete";

function CustomerAddressEdit() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  // //  const textColorSecondary = "gray.400";
  const [customerAddress, setCustomerAddress] = useState(
    defaultCustomerAddress,
  );
  const [originalCustomerAddress, setOriginalCustomerAddress] = useState(null);
  const [query, setQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

  // const [customerAddressStatuses, setCustomerAddressStatuses] = useState([]);
  // const [customerAddressTypes, setCustomerAddressTypes] = useState([]);
  const router = useRouter();
  const { id } = router.query;
  // const [googleAddress, setGoogleAddress] = useState(null);

  const { loading: customerAddressLoading } = useQuery(
    GET_CUSTOMER_ADDRESS_QUERY,
    {
      variables: {
        id: id,
      },
      skip: !id,
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
    },
  );

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
          name: customerAddress.address,
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
  useEffect(() => {
    const fetchAutoCompleteResults = async () => {
      if (query.length >= 2) {
        const results = await fetchSuggestions(query);
        // console.log(results);
        setAddressSuggestions(results);
      } else {
        setAddressSuggestions([]);
      }
    };

    fetchAutoCompleteResults();
  }, [query]);
  const handleSelectAddress = async (placeId: string) => {
    try {
      const data = await fetchPlaceDetails(placeId);
      if (!data) return;

      const components = data.addressComponents || [];

      const getComponent = (type: string) =>
        getAddressComponent(components, type) || "";

      setCustomerAddress({
        ...customerAddress,
        address: data.formattedAddress || "",
        address_line_1:
          getComponent("street_number") + " " + getComponent("route"),
        address_city:
          getComponent("locality") ||
          getComponent("administrative_area_level_2"),
        address_state: getComponent("administrative_area_level_1"),
        address_country: getComponent("country"),
        address_postal_code: getComponent("postal_code"),
        lng: data.location?.longitude || null,
        lat: data.location?.latitude || null,
      });

      setQuery( "");
      setAddressSuggestions([]);
    } catch (error) {
      console.log("Error fetching place details:", error);
    }
  };

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
                  <Input
                    placeholder="Search for an address"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Box mt="2" maxH="150px" overflowY="auto">
                    {addressSuggestions.map((suggestion) => {
                      const pred = suggestion.placePrediction;
                      // const mainText = pred.structuredFormat?.mainText?.text || "";
                      // const secondaryText =pred.structuredFormat?.secondaryText?.text || "";
                      const label = pred?.text?.text
                     
                      return (
                        <Button
                          key={pred.placeId}
                          onClick={() => handleSelectAddress(pred.placeId)}
                          variant="ghost"
                          justifyContent="flex-start"
                          width="100%"
                          whiteSpace="normal"
                          fontSize="sm"
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </Box>
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
                  ml="10px"
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
