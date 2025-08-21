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
  // Select,
  Stack,
  Textarea,
  useColorModeValue,
  useToast} from "@chakra-ui/react";
// Font awesome icons
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faMapLocationDot } from "@fortawesome/free-solid-svg-icons";
import { faTruck } from "@fortawesome/free-solid-svg-icons";
import { faTruckFast } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AreYouSureAlert from "components/alert/AreYouSureAlert";
import CustomerAddressesTab from "components/customers/CustomerAddressesTab";
import CustomerJobsTab from "components/customers/CustomerJobsTab";
import CustomerVehicleHiresTab from "components/customers/CustomerVehicleHiresTab";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  defaultCustomer,
  DELETE_CUSTOMER_MUTATION,
  GET_CUSTOMER_QUERY,
  UPDATE_CUSTOMER_MUTATION,
} from "graphql/customer";
import AdminLayout from "layouts/admin";
// import debounce from "lodash.debounce";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState} from "react";

function CustomerEdit() {
  const toast = useToast();
  // let menuBg = useColorModeValue("white", "navy.800");
  const textColor = useColorModeValue("navy.700", "white");
  // //  const textColorSecondary = "gray.400";
  const [customer, setCustomer] = useState(defaultCustomer);
  const [tabId, setTabId] = useState(0);
  const router = useRouter();
  const { id } = router.query;

  const {
    loading: customerLoading,
    // data: customerData,
    // refetch: getCustomer,
  } = useQuery(GET_CUSTOMER_QUERY, {
    variables: {
      id: id,
    },
    skip: !id,
    onCompleted: (data) => {
      if (data?.customer == null) {
        router.push("/admin/customers");
      }
      setCustomer({ ...customer, ...data?.customer });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [handleUpdateCustomer, {}] = useMutation(UPDATE_CUSTOMER_MUTATION, {
    variables: {
      input: customer,
    },
    onCompleted: (_data) => {
      toast({
        title: "Customer updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteCustomer, {}] = useMutation(DELETE_CUSTOMER_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (_data) => {
      toast({
        title: "Customer deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/customers");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  // const [queryPageIndex, setQueryPageIndex] = useState(0);
  // const [queryPageSize, setQueryPageSize] = useState(50);
  // const [searchQuery, setSearchQuery] = useState("");

  // const _onChangeSearchQuery = useMemo(() => {
  //   return debounce((e) => {
  //     setSearchQuery(e);
  //     setQueryPageIndex(0);
  //   }, 300);
  // }, []);




  return (
    <AdminLayout>
      <Box
        className="mk-customers-id overflow-auto"
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
          {!customerLoading && (
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
                  <h2 className="mt-10 mb-4">{!customer.name && "Customer"}</h2>

                  <FormLabel
                    display="flex"
                    ms="4px"
                    fontSize="sm"
                    fontWeight="500"
                    color={textColor}
                    mb="8px"
                  >
                    Admin Notes
                  </FormLabel>
                  <Textarea
                    name="admin_notes"
                    value={customer.admin_notes || ""}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        [e.target.name]: e.target.value,
                      })
                    }
                    placeholder="Admin Notes"
                    mb="16px"
                    fontSize="sm"
                  />

                  <FormLabel
                    display="flex"
                    ms="4px"
                    fontSize="sm"
                    fontWeight="500"
                    color={textColor}
                    mb="8px"
                  >
                    Base Notes
                  </FormLabel>
                  <Textarea
                    fontSize="sm"
                    name="base_notes"
                    value={customer.base_notes|| ""}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        [e.target.name]: e.target.value,
                      })
                    }
                    placeholder="Admin Notes"
                  />
                  <p className="mt-2 text-[10px] text-[var(--chakra-colors-black-500)] font-medium">
                    Base notes are displayed to drivers on all jobs placed by
                    this customer
                  </p>
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
                    <FontAwesomeIcon icon={faMapLocationDot} className="mr-1" />
                    Addresses
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
                    <FontAwesomeIcon icon={faTruck} className="mr-1" />
                    Delivery Jobs
                  </Button>
                  <Button
                    disabled={tabId == 3}
                    onClick={() => setTabId(3)}
                    alignItems="start"
                    h={45}
                    fontSize="14px"
                    className={
                      "!items-center !justify-start !font-medium !rounded-none " +
                      (tabId == 3
                        ? "text-white !bg-[var(--chakra-colors-primary-400)] "
                        : "text-[var(--chakra-colors-black-400)] !bg-white")
                    }
                  >
                    <FontAwesomeIcon icon={faTruckFast} className="mr-1" />
                    Hourly Hires
                  </Button>
                </Flex>
              </GridItem>

              {/* Right side */}
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
                          onDelete={handleDeleteCustomer}
                        ></AreYouSureAlert>
                        <Button
                          fontSize="sm"
                          variant="brand"
                          fontWeight="500"
                          w="100%"
                          mb="0"
                          ms="10px"
                          onClick={() => handleUpdateCustomer()}
                          isLoading={customerLoading}
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
                        First Name
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="first_name"
                        value={customer.first_name}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
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
                        value={customer.last_name}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
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
                        Full Name
                      </FormLabel>
                      <Input
                        disabled
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="full_name"
                        value={`${customer.first_name} ${customer.last_name}`}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
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
                        ABN
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="abn"
                        value={customer.abn}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
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
                        Phone Number
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="phone_no"
                        value={customer.phone_no}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
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
                        Email
                      </FormLabel>
                      <Input
                        isRequired={true}
                        variant="main"
                        fontSize="sm"
                        ms={{ base: "0px", md: "0px" }}
                        type="text"
                        name="email"
                        value={customer.email}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            [e.target.name]: e.target.value,
                          })
                        }
                        placeholder=""
                        mb="0"
                        fontWeight="500"
                        size="lg"
                      />
                    </Flex>

                    <Flex
                      alignItems="flex-end"
                      flexDirection="column"
                      mb="16px"
                      className="w-full"
                    >
                      <Flex className="w-full" alignItems="center">
                        <FormLabel
                          display="flex"
                          mb="0"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          Company Name
                        </FormLabel>

                        <Input
                          disabled={customer.company_id !== null}
                          isRequired={true}
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          type="text"
                          name="company_name"
                          value={customer.company_name}
                          onChange={(e) =>
                            setCustomer({
                              ...customer,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          mb="0"
                          fontWeight="500"
                          size="lg"
                        />
                      </Flex>

                      {customer.company_id !== null && (
                        <Link
                          href={`/admin/companies/${customer.company_id}`}
                          className="mt-3 text-[var(--chakra-colors-primary-400)]"
                        >
                          Go to company
                        </Link>
                      )}
                    </Flex>

                    <Flex
                      alignItems="flex-end"
                      flexDirection="column"
                      mb="16px"
                      className="w-full"
                    >
                      <Flex className="w-full" alignItems="center">
                        <FormLabel
                          display="flex"
                          mb="0"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          Company Admin
                        </FormLabel>

                        <RadioGroup
                          value={customer.is_company_admin ? "1" : "0"}
                          onChange={(e) => {
                            setCustomer({
                              ...customer,
                              is_company_admin: e === "1" ? true : false,
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
                      </Flex>
                    </Flex>

                    <Flex
                      alignItems="flex-end"
                      flexDirection="column"
                      mb="16px"
                      className="w-full"
                    >
                      <Flex className="w-full" alignItems="center">
                        <FormLabel
                          display="flex"
                          mb="0"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          Send POD
                        </FormLabel>

                        <RadioGroup
                          value={customer.is_pod_sendable ? "1" : "0"}
                          onChange={(e) => {
                            setCustomer({
                              ...customer,
                              is_pod_sendable: e === "1" ? true : false,
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
                      </Flex>
                    </Flex>

                    <Flex
                      alignItems="flex-end"
                      flexDirection="column"
                      mb="16px"
                      className="w-full"
                    >
                      <Flex className="w-full" alignItems="center">
                        <FormLabel
                          display="flex"
                          mb="0"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          Send Invoice
                        </FormLabel>

                        <RadioGroup
                          value={customer.is_invoice_sendable ? "1" : "0"}
                          onChange={(e) => {
                            setCustomer({
                              ...customer,
                              is_invoice_sendable: e === "1" ? true : false,
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
                      </Flex>
                    </Flex>

                   
                </FormControl>

                )}

                {tabId == 1 && (
                  <CustomerAddressesTab
                    customer={customer}
                  ></CustomerAddressesTab>
                )}

                {tabId == 2 && (
                  <CustomerJobsTab customer={customer}></CustomerJobsTab>
                )}

                {tabId == 3 && (
                  <CustomerVehicleHiresTab
                    customer={customer}
                  ></CustomerVehicleHiresTab>
                )}

              
              </GridItem>
            </Grid>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default CustomerEdit;
