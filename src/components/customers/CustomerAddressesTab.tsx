import { useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  CREATE_CUSTOMER_ADDRESS_MUTATION,
  defaultCustomerAddress,
  GET_CUSTOMER_ADDRESSES_QUERY,
} from "graphql/customerAddress";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";
import GooglePlacesAutocomplete, {
  geocodeByPlaceId,
} from "react-google-places-autocomplete";

export default function CustomerAddressesTab(props: any) {
  const toast = useToast();
  const { customer } = props;
  const textColor = useColorModeValue("navy.700", "white");
  let menuBg = useColorModeValue("white", "navy.800");
  const [customerAddress, setCustomerAddress] = useState(
    defaultCustomerAddress,
  );
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [googleAddress, setGoogleAddress] = useState(null);

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: "Address",
        accessor: "address_line_1" as const,
      },
      {
        Header: "Suburb",
        accessor: "address_city" as const,
      },
      {
        Header: "Apt/Suite/Floor",
        accessor: "address_line_2" as const,
      },
      {
        Header: "Company",
        accessor: "address_business_name" as const,
      },
      {
        Header: "Instructions",
        accessors: ["pick_up_name", "pick_up_notes"],
        isTooltip: true,
      },
      {
        Header: "Actions",
        accessor: "id" as const,
      },
    ],
    [],
  );

  const {
    loading,
    error,
    data: customerAddresses,
    refetch: getCustomerAddresses,
  } = useQuery(GET_CUSTOMER_ADDRESSES_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "DESC",
      customer_id: parseInt(customer.id),
    },
  });

  useEffect(() => {
    // onChangeSearchQuery.cancel();
    console.log("useEffect");

    if (googleAddress) {
      updateCustomerAddress(googleAddress.value.place_id);
    }
  }, [googleAddress]);

  const [handleCreateCustomerAddress, {}] = useMutation(
    CREATE_CUSTOMER_ADDRESS_MUTATION,
    {
      variables: {
        input: {
          customer_id: customer.id,
          name: customerAddress.name,
          address: customerAddress.address,
          address_line_1: customerAddress.address_line_1,
          address_line_2: customerAddress.address_line_2,
          address_city: customerAddress.address_city,
          address_state: customerAddress.address_state,
          address_postal_code: customerAddress.address_postal_code,
          address_country: customerAddress.address_country,
          address_business_name: customerAddress.address_business_name,
          lng: customerAddress.lng,
          lat: customerAddress.lat,
          pick_up_name: customerAddress.pick_up_name,
          pick_up_notes: customerAddress.pick_up_notes,
        },
      },
      onCompleted: (data) => {
        toast({
          title: "CustomerAddress created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        getCustomerAddresses();
        setCustomerAddress(defaultCustomerAddress);
        onClose();
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  function updateCustomerAddress(placeId: string) {
    geocodeByPlaceId(placeId)
      .then((results) => {
        var addressLine1 = "";
        var addressCity = "";
        var addressState = "";
        var addressCountry = "";
        var addressPostalCode = "";

        if (results[0]) {
          results[0].address_components.forEach((component) => {
            if (component.types.includes("street_number")) {
              addressLine1 += component.long_name + " ";
            } else if (component.types.includes("route")) {
              addressLine1 += component.long_name;
            } else if (component.types.includes("locality")) {
              addressCity = component.long_name;
            } else if (
              component.types.includes("administrative_area_level_1")
            ) {
              addressState = component.long_name;
            } else if (component.types.includes("country")) {
              addressCountry = component.long_name;
            } else if (component.types.includes("postal_code")) {
              addressPostalCode = component.long_name;
            }
          });

          if (results[0].geometry.location) {
            setCustomerAddress({
              ...customerAddress,
              name: results[0].formatted_address,
              address_line_1: addressLine1,
              address_city: addressCity,
              address_state: addressState,
              address_country: addressCountry,
              address_postal_code: addressPostalCode,
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
            });
          }
        }
      })
      .catch((error) => console.error(error));
  }

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center" mb="24px">
        <Flex
          justifyContent="space-between"
          alignItems="center"
          className="mt-8"
          width="100%"
        >
          <h2 className="mb-0">Addresses</h2>
          <Button fontSize="sm" variant="brand" onClick={onOpen}>
            Create New
          </Button>
        </Flex>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add address</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Divider mb="24px" />
              <p className="mb-4">
                <strong>Address Details</strong>
              </p>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  mr="4px"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
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
                    // @ts-ignore
                    googleAddress,
                    onChange: setGoogleAddress,
                    styles: {
                      // @ts-ignore
                      control: (provided) => ({
                        ...provided,
                        paddingLeft: "8px",
                        height: "48px",
                        backgroundColor: "white",
                        border: "1px solid #e3e3e3",
                        borderRadius: "8px",
                      }),
                      // @ts-ignore
                      singleValue: (provided) => ({
                        ...provided,
                        paddingLeft: "8px",
                        fontFamily: "Manrope",
                        fontSize: "14px",
                        fontWeight: "500",
                      }),
                      // @ts-ignore
                      option: (provided) => ({
                        ...provided,
                        fontFamily: "Manrope",
                        fontSize: "14px",
                        fontWeight: "500",
                      }),
                      // @ts-ignore
                      container: (provided) => ({
                        ...provided,
                        width: "100%",
                      }),
                      // @ts-ignore
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
              </Flex>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Address line 1
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={customerAddress.address_line_1}
                  onChange={(e) =>
                    setCustomerAddress({
                      ...customerAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  name="address_line_1"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                />
              </Flex>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Apt / Suite / Floor
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={customerAddress.address_line_2}
                  onChange={(e) =>
                    setCustomerAddress({
                      ...customerAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  name="address_line_2"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                />
              </Flex>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Address City
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={customerAddress.address_city}
                  onChange={(e) =>
                    setCustomerAddress({
                      ...customerAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  name="address_city"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                />
              </Flex>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Address state
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={customerAddress.address_state}
                  onChange={(e) =>
                    setCustomerAddress({
                      ...customerAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  name="address_state"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                />
              </Flex>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Address Country
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={customerAddress.address_country}
                  onChange={(e) =>
                    setCustomerAddress({
                      ...customerAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  name="address_country"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                />
              </Flex>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Address Postcode
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={customerAddress.address_postal_code}
                  onChange={(e) =>
                    setCustomerAddress({
                      ...customerAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  name="address_postal_code"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                />
              </Flex>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Business or building name
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={customerAddress.address_business_name}
                  onChange={(e) =>
                    setCustomerAddress({
                      ...customerAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  name="address_business_name"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                />
              </Flex>

              <Divider className="my-6" />

              <p className="mb-4 text-sm font-medium">Instructions</p>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Pickup person
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={customerAddress.pick_up_name}
                  onChange={(e) =>
                    setCustomerAddress({
                      ...customerAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  name="pick_up_name"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                />
              </Flex>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Instructions
                </FormLabel>
                <Textarea
                  isRequired={true}
                  value={customerAddress.pick_up_notes}
                  onChange={(e) =>
                    setCustomerAddress({
                      ...customerAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  name="pick_up_notes"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                />
              </Flex>
            </ModalBody>

            <ModalFooter>
              <Button variant="outline" mr="auto" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleCreateCustomerAddress()}
              >
                Save
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Flex>

      <Divider />

      <Box className="mt-6">
        <SimpleGrid columns={{ sm: 1 }}>
          <Flex className="mb-4">
            <SearchBar
              background={menuBg}
              onChangeSearchQuery={onChangeSearchQuery}
            />
          </Flex>

          {!loading &&
            customerAddresses?.customerAddresses.data.length >= 0 && (
              <PaginationTable
                columns={columns}
                data={customerAddresses?.customerAddresses.data}
                options={{
                  initialState: {
                    pageIndex: queryPageIndex,
                    pageSize: queryPageSize,
                  },
                  manualPagination: true,
                  pageCount:
                    customerAddresses?.customerAddresses.paginatorInfo.lastPage,
                }}
                setQueryPageIndex={setQueryPageIndex}
                setQueryPageSize={setQueryPageSize}
                isServerSide
                path="/admin/customer-addresses"
              />
            )}
        </SimpleGrid>
      </Box>
    </>
  );
}
