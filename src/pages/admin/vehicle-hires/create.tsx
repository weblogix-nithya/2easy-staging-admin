// Chakra imports
import { useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Input,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import CustomInputField from "components/fields/CustomInputField";
import FileInput from "components/fileInput/FileInput";
import JobAddressesSection from "components/jobs/JobAddressesSection";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { defaultCustomer, GET_CUSTOMERS_QUERY } from "graphql/customer";
import { GET_CUSTOMER_ADDRESSES_QUERY } from "graphql/customerAddress";
import { defaultJobDestination } from "graphql/jobDestination";
import { ADD_MEDIA_MUTATION } from "graphql/media";
import {
  CREATE_VEHICLE_HIRE_MUTATION,
  defaultVehicleHire,
} from "graphql/vehicleHire";
import { GET_VEHICLE_TYPES_QUERY } from "graphql/vehicleType";
import { formatDateTimeToDB, today } from "helpers/helper";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

function VehicleHireEdit() {
  const toast = useToast();

  const isAdmin = useSelector((state: RootState) => state.user.isAdmin);
  const customerId = useSelector((state: RootState) => state.user.customerId);
  const companyId = useSelector((state: RootState) => state.user.companyId);
  const isCompany = useSelector((state: RootState) => state.user.isCompany);
  const isCustomer = useSelector((state: RootState) => state.user.isCustomer);

  const textColor = useColorModeValue("navy.700", "white");
  const textColorPrimary = useColorModeValue("navy.700", "white");
  const [vehicleHire, setVehicleHire] = useState(defaultVehicleHire);
  const [customerSelected, setCustomerSelected] = useState(defaultCustomer);
  const [pickUpDestination, setPickUpDestination] = useState({
    ...defaultJobDestination,
    ...{ id: 1, address_line_1: "" },
  });
  const [savedAddressesSelect, setSavedAddressesSelect] = useState([]);
  const [vehicleHireTypes, setVehicleHireTypes] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [temporaryMedia, setTemporaryMedia] = useState([]);
  const [hireFromAt, setHireFromAt] = useState("00:00");
  const [hireToAt, setHireToAt] = useState("00:00");
  const [vehicleHireDateAt, setVehicleHireDateAt] = useState(today);
  const router = useRouter();
  //create variable type for default variables
  type variablesType = {
    query?: string;
    page?: number;
    first?: number;
    orderByColumn?: string;
    orderByOrder?: string;
    company_id?: number;
  };

  const defaultVariables: variablesType = {
    query: "",
    page: 1,
    first: 100,
    orderByColumn: "id",
    orderByOrder: "ASC",
  };

  const attachmentColumns = useMemo(
    () => [
      {
        Header: "Document",
        accessor: "path" as const,
      },
      {
        Header: "uploaded by",
        accessor: "uploaded_by" as const,
      },
      {
        Header: "date uploaded",
        accessor: "created_at" as const,
      },
      {
        Header: "Actions",
        accessor: "downloadable_url" as const,
        isDelete: true,
        isEdit: false,
        isDownload: true,
      },
    ],
    [],
  );

  useEffect(() => {
    if (companyId) {
      setVehicleHire((vehicleHire) => ({
        ...vehicleHire,
        ...{ company_id: companyId },
      }));
      getCustomersByCompanyId({ ...defaultVariables, company_id: companyId });
    } else if (customerId) {
      getCustomersByCompanyId({ ...defaultVariables });
    }
  }, [companyId]);
  //handleCreateVehicleHire
  const [handleCreateVehicleHire, {}] = useMutation(
    CREATE_VEHICLE_HIRE_MUTATION,
    {
      variables: {
        input: {
          ...vehicleHire,
          id: undefined,
          vehicle_hire_status_id: 1,
          media: undefined,
        },
      },
      onCompleted: async (data) => {
        toast({
          title: "Hourly hire created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        temporaryMedia.map(async (media) => {
          const reader = new FileReader();
          reader.onabort = () => console.log("file reading was aborted");
          reader.onerror = () => console.log("file reading has failed");
          reader.onload = () => {
            // Added this because the setMedia is too slow. needs a minor delay before running handleCreateMedia.
            setTimeout(() => {
              handleCreateMedia({
                variables: {
                  input: {
                    entity: "VehicleHire",
                    entity_id: data.createVehicleHire.id,
                  },
                  media: media.file,
                },
              });
            }, 500);
          };
          reader.readAsArrayBuffer(media.file);
        });

        router.push(`/admin/vehicle-hires/${data.createVehicleHire.id}`);
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  //handleCreateMedia
  const [handleCreateMedia, {}] = useMutation(ADD_MEDIA_MUTATION, {
    onCompleted: (data) => {
      /*toast({
        title: "Media updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });*/
      console.log("Media created");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  // method to format savedAddresses to be used in the select
  const formatToSelect = (
    _entityArray: any[],
    valueKeyName: string,
    labelKeyName: string,
  ) => {
    return _entityArray.map((_entityItem) => {
      return {
        value: _entityItem[valueKeyName],
        label: _entityItem[labelKeyName],
        entity: _entityItem,
      };
    });
  };

  useQuery(GET_VEHICLE_TYPES_QUERY, {
    variables: defaultVariables,
    onCompleted: (data) => {
      setVehicleHireTypes([]);
      data.vehicleTypes.data.map((driverStatus: any) => {
        setVehicleHireTypes((vehicleHireTypes) => [
          ...vehicleHireTypes,
          {
            value: parseInt(driverStatus.id),
            label: driverStatus.name,
          },
        ]);
      });
    },
  });

  const handleRemoveFromTemporaryMedia = (id: number) => {
    let _temporaryMedia = [...temporaryMedia];
    _temporaryMedia = _temporaryMedia.filter((e) => e.id !== id);
    setTemporaryMedia(_temporaryMedia);
  };
  const { refetch: getCustomersByCompanyId } = useQuery(GET_CUSTOMERS_QUERY, {
    variables: defaultVariables,
    onCompleted: (data) => {
      setCustomerOptions([]);
      setCustomerOptions(
        formatToSelect(data.customers.data, "id", "full_name"),
      );
    },
  });
  useEffect(() => {
    dateChanged();
  }, [vehicleHireDateAt, hireFromAt, hireToAt]);
  const dateChanged = () => {
    try {
      setVehicleHire({
        ...vehicleHire,
        hire_from_at: formatDateTimeToDB(vehicleHireDateAt, hireFromAt),
        hire_to_at: formatDateTimeToDB(vehicleHireDateAt, hireToAt),
      });
    } catch (e) {
      //console.log(e);
    }
  };
  const handleJobDestinationChanged = (vehicleHireDestination: any) => {
    setPickUpDestination({
      ...pickUpDestination,
      ...vehicleHireDestination,
      ...{ is_pickup: true },
    });
    setVehicleHire({
      ...vehicleHire,
      ...{
        lng: vehicleHireDestination.lng,
        lat: vehicleHireDestination.lat,
        address: vehicleHireDestination.address,
        pick_up_notes: vehicleHireDestination.notes,
        pick_up_name: vehicleHireDestination.pick_up_name,
        address_business_name: vehicleHireDestination.address_business_name,
        address_city: vehicleHireDestination.address_city,
        address_country: vehicleHireDestination.address_country,
        address_line_1: vehicleHireDestination.address_line_1,
        address_line_2: vehicleHireDestination.address_line_2,
        address_postal_code: vehicleHireDestination.address_postal_code,
        address_state: vehicleHireDestination.address_state,
      },
    });
  };
  const { refetch: getCustomerAddresses } = useQuery(
    GET_CUSTOMER_ADDRESSES_QUERY,
    {
      variables: {
        query: "",
        page: 1,
        first: 200,
        orderByColumn: "id",
        orderByOrder: "ASC",
        customer_id: vehicleHire.customer_id,
      },
      onCompleted: (data) => {
        setSavedAddressesSelect([]);
        setSavedAddressesSelect(
          formatToSelect(data.customerAddresses.data, "id", "address"),
        );
      },
    },
  );
  useEffect(() => {
    if (vehicleHire.customer_id && customerOptions.length > 0) {
      setCustomerSelected({
        ...customerOptions.find((_e) => _e.value == vehicleHire.customer_id)
          ?.entity,
      });
      getCustomerAddresses();
    }
    if (vehicleHire.customer_id == null) {
      setCustomerSelected(defaultCustomer);
      setSavedAddressesSelect([]);
    }
  }, [vehicleHire.customer_id, customerOptions]);
  return (
    <AdminLayout>
      <Box
        className="mk-customers-id overflow-auto"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
        backgroundColor="white"
      >
        {/* Main Fields */}
        <Grid
          pr="24px"
          className="mk-mainInner"
          h={{
            base: "calc(100vh - 130px)",
            md: "calc(100vh - 97px)",
            xl: "calc(100vh - 97px)",
          }}
        >
          {
            <Grid pl="6" backgroundColor="white">
              <FormControl>
                <h1 className="my-8">New Hourly Hire</h1>

                {/* Basic fields */}
                <Box mb="16px">
                  <CustomInputField
                    isSelect={true}
                    optionsArray={vehicleHireTypes}
                    label="Vehicle Type:"
                    value={vehicleHireTypes.find(
                      (vehicle_hire_type) =>
                        vehicle_hire_type.value === vehicleHire.vehicle_type_id,
                    )}
                    placeholder=""
                    onChange={(e) => {
                      setVehicleHire({
                        ...vehicleHire,
                        vehicle_type_id: e.value || null,
                      });
                    }}
                  />

                  <CustomInputField
                    isSelect={true}
                    optionsArray={customerOptions}
                    label={isCompany ? "Booked by" : "Customer:"}
                    value={
                      customerOptions.find(
                        (entity) => entity.value == vehicleHire.customer_id,
                      ) || { value: 0, label: "" }
                    }
                    placeholder=""
                    onChange={(e) => {
                      setVehicleHire({
                        ...vehicleHire,
                        customer_id: parseInt(e.value) || null,
                      });
                      setCustomerSelected({
                        ...customerOptions.find((_e) => _e.value === e.value)
                          .entity,
                      });
                    }}
                  />
                  <CustomInputField
                    label="Operator phone:"
                    placeholder=""
                    isDisabled={true}
                    name="operator_phone"
                    value={customerSelected.phone_no}
                    onChange={(e) => {}}
                  />
                  <CustomInputField
                    label="Operator email:"
                    placeholder=""
                    name="operator_email"
                    isDisabled={true}
                    value={customerSelected.email}
                    onChange={(e) => {}}
                  />

                  <Flex alignItems="center" mb={"16px"}>
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      color={textColorPrimary}
                      _hover={{ cursor: "pointer" }}
                    >
                      Date:
                    </FormLabel>
                    <Box width="100%">
                      <div className="relative">
                        <Input
                          type="date"
                          variant="main"
                          _placeholder={{
                            fontWeight: "400",
                            color: "secondaryGray.600",
                          }}
                          isRequired={true}
                          name="hire_date_at"
                          value={vehicleHireDateAt}
                          onChange={(e) => {
                            setVehicleHireDateAt(e.target.value);
                          }}
                          ms={{ base: "0px", md: "0px" }}
                          mb="0"
                          size="lg"
                          maxWidth={"50%"}
                          fontSize="sm"
                          fontWeight="500"
                          mr="5px!"
                        />
                      </div>
                    </Box>
                  </Flex>
                  <Flex alignItems="center" mb={"16px"}>
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      color={textColorPrimary}
                      _hover={{ cursor: "pointer" }}
                    >
                      Duration:
                    </FormLabel>
                    <Box width="100%">
                      <div className="relative">
                        <Input
                          type="time"
                          variant="main"
                          _placeholder={{
                            fontWeight: "400",
                            color: "secondaryGray.600",
                          }}
                          isRequired={true}
                          name="hire_from_at"
                          value={hireFromAt}
                          onChange={(e) => {
                            setHireFromAt(e.target.value);
                          }}
                          ms={{ base: "0px", md: "0px" }}
                          mb="0"
                          size="lg"
                          maxWidth={"24%"}
                          fontSize="sm"
                          fontWeight="500"
                          mr="5px!"
                        />
                        <Input
                          type="time"
                          variant="main"
                          _placeholder={{
                            fontWeight: "400",
                            color: "secondaryGray.600",
                          }}
                          isRequired={true}
                          name="hire_to_at"
                          value={hireToAt}
                          onChange={(e) => {
                            setHireToAt(e.target.value);
                          }}
                          ms={{ base: "0px", md: "0px" }}
                          mb="0"
                          ml="5px!"
                          size="lg"
                          maxWidth={"24%"}
                          fontSize="sm"
                          fontWeight="500"
                        />
                      </div>
                    </Box>
                  </Flex>

                  <CustomInputField
                    label="Reference:"
                    placeholder=""
                    name="reference_no"
                    value={vehicleHire.reference_no}
                    onChange={(e) =>
                      setVehicleHire({
                        ...vehicleHire,
                        [e.target.name]: e.target.value,
                      })
                    }
                  />

                  {isAdmin && (
                    <CustomInputField
                      isTextArea={true}
                      label="Admin notes:"
                      placeholder="Admin notes"
                      name="admin_notes"
                      value={vehicleHire.admin_notes}
                      onChange={(e) =>
                        setVehicleHire({
                          ...vehicleHire,
                          [e.target.name]: e.target.value,
                        })
                      }
                    />
                  )}
                </Box>

                <Divider className="my-12" />

                {/* Addresses */}
                <Box mb="16px">
                  <h3 className="mb-5 mt-3">Addresses</h3>

                  {/* Pickup address */}
                  <Box mb="16px">
                    <h4 className="mb-5 mt-3">Pickup Information</h4>
                    <Grid templateColumns="repeat(10, 1fr)" gap={6}>
                      <GridItem colSpan={2}>
                        <p className="mb-5 mt-2.5 text-sm">Pickup depot</p>
                      </GridItem>

                      <JobAddressesSection
                        entityModel={vehicleHire}
                        savedAddressesSelect={savedAddressesSelect}
                        onAddressSaved={(hasChanged) => {
                          getCustomerAddresses();
                        }}
                        defaultJobDestination={pickUpDestination}
                        jobDestinationChanged={handleJobDestinationChanged}
                      />
                    </Grid>
                  </Box>
                </Box>

                <Divider className="my-12" />

                {/* Attachments */}
                <Box mb="16px">
                  <h3 className="mb-5 mt-3">Attachments</h3>
                  <Flex width="100%" className="mb-6">
                    <FileInput
                      entity="VehicleHire"
                      entityId={vehicleHire.id}
                      onTemporaryUpload={(_temporaryMedia) => {
                        setTemporaryMedia(_temporaryMedia);
                      }}
                      isTemporary={true}
                      defaulTemporaryFiles={temporaryMedia}
                      description="Browse or drop your files here to upload"
                      height="80px"
                      bg="primary.100"
                    ></FileInput>
                  </Flex>

                  {/* foreach vehicleHireAttachments */}
                  {temporaryMedia.length >= 0 && (
                    <PaginationTable
                      columns={attachmentColumns}
                      data={temporaryMedia}
                      onDelete={(mediaId) => {
                        handleRemoveFromTemporaryMedia(mediaId);
                      }}
                    />
                  )}
                </Box>

                <Divider className="my-12" />

                {/* Additional Info */}
                <Box mb="16px">
                  <h3 className="mb-5 mt-3">Additional Info</h3>

                  <Box mb="16px">
                    <CustomInputField
                      label="Customer Notes"
                      placeholder=""
                      extra="Visible to driver"
                      isTextArea={true}
                      name="customer_notes"
                      value={vehicleHire.customer_notes}
                      onChange={(e) =>
                        setVehicleHire({
                          ...vehicleHire,
                          [e.target.name]: e.target.value,
                        })
                      }
                    />
                    {isAdmin && (
                      <CustomInputField
                        isTextArea={true}
                        label="Base notes"
                        placeholder=""
                        name="base_notes"
                        value={vehicleHire.base_notes}
                        onChange={(e) =>
                          setVehicleHire({
                            ...vehicleHire,
                            [e.target.name]: e.target.value,
                          })
                        }
                      />
                    )}
                  </Box>

                  <Box mb="16px">
                    <Flex alignItems="center" width="100%" pt={7}>
                      <SimpleGrid columns={{ sm: 1 }} width="100%">
                        <GridItem>
                          <FormLabel
                            display="flex"
                            mb="0"
                            fontSize="sm"
                            fontWeight="500"
                            _hover={{ cursor: "pointer" }}
                          >
                            Does this job require a timeslot booking through
                            Inbound Connect?
                          </FormLabel>
                        </GridItem>

                        <GridItem>
                          <RadioGroup
                            defaultValue={"0"}
                            onChange={(e) => {
                              setVehicleHire({
                                ...vehicleHire,
                                is_inbound_connect: e === "1" ? true : false,
                              });
                            }}
                          >
                            <Stack direction="row" pt={3}>
                              <Radio value="0">No</Radio>
                              <Radio value="1" pl={6}>
                                Yes
                              </Radio>
                            </Stack>
                          </RadioGroup>
                        </GridItem>
                      </SimpleGrid>
                    </Flex>

                    <Flex alignItems="center" width="100%" pt={7}>
                      <SimpleGrid columns={{ sm: 1 }} width="100%">
                        <GridItem>
                          <FormLabel
                            display="flex"
                            mb="0"
                            fontSize="sm"
                            fontWeight="500"
                            _hover={{ cursor: "pointer" }}
                          >
                            Does this job require hand unloading?
                          </FormLabel>
                        </GridItem>

                        <GridItem>
                          <RadioGroup
                            defaultValue={"0"}
                            onChange={(e) => {
                              setVehicleHire({
                                ...vehicleHire,
                                is_hand_unloading: e === "1" ? true : false,
                              });
                            }}
                          >
                            <Stack direction="row" pt={3}>
                              <Radio value="0">No</Radio>
                              <Radio value="1" pl={6}>
                                Yes
                              </Radio>
                            </Stack>
                          </RadioGroup>
                        </GridItem>
                      </SimpleGrid>
                    </Flex>

                    <Flex alignItems="center" width="100%" pt={7}>
                      <SimpleGrid columns={{ sm: 1 }} width="100%">
                        <GridItem>
                          <FormLabel
                            display="flex"
                            mb="0"
                            fontSize="sm"
                            fontWeight="500"
                            _hover={{ cursor: "pointer" }}
                          >
                            Are there dangerous goods being transported?
                          </FormLabel>
                        </GridItem>

                        <GridItem>
                          <RadioGroup
                            defaultValue={"0"}
                            onChange={(e) => {
                              setVehicleHire({
                                ...vehicleHire,
                                is_dangerous_goods: e === "1" ? true : false,
                              });
                            }}
                          >
                            <Stack direction="row" pt={3}>
                              <Radio value="0">No</Radio>
                              <Radio value="1" pl={6}>
                                Yes
                              </Radio>
                            </Stack>
                          </RadioGroup>
                        </GridItem>
                      </SimpleGrid>
                    </Flex>

                    <Flex alignItems="center" width="100%" pt={7}>
                      <SimpleGrid columns={{ sm: 1 }} width="100%">
                        <GridItem>
                          <FormLabel
                            display="flex"
                            mb="0"
                            fontSize="sm"
                            fontWeight="500"
                            _hover={{ cursor: "pointer" }}
                          >
                            Is a Tail Lift vehicle required?
                          </FormLabel>
                        </GridItem>

                        <GridItem>
                          <RadioGroup
                            defaultValue={"0"}
                            onChange={(e) => {
                              setVehicleHire({
                                ...vehicleHire,
                                is_tailgate_required: e === "1" ? true : false,
                              });
                            }}
                          >
                            <Stack direction="row" pt={3}>
                              <Radio value="0">No</Radio>
                              <Radio value="1" pl={6}>
                                Yes
                              </Radio>
                            </Stack>
                          </RadioGroup>
                        </GridItem>
                      </SimpleGrid>
                    </Flex>

                    <Flex alignItems="center" width="100%" pt={7}>
                      <SimpleGrid columns={{ sm: 1 }} width="100%">
                        <GridItem>
                          <FormLabel
                            display="flex"
                            mb="0"
                            fontSize="sm"
                            fontWeight="500"
                            _hover={{ cursor: "pointer" }}
                          >
                            Is a Semi-trailer vehicle required?
                          </FormLabel>
                        </GridItem>

                        <GridItem>
                          <RadioGroup
                            defaultValue={"0"}
                            onChange={(e) => {
                              setVehicleHire({
                                ...vehicleHire,
                                is_semi_required: e === "1" ? true : false,
                              });
                            }}
                          >
                            <Stack direction="row" pt={3}>
                              <Radio value="0">No</Radio>
                              <Radio value="1" pl={6}>
                                Yes
                              </Radio>
                            </Stack>
                          </RadioGroup>
                        </GridItem>
                      </SimpleGrid>
                    </Flex>

                    <Flex alignItems="center" width="100%" pt={7}>
                      <SimpleGrid columns={{ sm: 1 }} width="100%">
                        <GridItem>
                          <FormLabel
                            display="flex"
                            mb="0"
                            fontSize="sm"
                            fontWeight="500"
                            _hover={{ cursor: "pointer" }}
                          >
                            Is the job an Airport Run?
                          </FormLabel>
                        </GridItem>

                        <GridItem>
                          <RadioGroup
                            defaultValue={"0"}
                            onChange={(e) => {
                              setVehicleHire({
                                ...vehicleHire,
                                is_airport_run: e === "1" ? true : false,
                              });
                            }}
                          >
                            <Stack direction="row" pt={3}>
                              <Radio value="0">No</Radio>
                              <Radio value="1" pl={6}>
                                Yes
                              </Radio>
                            </Stack>
                          </RadioGroup>
                        </GridItem>
                      </SimpleGrid>
                    </Flex>
                  </Box>
                </Box>

                <Divider className="mt-12 mb-6" />

                {/* Create VehicleHire Button */}
                <Flex alignItems="center" className="mb-6">
                  <Button
                    variant="primary"
                    onClick={() => handleCreateVehicleHire()}
                  >
                    Submit
                  </Button>
                </Flex>
              </FormControl>
            </Grid>
          }
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default VehicleHireEdit;
