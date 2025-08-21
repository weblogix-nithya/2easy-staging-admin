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
  Input,
  Textarea,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import AddressesModal from "components/addresses/AddressesModal";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { CREATE_DRIVER_MUTATION, defaultDriver } from "graphql/driver";
import { GET_DRIVER_STATUSES_QUERY } from "graphql/driverStatus";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function DriverCreate() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  const [driver, setDriver] = useState(defaultDriver);
  const [driverStatuses, setDriverStatuses] = useState([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [tabId, setTabId] = useState(0);
  const router = useRouter();
  // const { id } = router.query;

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

  const [handleDriverCreate, {}] = useMutation(CREATE_DRIVER_MUTATION, {
    variables: {
      input: {
        ...driver,
        id: undefined,
        media_url: undefined,
        full_name: undefined,
        license_media: undefined,
        vehicle_media: undefined,
        remaining_time: undefined,
        current_occupied_capacity: undefined,
      },
    },
    onCompleted: (data) => {
      toast({
        title: "Driver Created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push(`/admin/drivers/${data.createDriver.id}`);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
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
          {
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
                      <h2 className="mb-0">New Driver</h2>

                      <Flex>
                        <Button
                          fontSize="sm"
                          variant="brand"
                          fontWeight="500"
                          w="100%"
                          mb="0"
                          ms="10px"
                          onClick={() => handleDriverCreate()}
                        >
                          Create
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
                              [e.target.name]: parseInt(e.target.value),
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
              </GridItem>
            </Grid>
          }
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default DriverCreate;
