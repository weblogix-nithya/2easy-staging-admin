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
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import CustomInputField from "components/fields/CustomInputField";
import FileInput from "components/fileInput/FileInput";
import JobAddressesSection from "components/jobs/JobAddressesSection";
import PaginationTable from "components/table/PaginationTable";
import { TabsComponent } from "components/tabs/TabsComponet";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import InvoiceVehicleHiresTab from "components/vehicleHire/InvoiceVehicleHiresTab";
import MessageLogVehicleHiresTab from "components/vehicleHire/MessageLogVehicleHiresTab";
import ReportsVehicleHiresTab from "components/vehicleHire/ReportsVehicleHiresTab";
import { defaultCustomer, GET_CUSTOMERS_QUERY } from "graphql/customer";
import { GET_CUSTOMER_ADDRESSES_QUERY } from "graphql/customerAddress";
import { GET_DRIVERS_QUERY } from "graphql/driver";
import { defaultJobDestination } from "graphql/jobDestination";
import { DELETE_MEDIA_MUTATION } from "graphql/media";
import {
  defaultVehicleHire,
  GET_VEHICLE_HIRE_QUERY,
  UPDATE_VEHICLE_HIRE_MUTATION,
} from "graphql/vehicleHire";
import { GET_VEHICLE_HIRE_STATUSES_QUERY } from "graphql/vehicleHireStatus";
import { GET_VEHICLE_TYPES_QUERY } from "graphql/vehicleType";
import {
  formatDate,
  formatDateTimeToDB,
  formatTime,
  formatTimeUTCtoInput,
  today,
} from "helpers/helper";
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
  // const isCustomer = useSelector((state: RootState) => state.user.isCustomer);

  // const textColor = useColorModeValue("navy.700", "white");
  const textColorSecodary = useColorModeValue("#888888", "#888888");
  const textColorPrimary = useColorModeValue("navy.700", "white");
  const [vehicleHire, setVehicleHire] = useState(defaultVehicleHire);
  const [customerSelected, setCustomerSelected] = useState(defaultCustomer);
  const [pickUpDestination, setPickUpDestination] = useState({
    ...defaultJobDestination,
  });
  const [savedAddressesSelect, setSavedAddressesSelect] = useState([]);
  const [vehicleHireTypes, setVehicleHireTypes] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [hireFromAt, setHireFromAt] = useState("00:00");
  const [hireToAt, setHireToAt] = useState("00:00");
  const [vehicleHireDateAt, setVehicleHireDateAt] = useState(today);
  const [updatingMedia, setUpdatingMedia] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tabId, setActiveTab] = useState(1);
  const [vehicleHireStatuses, setVehicleHireStatuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const router = useRouter();
  const { id } = router.query;
  //create variable type for default variables
  type variablesType = {
    query?: string;
    page?: number;
    first?: number;
    orderByColumn?: string;
    orderByOrder?: string;
    company_id?: number;
  };
  const tabs = [
    {
      id: 1,
      tabName: "Job Details",
      hash: "job_details",
      isVisible: true,
    },
    {
      id: 2,
      tabName: "Reports",
      hash: "reports",
      isVisible: isAdmin,
    },
    {
      id: 3,
      tabName: "Message Log",
      hash: "message_log",
      isVisible: isAdmin,
    },
    {
      id: 4,
      tabName: "Invoice",
      hash: "invoice",
      isVisible: true,
    },
  ];
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
        accessor: "name" as const,
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
        isDelete: isAdmin,
        isEdit: false,
        isDownload: true,
      },
    ],
    [isAdmin],
  );
  const {
    loading: vehicleHireLoading,
    // data: vehicleHireData,
    refetch: getVehicleHire,
  } = useQuery(GET_VEHICLE_HIRE_QUERY, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      if (!updatingMedia) {
        setVehicleHire({
          ...vehicleHire,
          ...data?.vehicleHire,
          media: data?.vehicleHire.media,
        });
        //hireFromAt
        //hireToAt
        setVehicleHireDateAt(
          data.vehicleHire.hire_from_at
            ? formatDate(data.vehicleHire.hire_from_at)
            : vehicleHireDateAt,
        );
        setHireFromAt(
          data.vehicleHire.hire_from_at
            ? formatTimeUTCtoInput(data.vehicleHire.hire_from_at)
            : hireFromAt,
        );
        setHireToAt(
          data.vehicleHire.hire_to_at
            ? formatTimeUTCtoInput(data.vehicleHire.hire_to_at)
            : hireToAt,
        );
        setPickUpDestination({
          ...defaultJobDestination,
          id: 0,
          address: data?.vehicleHire?.address ?? "",
          address_business_name: data?.vehicleHire?.address_business_name ?? "",
          address_city: data?.vehicleHire?.address_city ?? "",
          address_country: data?.vehicleHire?.address_country,
          address_line_1: data?.vehicleHire?.address_line_1 ?? "",
          address_line_2: data?.vehicleHire?.address_line_2 ?? "",
          address_postal_code: data?.vehicleHire?.address_postal_code ?? "",
          address_state: data?.vehicleHire?.address_state ?? "",
          lat: data?.vehicleHire?.lat,
          lng: data?.vehicleHire?.lng,
          pick_up_name: data?.vehicleHire?.pick_up_name ?? "",
          pick_up_notes: data?.vehicleHire?.pick_up_notes ?? "",
          notes: data?.vehicleHire?.pick_up_notes ?? "",
        });
      } else {
        setVehicleHire({ ...vehicleHire, media: data?.vehicleHire.media });
        setUpdatingMedia(false);
      }
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  useQuery(GET_VEHICLE_HIRE_STATUSES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setVehicleHireStatuses([]);
      data.vehicleHireStatuses.data.map((vehicleHireStatus: any) => {
        setVehicleHireStatuses((_entity) => [
          ..._entity,
          {
            value: parseInt(vehicleHireStatus.id),
            label: vehicleHireStatus.name,
          },
        ]);
      });
    },
  });
  useQuery(GET_DRIVERS_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setDrivers([]);
      data.drivers.data.map((driver: any) => {
        setDrivers((_entity) => [
          ..._entity,
          {
            value: parseInt(driver.id),
            label: driver.full_name,
          },
        ]);
      });
    },
  });
  useEffect(() => {
    if (companyId) {
      getCustomersByCompanyId({ ...defaultVariables, company_id: companyId });
    } else if (customerId) {
      getCustomersByCompanyId({ ...defaultVariables });
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);
  useEffect(() => {
    if (vehicleHire.customer_id && customerOptions.length > 0) {
      setCustomerSelected({
        ...customerOptions.find((_e) => _e.value == vehicleHire.customer_id)
          ?.entity,
      });
    }
    if (vehicleHire.customer_id == null) {
      setCustomerSelected(defaultCustomer);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleHire.customer_id, customerOptions]);

  //handleUpdateVehicleHire
  const [handleUpdateVehicleHire, {}] = useMutation(
    UPDATE_VEHICLE_HIRE_MUTATION,
    {
      variables: {
        input: {
          ...vehicleHire,
          vehicle_hire_status_id: 1,
          media: undefined,
          job_type: undefined,
          transmission_type: undefined,
          vehicle_type: undefined,
          vehicle_class: undefined,
          vehicle_hire_status: undefined,
          chats: undefined,
          driver: undefined,
          customer: undefined,
          customer_invoice: undefined,
          issue_reports: undefined,
        },
      },
      onCompleted: async (_data) => {
        toast({
          title: "Hourly hire updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setIsSaving(false);
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

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
     // eslint-disable-next-line react-hooks/exhaustive-deps
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
  //deleteMedia
  const [handleDeleteMedia, {}] = useMutation(DELETE_MEDIA_MUTATION, {
    onCompleted: (_data) => {
      toast({
        title: "Attachment deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      getVehicleHire();
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  const handleJobDestinationChanged = (vehicleHireDestination: any) => {
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
     // eslint-disable-next-line react-hooks/exhaustive-deps
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
                <Flex justify="space-between" align="center" className="my-8">
                  <h1 className="">Hourly Hire #{vehicleHire.id}</h1>

                  <Flex alignItems="center">
                    <Button
                      hidden={!isAdmin}
                      variant="primary"
                      isDisabled={isSaving}
                      onClick={() => {
                        setIsSaving(true);
                        handleUpdateVehicleHire();
                      }}
                    >
                      {isSaving ? "Saving Changes..." : "Save Changes"}
                    </Button>
                  </Flex>
                </Flex>

                {/* Tabs */}

                <TabsComponent
                  tabs={tabs}
                  onChange={(tabId) => setActiveTab(tabId)}
                />
                {/* Job Details */}
                {tabId == 1 && (
                  <Box mt={5} mb="16px">
                    {/* Basic fields */}
                    {isAdmin ? (
                      <Box mb="16px">
                        <CustomInputField
                          isSelect={true}
                          optionsArray={vehicleHireStatuses}
                          label="Status:"
                          value={vehicleHireStatuses.find(
                            (vehicle_hire_status) =>
                              vehicle_hire_status?.value ==
                              vehicleHire.vehicle_hire_status_id,
                          )}
                          placeholder=""
                          onChange={(e) => {
                            setVehicleHire({
                              ...vehicleHire,
                              vehicle_hire_status_id: e.value || null,
                            });
                          }}
                        />
                        <CustomInputField
                          isSelect={true}
                          optionsArray={drivers}
                          label="Vehicle Type:"
                          value={drivers.find(
                            (driver) => driver.value == vehicleHire.driver_id,
                          )}
                          placeholder=""
                          onChange={(e) => {
                            setVehicleHire({
                              ...vehicleHire,
                              driver_id: e.value || null,
                            });
                          }}
                        />
                        <CustomInputField
                          isSelect={true}
                          optionsArray={drivers}
                          label={isCompany ? "Booked by" : "Customer:"}
                          value={drivers.find(
                            (driver) => driver.value == vehicleHire.driver_id,
                          )}
                          placeholder=""
                          onChange={(e) => {
                            setVehicleHire({
                              ...vehicleHire,
                              driver_id: e.value || null,
                            });
                          }}
                        />
                        <CustomInputField
                          isSelect={true}
                          optionsArray={vehicleHireTypes}
                          label="Vehicle Type:"
                          value={vehicleHireTypes.find(
                            (vehicle_hire_type) =>
                              vehicle_hire_type.value ===
                              vehicleHire.vehicle_type_id,
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
                          label="Customer:"
                          value={
                            customerOptions.find(
                              (entity) =>
                                entity.value == vehicleHire.customer_id,
                            ) || { value: 0, label: "" }
                          }
                          placeholder=""
                          onChange={(e) => {
                            setVehicleHire({
                              ...vehicleHire,
                              customer_id: parseInt(e.value) || null,
                            });
                            setCustomerSelected({
                              ...customerOptions.find(
                                (_e) => _e.value === e.value,
                              ).entity,
                            });
                          }}
                        />
                        <CustomInputField
                          label="Operator phone:"
                          placeholder=""
                          isDisabled={true}
                          name="operator_phone"
                          value={customerSelected.phone_no}
                          onChange={() => {}}
                        />
                        <CustomInputField
                          label="Operator email:"
                          placeholder=""
                          name="operator_email"
                          isDisabled={true}
                          value={customerSelected.email}
                          onChange={() => {}}
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
                    ) : (
                      <Box mb="16px">
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Status:
                          </Text>
                          <Text fontSize="sm">
                            {vehicleHire.vehicle_hire_status?.name}
                          </Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Job category:
                          </Text>
                          <Text fontSize="sm">
                            {vehicleHire.vehicle_hire_category?.name}
                          </Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Booked by
                          </Text>

                          <SimpleGrid columns={{ sm: 1 }}>
                            <GridItem>
                              <Text fontSize="sm">
                                {vehicleHire.customer?.full_name}
                              </Text>
                            </GridItem>
                            <GridItem>
                              <Text fontSize="xs" color={textColorSecodary}>
                                {vehicleHire.company?.name}
                              </Text>
                            </GridItem>
                          </SimpleGrid>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Operator phone:
                          </Text>
                          <Text fontSize="sm">
                            {vehicleHire.customer?.phone_no}
                          </Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Operator email:
                          </Text>
                          <Text fontSize="sm">
                            {vehicleHire.customer?.email}
                          </Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Date:
                          </Text>
                          <Text fontSize="sm">
                            {formatDate(vehicleHireDateAt, "DD MMM YYYY")}
                          </Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Duration
                          </Text>
                          <Text fontSize="sm">
                            {formatTime(vehicleHire.hire_from_at)} -{" "}
                            {formatTime(vehicleHire.hire_to_at)}
                          </Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Reference:
                          </Text>
                          <Text fontSize="sm">{vehicleHire.reference_no}</Text>
                        </Flex>
                      </Box>
                    )}
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
                          {isAdmin ? (
                            <JobAddressesSection
                              entityModel={vehicleHire}
                              savedAddressesSelect={savedAddressesSelect}
                              defaultJobDestination={pickUpDestination}
                              onAddressSaved={() => {
                                getCustomerAddresses();
                              }}
                              jobDestinationChanged={
                                handleJobDestinationChanged
                              }
                            />
                          ) : (
                            <GridItem colSpan={7}>
                              <Flex
                                alignItems="center"
                                justifyContent="space-between"
                                width="100%"
                                className="py-0"
                              >
                                <p className="py-3 text-sm">
                                  {pickUpDestination.address}
                                </p>
                              </Flex>
                            </GridItem>
                          )}
                        </Grid>
                      </Box>
                    </Box>

                    <Divider className="my-12" />

                    {/* Attachments */}
                    <Box mb={10}>
                      <h3 className="mb-6">Attachments</h3>
                      {isAdmin && (
                        <Flex width="100%" className="mb-6">
                          <FileInput
                            entity="VehicleHire"
                            entityId={vehicleHire.id}
                            onUpload={() => {
                              setUpdatingMedia(true);
                              getVehicleHire();
                            }}
                            description="Browse or drop your files here to upload"
                            height="80px"
                            bg="primary.100"
                          ></FileInput>
                        </Flex>
                      )}

                      {/* foreach jobAttachments */}
                      {!vehicleHireLoading &&
                        vehicleHire?.media.length >= 0 && (
                          <PaginationTable
                            columns={attachmentColumns}
                            data={vehicleHire.media}
                            onDelete={(mediaId) => {
                              handleDeleteMedia({
                                variables: {
                                  id: mediaId,
                                },
                              });
                            }}
                          />
                        )}
                    </Box>

                    {/* Radio Buttons */}
                    {!isAdmin && (
                      <Box mb="16px">
                        <Flex alignItems="center" mb={"16px"}>
                          <SimpleGrid width="200px" columns={{ sm: 1 }}>
                            <GridItem>
                              <Text fontSize="sm">Customer Notes</Text>
                            </GridItem>
                            <GridItem>
                              <Text fontSize="xs" color={textColorSecodary}>
                                Visible to driver
                              </Text>
                            </GridItem>
                          </SimpleGrid>
                          <Text fontSize="sm" width={"50%"}>
                            {vehicleHire.customer_notes}
                          </Text>
                        </Flex>
                      </Box>
                    )}
                    {!isAdmin && (
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
                                isDisabled={true}
                                value={
                                  vehicleHire.is_inbound_connect ? "1" : "0"
                                }
                                onChange={(e) => {
                                  setVehicleHire({
                                    ...vehicleHire,
                                    is_inbound_connect:
                                      e === "1" ? true : false,
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
                                isDisabled={true}
                                value={
                                  vehicleHire.is_hand_unloading ? "1" : "0"
                                }
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
                                isDisabled={true}
                                value={
                                  vehicleHire.is_dangerous_goods ? "1" : "0"
                                }
                                onChange={(e) => {
                                  setVehicleHire({
                                    ...vehicleHire,
                                    is_dangerous_goods:
                                      e === "1" ? true : false,
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
                                isDisabled={true}
                                value={
                                  vehicleHire.is_tailgate_required ? "1" : "0"
                                }
                                onChange={(e) => {
                                  setVehicleHire({
                                    ...vehicleHire,
                                    is_tailgate_required:
                                      e === "1" ? true : false,
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
                                isDisabled={true}
                                value={vehicleHire.is_semi_required ? "1" : "0"}
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
                                isDisabled={true}
                                value={vehicleHire.is_airport_run ? "1" : "0"}
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
                    )}
                  </Box>
                )}
                {/* Job Details */}
                {tabId == 2 && (
                  <ReportsVehicleHiresTab vehicleHireObject={vehicleHire} />
                )}
                {/* Message Log */}
                {tabId == 3 && (
                  <MessageLogVehicleHiresTab vehicleHireObject={vehicleHire} />
                )}
                {/* Message Invoice */}
                {tabId == 4 && (
                  <InvoiceVehicleHiresTab vehicleHireObject={vehicleHire} />
                )}
              </FormControl>
            </Grid>
          }
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default VehicleHireEdit;
