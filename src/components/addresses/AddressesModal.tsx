import {
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
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import GooglePlacesAutocomplete, {
  geocodeByPlaceId,
} from "react-google-places-autocomplete";

import { GenericAddressType } from "./genericAddressType";

export default function AddressesModal<T extends GenericAddressType>(props: {
  defaultAddress?: T;
  onSetAddress: (entityAddress: GenericAddressType) => void;
  onModalClose: (isOpen: boolean) => void;
  isModalOpen?: boolean;
  description?: string;
}) {
  const {
    defaultAddress,
    isModalOpen,
    description,
    onSetAddress,
    onModalClose,
  } = props;
  const textColor = useColorModeValue("navy.700", "white");
  const [entityAddress, setEntityAddress] = useState({
    id: defaultAddress?.id,
    address: defaultAddress?.address,
    address_line_1: defaultAddress?.address_line_1,
    address_line_2: defaultAddress?.address_line_2,
    address_postal_code: defaultAddress?.address_postal_code,
    address_city: defaultAddress?.address_city,
    address_state: defaultAddress?.address_state,
    address_country: defaultAddress?.address_country,
    address_business_name: defaultAddress?.address_business_name,
    lng: defaultAddress?.lng,
    lat: defaultAddress?.lat,
  });
  const [googleAddress, setGoogleAddress] = useState(null);
  const [isOpen, setIsOpen] = useState(isModalOpen || false);
  const toast = useToast();
  const onClose = () => {
    setIsOpen(false);
    onModalClose(false);
  };

  useEffect(() => {
    setIsOpen(isModalOpen);
  }, [isModalOpen]);

  useEffect(() => {
    if (defaultAddress?.address)
      setEntityAddress({
        id: defaultAddress?.id,
        address: defaultAddress?.address,
        address_line_1: defaultAddress?.address_line_1,
        address_line_2: defaultAddress?.address_line_2,
        address_postal_code: defaultAddress?.address_postal_code,
        address_city: defaultAddress?.address_city,
        address_state: defaultAddress?.address_state,
        address_country: defaultAddress?.address_country,
        address_business_name: defaultAddress?.address_business_name,
        lng: defaultAddress?.lng,
        lat: defaultAddress?.lat,
      });
  }, [defaultAddress]);

  useEffect(() => {
    if (googleAddress) {
      updateEntityAddress(googleAddress.value.place_id, googleAddress);
    }
  }, [googleAddress]);

  const handleSaveAddress = async () => {
    entityAddress.address =
      (entityAddress.address_line_2 ? entityAddress.address_line_2 + "/" : "") +
      entityAddress.address_line_1 +
      ", " +
      entityAddress.address_city +
      " " +
      entityAddress.address_state +
      " " +
      entityAddress.address_postal_code +
      ", " +
      entityAddress.address_country;
    if (
      entityAddress.lng == 0 ||
      entityAddress.lat == 0 ||
      !entityAddress.lat ||
      !entityAddress.lng ||
      entityAddress.lat == null ||
      entityAddress.lng == null ||
      entityAddress.lat == undefined ||
      entityAddress.lng == undefined
    ) {
      toast({
        title: "Error",
        description:
          "Please search for a google address first. Longitude and latitude are required.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } else {
      onSetAddress({ ...entityAddress });
      onClose();
    }
  };
  function updateEntityAddress(placeId: string, googleAddress: any) {
    var addressBusinessName = "";
    if (googleAddress?.value?.structured_formatting?.main_text != undefined) {
      if (googleAddress?.value?.types.includes("establishment")) {
        // console.log(googleAddress?.value?.structured_formatting?.main_text);
        addressBusinessName =
          googleAddress?.value?.structured_formatting?.main_text;
      }
    }
    geocodeByPlaceId(placeId)
      .then((results) => {
        var addressLine1 = "";
        var addressLine2 = "";
        var addressCity = "";
        var addressState = "";
        var addressCountry = "";
        var addressPostalCode = "";

        if (results[0]) {
          // console.log(results[0]);
          results[0].address_components.forEach((component) => {
            if (component.types.includes("street_number")) {
              addressLine1 += component.long_name + " ";
            } else if (component.types.includes("route")) {
              addressLine1 += component.long_name;
            } else if (component.types.includes("subpremise")) {
              addressLine2 = component.long_name;
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
            let address = {
              address: results[0].formatted_address,
              address_line_1: addressLine1,
              address_line_2: addressLine2,
              address_city: addressCity,
              address_state: addressState,
              address_country: addressCountry,
              address_postal_code: addressPostalCode,
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
              address_business_name: addressBusinessName,
            };
            setEntityAddress({ ...entityAddress, ...address });
            //onSetAddress({ ...entityAddress, ...address });
          }
        }
      })
      .catch((error) => console.error(error));
  }
  return (
    <>
      <Flex justifyContent="space-between" alignItems="center" mb="">
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {description ? description : "Add address"}
            </ModalHeader>
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
                  Business or Building Name
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={entityAddress.address_business_name}
                  onChange={(e) =>
                    setEntityAddress({
                      ...entityAddress,
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
                  isDisabled={googleAddress == null ? true : false}
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
                  value={entityAddress.address_line_1}
                  onChange={(e) =>
                    setEntityAddress({
                      ...entityAddress,
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
                  isDisabled={googleAddress == null ? true : false}
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
                  value={entityAddress.address_line_2}
                  onChange={(e) =>
                    setEntityAddress({
                      ...entityAddress,
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
                  isDisabled={googleAddress == null ? true : false}
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
                  value={entityAddress.address_city}
                  onChange={(e) =>
                    setEntityAddress({
                      ...entityAddress,
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
                  isDisabled={googleAddress == null ? true : false}
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
                  value={entityAddress.address_state}
                  onChange={(e) =>
                    setEntityAddress({
                      ...entityAddress,
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
                  isDisabled={googleAddress == null ? true : false}
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
                  value={entityAddress.address_country}
                  onChange={(e) =>
                    setEntityAddress({
                      ...entityAddress,
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
                  isDisabled={googleAddress == null ? true : false}
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
                  name="address_postal_code"
                  value={entityAddress.address_postal_code}
                  onChange={(e) =>
                    setEntityAddress({
                      ...entityAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                  isDisabled={googleAddress == null ? true : false}
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
                  Address Longitude
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  name="lng"
                  value={entityAddress.lng}
                  onChange={(e) =>
                    setEntityAddress({
                      ...entityAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                  isDisabled={googleAddress == null ? true : false}
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
                  Address Latitude
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  name="lat"
                  value={entityAddress.lat}
                  onChange={(e) =>
                    setEntityAddress({
                      ...entityAddress,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                  isDisabled={googleAddress == null ? true : false}
                />
              </Flex>
            </ModalBody>

            <ModalFooter>
              <Button variant="outline" mr="auto" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" onClick={() => handleSaveAddress()}>
                Save
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Flex>
    </>
  );
}
