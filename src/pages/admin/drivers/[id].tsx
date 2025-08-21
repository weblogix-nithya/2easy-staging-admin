// Chakra imports
import { useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Image,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Textarea,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { faCar, faNotdef, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import AddressesModal from "components/addresses/AddressesModal";
import AreYouSureAlert from "components/alert/AreYouSureAlert";
import FileInput from "components/fileInput/FileInput";
import FileInputLink from "components/fileInput/FileInputLink";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  defaultDriver,
  DELETE_DRIVER_MUTATION,
  GET_DRIVER_QUERY,
  UPDATE_DRIVER_MUTATION,
} from "graphql/driver";
import { GET_DRIVER_STATUSES_QUERY } from "graphql/driverStatus";
import { GET_INVOICES_QUERY } from "graphql/invoice";
import { GET_TRANSMISSION_TYPES_QUERY } from "graphql/transmissionsType";
import { GET_VEHICLE_CLASSES_QUERY } from "graphql/vehicleClass";
import { GET_VEHICLE_TYPES_QUERY } from "graphql/vehicleType";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

function DriverEdit() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  //  const textColorSecondary = "gray.400";
  const [driver, setDriver] = useState(defaultDriver);
  const [driverPayRatePercentage, setDriverPayRatePercentage] = useState(0);
  const [driverLevyRatePercentage, setDriverLevyRatePercentage] = useState(0);
  const [driverStatuses, setDriverStatuses] = useState([]);
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [transmissionTypes, setTransmissionTypes] = useState([]);
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, _setSearchQuery] = useState("");
  // const [driverTypes, setDriverTypes] = useState([]);
  const [tabId, setTabId] = useState(0);
  const router = useRouter();
  const { id } = router.query;

  // const placeholderOptions = [
  //   { value: 1, label: "option 1" },
  //   { value: 2, label: "option 2" },
  // ];

  const {
    loading: driverLoading,
    // data: driverData,
    refetch: getDriver,
  } = useQuery(GET_DRIVER_QUERY, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      if (data?.driver == null) {
        router.push("/admin/drivers");
      }
      setDriver({ ...driver, ...data?.driver });
      setDriverPayRatePercentage(parseFloat(data?.driver.pay_rate) * 100);
      setDriverLevyRatePercentage(parseFloat(data?.driver.levy_rate));
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  useQuery(GET_DRIVER_STATUSES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setDriverStatuses([]);
      data.driverStatuses.data.map((driverStatus: any) => {
        setDriverStatuses((driverStatuses) => [
          ...driverStatuses,
          { value: parseInt(driverStatus.id), label: driverStatus.name },
        ]);
      });
    },
  });

  useQuery(GET_VEHICLE_CLASSES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setVehicleClasses([]);
      data.vehicleClasses.data.map((driverStatus: any) => {
        setVehicleClasses((vehicleClasses) => [
          ...vehicleClasses,
          { value: parseInt(driverStatus.id), label: driverStatus.name },
        ]);
      });
    },
  });

  useQuery(GET_VEHICLE_TYPES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setVehicleTypes([]);
      data.vehicleTypes.data.map((vehicleType: any) => {
        setVehicleTypes((vehicleTypes) => [
          ...vehicleTypes,
          { value: parseInt(vehicleType.id), label: vehicleType.name },
        ]);
      });
    },
  });
  useQuery(GET_TRANSMISSION_TYPES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setTransmissionTypes([]);
      data.transmissionTypes.data.map((transmissionType: any) => {
        setTransmissionTypes((transmissionTypes) => [
          ...transmissionTypes,
          {
            value: parseInt(transmissionType.id),
            label: transmissionType.name,
          },
        ]);
      });
    },
  });

  const [handleUpdateDriver, {}] = useMutation(UPDATE_DRIVER_MUTATION, {
    variables: {
      input: {
        ...driver,
        media_url: undefined,
        full_name: undefined,
        license_media: undefined,
        vehicle_media: undefined,
        remaining_time: undefined,
        current_occupied_capacity: undefined,
      },
    },
    onCompleted: (_data) => {
      toast({
        title: "Driver updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteDriver, {}] = useMutation(DELETE_DRIVER_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (_data) => {
      toast({
        title: "Driver deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/drivers");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const columns = useMemo(
    () => [
      {
        Header: "Invoice ID",
        accessor: "name" as const,
      },
      {
        Header: "Status",
        accessor: "invoice_status.name" as const,
      },
      {
        Header: "Period",
        accessor: "issued_at" as const,
      },
      {
        Header: "Jobs",
        accessor: "job.name" as const,
      },
      {
        Header: "Amount",
        accessor: "total" as const,
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
    // error,
    data: invoices,
    // refetch: getInvoices,
  } = useQuery(GET_INVOICES_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      is_rcti: false,
      driver_id: id,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
  });

  return (
    <AdminLayout>
      <Box
        className="mk-drivers-id overflow-auto"
        mt={{ base: "130px", md: "97px", xl: "97px" }}
        h={{
          base: "calc(100vh - 130px)",
          md: "calc(100vh - 97px)",
          xl: "calc(100vh - 97px)",
        }}
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
          {!driverLoading && (
            <Grid
              templateAreas={`"nav main"`}
              gridTemplateRows={"calc(100vh)"}
              gridTemplateColumns={"25% 1fr"}
              h={{
                base: "calc(100vh - 130px)",
                md: "calc(100vh - 97px)",
                xl: "calc(100vh - 97px)",
              }}
              gap="1"
              backgroundColor="white"
              color="blackAlpha.700"
              fontWeight="bold"
            >
              {/* Left side */}
              <GridItem
                area={"nav"}
                className="border-r border-[var(--chakra-colors-gray-200)]"
                sx={{ height: "calc(100vh - 97px)" }}
                backgroundColor="white"
              >
                <Box mx="26px">
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    className="pt-3"
                  >
                    <Image
                      src={driver.media_url}
                      alt="image"
                      fit="cover"
                      style={{ borderRadius: "50%" }}
                      width="80px"
                      height="80px"
                    ></Image>
                    <FileInputLink
                      width="130px"
                      height="130px"
                      entity="Driver"
                      description="Upload photo"
                      entityId={driver.id}
                      onUpload={() => getDriver()}
                    ></FileInputLink>
                  </Flex>
                  <h2 className="mt-5 mb-4">{driver.full_name}</h2>

                  <Select
                    className="mb-8"
                    placeholder="Select Online Status"
                    defaultValue={driverStatuses.find(
                      (driverStatus) =>
                        driverStatus.value === driver.driver_status_id,
                    )}
                    options={driverStatuses}
                    onChange={(e) => {
                      setDriver({ ...driver, driver_status_id: e.value });
                    }}
                  ></Select>

                  <FormLabel
                    display="flex"
                    ms="4px"
                    fontSize="sm"
                    fontWeight="500"
                    color={textColor}
                    mb="8px"
                  >
                    Notes
                  </FormLabel>
                  <Textarea
                    name="admin_notes"
                    value={driver.admin_notes}
                    onChange={(e) =>
                      setDriver({
                        ...driver,
                        [e.target.name]: e.target.value,
                      })
                    }
                    placeholder="Notes"
                    mb="16px"
                    fontSize="sm"
                  />
                </Box>

                <Flex mt={8} flexDirection="column" className="border-b">
                  <Button
                    disabled={tabId == 0}
                    onClick={() => setTabId(0)}
                    alignItems="start"
                    h={45}
                    fontSize="14px"
                    className={
                      "!items-center !justify-start !font-medium !rounded-none " +
                      (tabId == 0
                        ? "text-white !bg-[var(--chakra-colors-primary-400)] "
                        : "text-[var(--chakra-colors-black-400)] !bg-white")
                    }
                  >
                    <FontAwesomeIcon icon={faUser} className="mr-1" />
                    Profile
                  </Button>
                  <Button
                    disabled={tabId == 1}
                    onClick={() => setTabId(1)}
                    alignItems="start"
                    h={45}
                    fontSize="14px"
                    className={
                      "!items-center !justify-start !font-medium !rounded-none " +
                      (tabId == 1
                        ? "text-white !bg-[var(--chakra-colors-primary-400)] "
                        : "text-[var(--chakra-colors-black-400)] !bg-white")
                    }
                  >
                    <FontAwesomeIcon icon={faCar} className="mr-1" />
                    Vehicle Details
                  </Button>
                  <Button
                    disabled={tabId == 2}
                    onClick={() => setTabId(2)}
                    alignItems="start"
                    h={45}
                    fontSize="14px"
                    className={
                      "!items-center !justify-start !font-medium !rounded-none " +
                      (tabId == 2
                        ? "text-white !bg-[var(--chakra-colors-primary-400)] "
                        : "text-[var(--chakra-colors-black-400)] !bg-white")
                    }
                  >
                    <FontAwesomeIcon icon={faNotdef} className="mr-1" />
                    RCTIs
                  </Button>
                </Flex>
              </GridItem>

              <GridItem
                pl="2"
                area={"main"}
                h={{
                  base: "calc(100vh - 130px)",
                  md: "calc(100vh - 97px)",
                  xl: "calc(100vh - 97px)",
                }}
                backgroundColor="white"
              >
                {tabId == 0 && (
                  <FormControl>
                    <Flex
                      justifyContent="space-between"
                      alignItems="center"
                      mb="24px"
                      className="mt-8"
                    >
                      <h2 className="mb-0">Profile</h2>

                      <Flex>
                        <AreYouSureAlert
                          onDelete={handleDeleteDriver}
                        ></AreYouSureAlert>
                        <Button
                          fontSize="sm"
                          variant="brand"
                          fontWeight="500"
                          w="100%"
                          mb="0"
                          ms="10px"
                          onClick={() => handleUpdateDriver()}
                          isLoading={driverLoading}
                        >
                          Update
                        </Button>
                      </Flex>
                    </Flex>

                    <Divider />

                    <h3 className="mt-6 mb-4">Details</h3>
                    <Flex alignItems="center" mb="16px">
                      <FormLabel
                        display="flex"
                        mb="0"
                        width="200px"
                        fontSize="sm"
                        fontWeight="500"
                        color={textColor}
                      >
                        Completed induction/WHS?
                      </FormLabel>
                      <Checkbox
                        isRequired={true}
                        variant="main"
                        width="100%"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="is_inducted"
                        value={driver.is_inducted == true ? 1 : 0}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            is_inducted: e.target.checked,
                          })
                        }
                        defaultChecked={driver.is_inducted}
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
                        Driver ID
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="driver_no"
                        value={driver.driver_no}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        First Name
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="first_name"
                        value={driver.first_name}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder="John"
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
                        Last Name
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="last_name"
                        value={driver.last_name}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder="Doe"
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
                        Phone number
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="phone_no"
                        value={driver.phone_no}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Email address
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="email"
                        value={driver.email}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Trading Name
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="trading_name"
                        value={driver.trading_name}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        ABN
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="abn"
                        value={driver.abn}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Years in operation
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="operation_year"
                        value={driver.operation_year}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Residential address
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="address"
                        readOnly
                        value={driver.address}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        onClick={() => setIsAddressModalOpen(true)}
                        placeholder=""
                        mb="0"
                        fontWeight="500"
                        size="lg"
                      />

                      <AddressesModal
                        defaultAddress={{ ...driver }}
                        isModalOpen={isAddressModalOpen}
                        description="Residential address"
                        onModalClose={(e) => setIsAddressModalOpen(e)}
                        onSetAddress={(address) => {
                          setDriver({ ...driver, ...address });
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
                        Availability
                      </FormLabel>
                      <Flex width="100%">
                        <Input
                          isRequired={true}
                          variant="main"
                          fontSize="sm"
                          width="250px"
                          ms={{ base: "0px", md: "0px" }}
                          type="number"
                          name="no_availability"
                          value={driver.no_availability}
                          onChange={(e) =>
                            setDriver({
                              ...driver,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          mb="0"
                          fontWeight="500"
                          size="lg"
                        />
                        <FormLabel
                          display="flex"
                          mb="0"
                          className="ml-4 pt-3"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          Days a week
                        </FormLabel>
                      </Flex>
                    </Flex>

                    <Divider />

                    <h3 className="mt-6 mb-4">License Details</h3>

                    <Flex alignItems="center" mb="16px">
                      <FormLabel
                        display="flex"
                        mb="0"
                        width="200px"
                        fontSize="sm"
                        fontWeight="500"
                        color={textColor}
                      >
                        Licence No.
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="license_no"
                        value={driver.license_no}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        State
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="license_state"
                        value={driver.license_state}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Expire
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="date"
                        name="license_expire_at"
                        value={driver.license_expire_at}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Photo of license
                      </FormLabel>
                      <Flex width="100%">
                        {
                          // loop to show images
                          driver.license_media &&
                            driver.license_media.map((image, index) => (
                              <Flex
                                key={index}
                                alignItems="center"
                                justifyContent="center"
                                width="130px"
                                height="130px"
                                border="1px solid #E2E8F0"
                                borderRadius="4px"
                                mr="4"
                              >
                                <Image
                                  src={image.downloadable_url}
                                  alt={image.name}
                                  width="100%"
                                  height="100%"
                                  objectFit="cover"
                                />
                              </Flex>
                            ))
                        }
                        <FileInput
                          width="130px"
                          height="130px"
                          entity="Driver"
                          description="Upload license"
                          entityId={driver.id}
                          onUpload={() => getDriver()}
                          collection_name="license"
                        ></FileInput>
                      </Flex>
                    </Flex>

                    <Divider />

                    <h3 className="mt-6 mb-4">Admin</h3>

                    <Flex alignItems="center" mb="16px">
                      <FormLabel
                        display="flex"
                        mb="0"
                        width="200px"
                        fontSize="sm"
                        fontWeight="500"
                        color={textColor}
                      >
                        Map route colour
                      </FormLabel>

                      <Flex width="100%">
                        <Input
                          width="30px"
                          type="color"
                          isRequired={true}
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          name="color"
                          padding="0px"
                          value={driver.color}
                          onChange={(e) =>
                            setDriver({
                              ...driver,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          mb="0"
                          fontWeight="500"
                          size="lg"
                        />
                      </Flex>
                    </Flex>
                  </FormControl>
                )}

                {tabId == 1 && (
                  <FormControl>
                    <Flex
                      justifyContent="space-between"
                      alignItems="center"
                      mb="24px"
                      className="mt-8"
                    >
                      <h2 className="mb-0">Vehicle Details</h2>

                      <Flex>
                        <Button
                          fontSize="sm"
                          variant="brand"
                          fontWeight="500"
                          w="100%"
                          mb="0"
                          ms="10px"
                          onClick={() => handleUpdateDriver()}
                          isLoading={driverLoading}
                        >
                          Update
                        </Button>
                      </Flex>
                    </Flex>

                    <Divider />

                    <Flex alignItems="center" mb="16px" mt="18px">
                      <FormLabel
                        display="flex"
                        mb="0"
                        width="200px"
                        fontSize="sm"
                        fontWeight="500"
                        color={textColor}
                      >
                        Is Vehicle Roadworthy
                      </FormLabel>

                      <Flex width="100%">
                        <RadioGroup
                          defaultValue={
                            driver.is_vehicle_roadworthy ? "1" : "0"
                          }
                          onChange={(e) => {
                            setDriver({
                              ...driver,
                              is_vehicle_roadworthy: e === "1" ? true : false,
                            });
                          }}
                        >
                          <Stack direction="row">
                            <Radio value="1">Yes</Radio>
                            <Radio value="0">No</Radio>
                          </Stack>
                        </RadioGroup>
                      </Flex>
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
                        Vehicle Class
                      </FormLabel>

                      <Box width="100%">
                        <Select
                          placeholder="Select Status"
                          defaultValue={vehicleClasses.find(
                            (vehicle_class) =>
                              vehicle_class.value === driver.vehicle_class_id,
                          )}
                          options={vehicleClasses}
                          onChange={(e) => {
                            setDriver({
                              ...driver,
                              vehicle_class_id: e.value || null,
                            });
                          }}
                        ></Select>
                      </Box>
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
                        Vehicle Type
                      </FormLabel>

                      <Box width="100%">
                        <Select
                          placeholder="Select Status"
                          defaultValue={vehicleTypes.find(
                            (vehicle_type) =>
                              vehicle_type.value === driver.vehicle_type_id,
                          )}
                          options={vehicleTypes}
                          onChange={(e) => {
                            setDriver({
                              ...driver,
                              vehicle_type_id: e.value || null,
                            });
                          }}
                        ></Select>
                      </Box>
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
                        Transmission Type
                      </FormLabel>

                      <Box width="100%">
                        <Select
                          placeholder="Select Status"
                          defaultValue={transmissionTypes.find(
                            (transmissionType) =>
                              transmissionType.value ===
                              driver.transmission_type_id,
                          )}
                          options={transmissionTypes}
                          onChange={(e) => {
                            setDriver({
                              ...driver,
                              transmission_type_id: e.value || null,
                            });
                          }}
                        ></Select>
                      </Box>
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
                        Does it have a tailgate?
                      </FormLabel>

                      <Flex width="100%">
                        <RadioGroup
                          defaultValue={driver.is_tailgated ? "1" : "0"}
                          onChange={(e) => {
                            setDriver({
                              ...driver,
                              is_tailgated: e === "1" ? true : false,
                            });
                          }}
                        >
                          <Stack direction="row">
                            <Radio value="1">Yes</Radio>
                            <Radio value="0">No</Radio>
                          </Stack>
                        </RadioGroup>
                      </Flex>
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
                        Does it have sidegates?
                      </FormLabel>
                      <Flex width="100%">
                        <RadioGroup
                          defaultValue={driver.is_sidegated ? "1" : "0"}
                          onChange={(e) => {
                            setDriver({
                              ...driver,
                              is_sidegated: e === "1" ? true : false,
                            });
                          }}
                        >
                          <Stack direction="row">
                            <Radio value="1">Yes</Radio>
                            <Radio value="0">No</Radio>
                          </Stack>
                        </RadioGroup>
                      </Flex>
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
                        Max pallets
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="number"
                        name="no_max_pallets"
                        value={driver.no_max_pallets}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: parseInt(e.target.value),
                          })
                        }
                        placeholder=""
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
                        Max load capacity
                      </FormLabel>

                      <Flex width="100%">
                        <Input
                          isRequired={true}
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          type="number"
                          name="no_max_capacity"
                          value={driver.no_max_capacity}
                          onChange={(e) =>
                            setDriver({
                              ...driver,
                              [e.target.name]: parseInt(e.target.value),
                            })
                          }
                          placeholder=""
                          mb="0"
                          fontWeight="500"
                          size="lg"
                          width="40%"
                        />
                        <FormLabel
                          display="flex"
                          mb="0"
                          mt="3"
                          pl="10px"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          kg
                        </FormLabel>
                      </Flex>
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
                        Max cubic metre
                      </FormLabel>
                      <Flex width="100%">
                        <Input
                          isRequired={true}
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          type="number"
                          name="no_max_volume"
                          value={driver.no_max_volume}
                          onChange={(e) =>
                            setDriver({
                              ...driver,
                              [e.target.name]: parseInt(e.target.value),
                            })
                          }
                          placeholder=""
                          mb="0"
                          fontWeight="500"
                          size="lg"
                          width="40%"
                        />
                        <FormLabel
                          display="flex"
                          mb="0"
                          mt="3"
                          pl="10px"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          cbm
                        </FormLabel>
                      </Flex>
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
                        Vehicle length
                      </FormLabel>

                      <Flex width="100%">
                        <Input
                          isRequired={true}
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          type="number"
                          name="no_max_length"
                          value={driver.no_max_length}
                          onChange={(e) =>
                            setDriver({
                              ...driver,
                              [e.target.name]: parseInt(e.target.value),
                            })
                          }
                          placeholder=""
                          mb="0"
                          fontWeight="500"
                          size="lg"
                          width="40%"
                        />
                        <FormLabel
                          display="flex"
                          mb="0"
                          mt="3"
                          pl="10px"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          m
                        </FormLabel>
                      </Flex>
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
                        Vehicle height
                      </FormLabel>

                      <Flex width="100%">
                        <Input
                          isRequired={true}
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          type="number"
                          name="no_max_height"
                          value={driver.no_max_height}
                          onChange={(e) =>
                            setDriver({
                              ...driver,
                              [e.target.name]: parseInt(e.target.value),
                            })
                          }
                          placeholder=""
                          mb="0"
                          fontWeight="500"
                          size="lg"
                          width="40%"
                        />
                        <FormLabel
                          display="flex"
                          mb="0"
                          mt="3"
                          pl="10px"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          m
                        </FormLabel>
                      </Flex>
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
                        Registration number
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="registration_no"
                        value={driver.registration_no}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Year of manufacture
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="vehicle_year"
                        value={driver.vehicle_year}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Make
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="vehicle_make"
                        value={driver.vehicle_make}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Model
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="vehicle_model"
                        value={driver.vehicle_model}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Photos of vehicle
                      </FormLabel>
                      <Flex width="100%">
                        {
                          // loop to show images
                          driver.vehicle_media &&
                            driver.vehicle_media.map((image, index) => (
                              <Flex
                                key={index}
                                alignItems="center"
                                justifyContent="center"
                                width="130px"
                                height="130px"
                                border="1px solid #E2E8F0"
                                borderRadius="4px"
                                mr="4"
                              >
                                <Image
                                  src={image.downloadable_url}
                                  alt={image.name}
                                  width="100%"
                                  height="100%"
                                  objectFit="cover"
                                />
                              </Flex>
                            ))
                        }
                        <FileInput
                          width="130px"
                          height="130px"
                          entity="Driver"
                          description="Upload photo"
                          entityId={driver.id}
                          onUpload={() => getDriver()}
                          collection_name="vehicle"
                        ></FileInput>
                      </Flex>
                    </Flex>
                  </FormControl>
                )}
                {tabId == 2 && (
                  <FormControl>
                    <Flex
                      justifyContent="space-between"
                      alignItems="center"
                      mb="24px"
                      className="mt-8"
                    >
                      <h2 className="mb-0">
                        Recipient Created Tax Invoices (RCTI)
                      </h2>

                      <Flex>
                        <Button
                          fontSize="sm"
                          variant="brand"
                          fontWeight="500"
                          w="100%"
                          mb="0"
                          ms="10px"
                          onClick={() => handleUpdateDriver()}
                          isLoading={driverLoading}
                        >
                          Update
                        </Button>
                      </Flex>
                    </Flex>

                    <Divider />

                    <h3 className="mt-6 mb-4">Payment Details</h3>

                    <Flex alignItems="center" mb="16px">
                      <FormLabel
                        display="flex"
                        mb="0"
                        width="200px"
                        fontSize="sm"
                        fontWeight="500"
                        color={textColor}
                      >
                        Account name
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="bank_account_name"
                        value={driver.bank_account_name}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        BSB
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="bank_bsb"
                        value={driver.bank_bsb}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Account Number
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="bank_account_number"
                        value={driver.bank_account_number}
                        onChange={(e) =>
                          setDriver({
                            ...driver,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
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
                        Pay rate (%)
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="pay_rate_percentage"
                        value={driverPayRatePercentage}
                        onChange={(e) => {
                          setDriverPayRatePercentage(
                            parseFloat(e.target.value),
                          );
                          setDriver({
                            ...driver,
                            pay_rate: parseFloat(e.target.value) / 100,
                          });
                        }}
                        placeholder=""
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
                        Fuel/Toll rate (%)
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="toll_rate_percentage"
                        value={driverLevyRatePercentage}
                        onChange={(e) => {
                          setDriverLevyRatePercentage(
                            parseFloat(e.target.value),
                          );
                          setDriver({
                            ...driver,
                            levy_rate: parseFloat(e.target.value),
                          });
                        }}
                        placeholder=""
                        mb="0"
                        fontWeight="500"
                        size="lg"
                      />
                    </Flex>
                    <Divider my="48px" />
                    <Flex alignItems="center" mb="16px">
                      {!loading && invoices?.invoices.data.length >= 0 && (
                        <PaginationTable
                          columns={columns}
                          data={invoices?.invoices.data}
                          options={{
                            initialState: {
                              pageIndex: queryPageIndex,
                              pageSize: queryPageSize,
                            },
                            manualPagination: true,
                            pageCount:
                              invoices?.invoices.paginatorInfo.lastPage,
                          }}
                          setQueryPageIndex={setQueryPageIndex}
                          setQueryPageSize={setQueryPageSize}
                          isServerSide
                          path="/admin/invoices"
                        />
                      )}
                    </Flex>
                  </FormControl>
                )}
              </GridItem>
            </Grid>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default DriverEdit;
