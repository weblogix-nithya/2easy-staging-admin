// External Library Imports
import { useMutation, useQuery } from "@apollo/client";
// Chakra UI Imports
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
  Link,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Switch,
  Textarea,
  useColorModeValue,
  // useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { faGear } from "@fortawesome/free-solid-svg-icons";
// FontAwesome Imports
// import { faUserMinus } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
// Component Imports
import AddressesModal from "components/addresses/AddressesModal";
import FileInput from "components/fileInput/FileInput";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
// GraphQL Imports
import {
  defaultVendor,
  DELETE_VENDOR_MUTATION,
  GET_VENDOR_QUERY,
  GET_VENDOR_SERVICES_QUERY,
  paymentTerms,
  UPDATE_VENDOR_MUTATION,
} from "graphql/vendor";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

function VendorEdit() {
  const toast = useToast();
  let menuBg = useColorModeValue("white", "navy.800");
  const textColor = useColorModeValue("navy.700", "white");
  // //  const textColorSecondary = "gray.400";
  const [vendor, setVendor] = useState(defaultVendor);
  const [originalVendor, setOriginalVendor] = useState(defaultVendor); // Track the original vendor data

  const [isVendorSetting, setIsVendorSetting] = useState(0);
  // const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { id } = router.query;
  // const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const {
    loading: vendorLoading,
    data: vendorData,
    // refetch: getVendor,
  } = useQuery(GET_VENDOR_QUERY, {
    variables: {
      id: id,
    },
    skip: typeof id === 'undefined' || id === null,
    onCompleted: (data) => {
      if (data?.vendor == null) {
        // router.push("/admin/vendors");
      }
      const vendorWithDate = { ...data.vendor };
      setVendor(vendorWithDate); // Ensure updated_at is a Date object
      setOriginalVendor(vendorWithDate); // Set the original vendor data
      // console.log(data.vendor, 'ck');
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const currentVendorId = Number(vendorData?.vendor?.id);
  console.log(currentVendorId, 'ck')
  const [handleUpdateVendor] = useMutation(UPDATE_VENDOR_MUTATION, {
    variables: {
      id: currentVendorId!, // Pass ID separately
      input: {
        name: vendor?.name,
        abn: vendor?.abn,
        contact_phone: vendor?.contact_phone,
        contact_email: vendor?.contact_email,
        account_email: vendor?.account_email,
        address: vendor?.address,
        address_business_name: vendor?.address_business_name,
        address_line_1: vendor?.address_line_1,
        address_line_2: vendor?.address_line_2,
        address_city: vendor?.address_city,
        address_postal_code: vendor?.address_postal_code,
        address_state: vendor?.address_state,
        address_country: vendor?.address_country,
        lng: vendor?.lng,
        lat: vendor?.lat,
        lcl_rate: vendor?.lcl_rate,
        is_pod_sendable: vendor?.is_pod_sendable,
        is_invoice_sendable: vendor?.is_invoice_sendable,
        admin_notes: vendor?.admin_notes,
        base_notes: vendor?.base_notes,
        account_name: vendor?.account_name,
        account_number: vendor?.account_number,
        bsb_code: vendor?.bsb_code,
        on_hold: vendor?.on_hold,
        payment_term: vendor?.payment_term ?? null,
        vendor_service_id: typeof vendor?.vendor_service_id === "string"
          ? parseInt(vendor.vendor_service_id, 10)
          : vendor?.vendor_service_id, // Ensure this is an Int
        // Remove vendor_service if it exists in the object
      },
    },
    onCompleted: (_data) => {
      toast({
        title: "Vendor updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setVendor({ ...vendor }); // Update vendor's updated_at to current date
      setOriginalVendor(vendor); // Reset the original vendor data after successful update
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  

  const isFormDirty = useMemo(() => {
    return JSON.stringify(vendor) !== JSON.stringify(originalVendor);
  }, [vendor, originalVendor]);


//     function handleUpdateVendorWrapper() {
// let ven={ ...vendor, updated_at: currentDateTime, id: id }

//     console.log("Vendor data before API call:", ven);
//     // handleUpdateVendor(); // Invoke the mutation function
//   }

  const [_handleDeleteVendor, { }] = useMutation(DELETE_VENDOR_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (_data) => {
      toast({
        title: "Vendor deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/vendors");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  const [temporaryMedia, setTemporaryMedia] = useState([]);

  const [_queryPageIndex, setQueryPageIndex] = useState(0);
  // const [queryPageSize, setQueryPageSize] = useState(100);
  const [_searchQuery, setSearchQuery] = useState("");

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

  const handleRemoveFromTemporaryMedia = (id: number) => {
    let _temporaryMedia = [...temporaryMedia];
    _temporaryMedia = _temporaryMedia.filter((e) => e.id !== id);
    setTemporaryMedia(_temporaryMedia);
  };

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  // // const [availableCustomersOptions, setAvailableCustomersOptions] = useState(
  //   [],
  // );
  const [_searchAvailableCustomerQuery, _setSearchAvailableCustomerQuery] =
    useState("");

  // const [selectCustomerId, setSelectCustomerId] = useState(null);

  // const onChangeSearchAvailableCustomerQuery = useMemo(() => {
  //   return debounce((e) => {
  //     setSearchAvailableCustomerQuery(e);
  //   }, 300);
  // }, []);

  // const columns = useMemo(
  //   () => [
  //     {
  //       Header: "First Name",
  //       accessor: "first_name" as const,
  //     },
  //     {
  //       Header: "Last Name",
  //       accessor: "last_name" as const,
  //     },
  //     {
  //       Header: "Phone Number",
  //       accessor: "phone_no" as const,
  //     },
  //     {
  //       Header: "Vendor Role",
  //       accessor: "is_vendor_admin" as const,
  //       trueLabel: "Admin",
  //       falseLabel: "User",
  //       type: "boolean",
  //     },
  //     {
  //       Header: "Send POD",
  //       accessor: "is_pod_sendable" as const,
  //       trueLabel: "Yes",
  //       falseLabel: "No",
  //       type: "boolean",
  //     },
  //     {
  //       Header: "Send Invoice",
  //       accessor: "is_invoice_sendable" as const,
  //       trueLabel: "Yes",
  //       falseLabel: "No",
  //       type: "boolean",
  //     },
  //     {
  //       Header: "Email",
  //       accessor: "email" as const,
  //     },
  //     {
  //       Header: "Actions",
  //       accessor: "id" as const,
  //       isDelete: true,
  //       isView: true,
  //       isEdit: false,
  //       deleteIcon: faUserMinus,
  //     },
  //   ],
  //   [],
  // );

  const {
    loading: vendorServicesLoading,
    error: vendorServicesError,
    data: vendorServicesData,
  } = useQuery(GET_VENDOR_SERVICES_QUERY);

  if (vendorServicesError) {
    console.error("Error getting vendor services", vendorServicesError);
  }

  const vendorServiceOptions = vendorServicesData?.vendorServices.map((service: any) => ({
    label: service.service_name,
    value: service.id,
  }));


  useEffect(() => {
    if (vendorData?.vendor) {
      setVendor((prev) => ({
        ...prev,
        ...vendorData.vendor,
        vendor_service_id: String(vendorData.vendor.vendor_service_id), // Convert to string
      }));
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorData]);
  
  
  // const {
  //   loading: availableCustomersLoading,
  //   data: availableCustomers,
  //   refetch: getAvailableCustomers,
  // } = useQuery(GET_CUSTOMERS_QUERY, {
  //   variables: {
  //     query: searchQuery,
  //     page: queryPageIndex + 1,
  //     first: queryPageSize,
  //     orderByColumn: "id",
  //     orderByOrder: "ASC",
  //     vendor_id: null,
  //   },
  //   onCompleted: (data) => {
  //     setAvailableCustomersOptions([]);
  //     data.customers.data.map((customer: any) => {
  //       setAvailableCustomersOptions((availableCustomersOptions) => [
  //         ...availableCustomersOptions,
  //         { value: parseInt(customer.id), label: customer.email },
  //       ]);
  //     });
  //   },
  // });

  // const {
  //   loading,
  //   error,
  //   data: customers,
  //   refetch: getCustomers,
  // } = useQuery(GET_CUSTOMERS_QUERY, {
  //   variables: {
  //     query: searchQuery,
  //     page: queryPageIndex + 1,
  //     first: queryPageSize,
  //     orderByColumn: "id",
  //     orderByOrder: "ASC",
  //     vendor_id: id,
  //   },
  // });

  // const [addCustomerToVendor, { }] = useMutation(UPDATE_CUSTOMER_MUTATION, {
  //   variables: {
  //     input: {
  //       id: selectCustomerId,
  //       vendor_id: id,
  //     },
  //   },
  //   onCompleted: (data) => {
  //     toast({
  //       title: "Customer updated",
  //       status: "success",
  //       duration: 3000,
  //       isClosable: true,
  //     });
  //     onClose();
  //     getCustomers();
  //     getAvailableCustomers();
  //   },
  //   onError: (error) => {
  //     showGraphQLErrorToast(error);
  //   },
  // });

  // const [removeCustomerFromVendor, { }] = useMutation(
  //   UPDATE_CUSTOMER_MUTATION,
  //   {
  //     variables: {
  //       input: {
  //         id: selectCustomerId,
  //         vendor_id: null,
  //       },
  //     },
  //     onCompleted: (data) => {
  //       toast({
  //         title: "Customer removed",
  //         status: "success",
  //         duration: 3000,
  //         isClosable: true,
  //       });
  //       getCustomers();
  //       getAvailableCustomers();
  //     },
  //     onError: (error) => {
  //       showGraphQLErrorToast(error);
  //     },
  //   },
  // );

  return (
    <AdminLayout>
      <Box
        className="mk-vendors-id"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
      >
        {/* Main Fields */}
        <Grid pr="24px">
          {!vendorLoading && (
            <>
              <Grid
                templateAreas={`"nav main"`}
                gridTemplateRows={"90vh"}
                gridTemplateColumns={"25% 1fr"}
                h="auto"
                gap="1"
                color="blackAlpha.700"
                fontWeight="bold"
              >
                {/* Left side */}
                <GridItem
                  area={"nav"}
                  className="border-r border-[var(--chakra-colors-gray-200)]"
                >
                  <Box mx="26px">
                    <h2 className="mt-10 mb-4">{vendor?.name}</h2>
                  </Box>

                  {/* Left side buttons */}
                  <Flex mt={8} flexDirection="column" className="border-b">
                    <Button
                      disabled={isVendorSetting == 0}
                      onClick={() => setIsVendorSetting(0)}
                      alignItems="start"
                      h={45}
                      fontSize="14px"
                      className={
                        isVendorSetting == 0
                          ? "!items-center !justify-start !font-medium text-white !bg-[var(--chakra-colors-primary-400)] !rounded-none"
                          : "!items-center !justify-start !font-medium text-[var(--chakra-colors-black-400)] !bg-white !rounded-none"
                      }
                    >
                      <FontAwesomeIcon icon={faGear} className="mr-1" />
                      Vendor Settings
                    </Button>

                    {/* <Button
                      disabled={isVendorSetting == 1}
                      onClick={() => setIsVendorSetting(1)}
                      alignItems="start"
                      h={45}
                      fontSize="14px"
                      className={
                        isVendorSetting == 1
                          ? "!items-center !justify-start !font-medium !text-left text-white !bg-[var(--chakra-colors-primary-400)] !rounded-none"
                          : "!items-center !justify-start !font-medium text-[var(--chakra-colors-black-400)] !bg-white !rounded-none"
                      }
                    >
                      <FontAwesomeIcon icon={faUserLock} className="mr-1" />
                      Vendor Users
                    </Button>

                    <Button
                      disabled={isVendorSetting == 2}
                      onClick={() => setIsVendorSetting(2)}
                      alignItems="start"
                      h={45}
                      fontSize="14px"
                      className={
                        isVendorSetting == 2
                          ? "!items-center !justify-start !font-medium !text-left text-white !bg-[var(--chakra-colors-primary-400)] !rounded-none"
                          : "!items-center !justify-start !font-medium text-[var(--chakra-colors-black-400)] !bg-white !rounded-none"
                      }
                    >
                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-1" />
                      Invoices
                    </Button> */}
                  </Flex>
                </GridItem>

                {/* Right side */}
                <GridItem pl="2" area={"main"}>
                  {/* Vendor Settings */}
                  {isVendorSetting == 0 && (
                    <FormControl className="pb-10">
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb="24px"
                        className="mt-8"
                      >
                        <h2 className="mb-0">Vendor Settings</h2>
                        <Flex>
                          <Button
                            fontSize="sm"
                            lineHeight="19px"
                            variant="brand"
                            fontWeight="500"
                            w="100%"
                            h="50"
                            mb="0"
                            ms="10px"
                            className="!h-[39px]"
                            onClick={() => handleUpdateVendor()}
                            isLoading={vendorLoading}
                            disabled={!isFormDirty} // Disable button if form is not dirty
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
                          Name
                        </FormLabel>
                        <Input
                          isRequired={true}
                          variant="main"
                          value={vendor?.name}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          type="text"
                          name="name"
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
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          ABN
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="abn"
                          value={vendor?.abn}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
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
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Main contact number
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="contact_phone"
                          value={vendor?.contact_phone}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder="+61"
                          className="max-w-md"
                          variant="main"
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
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Main contact email
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="contact_email"
                          value={vendor?.contact_email}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
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
                          Payment Terms
                        </FormLabel>

                        <Box className="!max-w-md w-full">
                          <Select
                            placeholder="Select Payment Terms"
                            value={paymentTerms?.find((term) => term.value === vendor?.payment_term)}
                            options={paymentTerms}
                            onChange={(selectedOption) => {
                              setVendor({ ...vendor, payment_term: selectedOption?.value });
                              // console.log("Selected:", selectedOption);
                            }}
                            size="lg"
                            className="select mb-0"
                            classNamePrefix="two-easy-select"
                          />
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
                          Vendor Service
                        </FormLabel>

                        <Box className="!max-w-md w-full">
                        <Select
  key={vendor?.vendor_service_id}
  isLoading={vendorServicesLoading}
  placeholder="Select Vendor Service"
  value={vendorServiceOptions?.find(
    (service: any) => Number(service.value) === Number(vendor?.vendor_service_id)
  )}
  options={vendorServiceOptions}
  onChange={(selectedOption) => {
    setVendor((prev) => ({
      ...prev,
      vendor_service_id: selectedOption?.value,
    }));
  }}
  size="lg"
  className="select mb-0"
  classNamePrefix="two-easy-select"
/>

                        </Box>
                      </Flex>

                      <Flex alignItems="start" mb="16px">
                        <FormLabel
                          display="flex"
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Admin Notes
                        </FormLabel>

                        <Textarea
                          name="admin_notes"
                          value={vendor?.admin_notes}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          className="mb-4 max-w-md"
                          fontSize="sm"
                          rows={4}
                          placeholder="Admin Notes"
                        />
                      </Flex>

                      <Flex alignItems="start" mb="16px">
                        <FormLabel
                          display="flex"
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Base Notes
                        </FormLabel>

                        <Flex className="flex-col w-full max-w-md">
                          <Textarea
                            name="base_notes"
                            value={vendor?.base_notes}
                            onChange={(e) =>
                              setVendor({
                                ...vendor,
                                [e.target.name]: e.target.value,
                              })
                            }
                            fontSize="sm"
                            className="w-full max-w-md"
                            rows={4}
                            placeholder="Base Notes"
                          />
                          <p className=" bottom-[0] mt-2 text-[10px] text-[var(--chakra-colors-black-500)] font-medium">
                            Base notes are displayed to drivers on all jobs
                            placed by this customer
                          </p>
                        </Flex>
                      </Flex>

                      <Divider />
                      <h3 className="mt-6 mb-4">Billing</h3>
                      <Flex alignItems="center" mb="16px">
                        <FormLabel
                          display="flex"
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Accounts email
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="account_email"
                          value={vendor?.account_email}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          mb="0"
                          fontWeight="500"
                          size="lg"
                        />
                      </Flex>

                      <h4 className="mt-6 mb-4">Billing Address</h4>
                      <Flex alignItems="center" mb="16px">
                        <FormLabel
                          display="flex"
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Address
                        </FormLabel>
                        <Input
                          type="text"
                          name="address"
                          value={vendor?.address}
                          placeholder=""
                          className="max-w-md"
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          mb="0"
                          fontWeight="500"
                          size="lg"
                          onClick={() => setIsAddressModalOpen(true)}
                        />
                      </Flex>
                      <AddressesModal
                        defaultAddress={vendor}
                        isModalOpen={isAddressModalOpen}
                        description="Billing address"
                        onModalClose={(e) => setIsAddressModalOpen(e)}
                        onSetAddress={(target) => {
                          setVendor({ ...vendor, ...target });
                        }}
                      />
                      <Flex alignItems="center" mb="16px">
                        <FormLabel
                          display="flex"
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Address line 1
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="address_line_1"
                          value={vendor?.address_line_1}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
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
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Apt / Suite / Floor
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="address_line_2"
                          value={vendor?.address_line_2}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
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
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Address city
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="address_city"
                          value={vendor?.address_city}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
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
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Address state
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="address_state"
                          value={vendor?.address_state}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
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
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Address postcode
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="address_postal_code"
                          value={vendor?.address_postal_code}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          mb="0"
                          fontWeight="500"
                          size="lg"
                        />
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
                          Account Name
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="account_name"
                          value={vendor?.account_name}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
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
                          BSB
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="bsb_code"
                          value={vendor?.bsb_code}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
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
                          Account Number
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="account_number"
                          value={vendor?.account_number}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          mb="0"
                          fontWeight="500"
                          size="lg"
                        />
                      </Flex>

                      <Flex alignItems="center" mb="16px" className="max-w-md">
  <FormLabel
    htmlFor="on-hold-switch"
    display="flex"
    mb="0"
    width="200px"
    fontSize="sm"
    fontWeight="500"
    color="textColor"
  >
    On Hold
  </FormLabel>
  <Switch
    id="on-hold-switch"
    mt="auto"
    mb="auto"
    isChecked={Boolean(vendor?.on_hold)} // Ensuring it's always boolean
    onChange={(e) => {
      setVendor((prevVendor) => ({
        ...prevVendor,
        on_hold: e.target.checked,
      }));
    }}
  />
</Flex>


                      <Divider />

                      <h3 className="mt-6 mb-4">Rates</h3>

                      <Flex alignItems="center" mb="16px">
                        <FormLabel
                          display="flex"
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          LCL Rate
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="number"
                          name="lcl_rate"
                          value={vendor?.lcl_rate}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: parseFloat(e.target.value),
                            })
                          }
                          placeholder=""
                          className="max-w-md"
                          variant="main"
                          fontSize="sm"
                          ms={{ base: "0px", md: "0px" }}
                          mb="0"
                          fontWeight="500"
                          size="lg"
                        />
                      </Flex>
                      <Divider className="my-12" />

                      {/* Attachments */}
                      <Box mb="16px">
                        <h3 className="mb-5 mt-3">Attachments</h3>
                        <Flex width="100%" className="mb-6">
                          <FileInput
                            entity="Job"
                            entityId={vendor.id}
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

                        {/* foreach jobAttachments */}
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
                      <h3 className="mt-6 mb-4">Notifications</h3>
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
                          value={vendor?.is_pod_sendable ? "1" : "0"}
                          onChange={(e) => {
                            setVendor({
                              ...vendor,
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
                          value={vendor?.is_invoice_sendable ? "1" : "0"}
                          onChange={(e) => {
                            setVendor({
                              ...vendor,
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
                    </FormControl>
                  )}

                  {/* Vendor Users */}
                  {isVendorSetting == 1 && (
                    <>
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb="24px"
                        className="mt-8"
                      >
                        <h2 className="mb-0">Vendor Users</h2>
                        <Flex>
                          <Link
                            href={`/admin/customers/create?vendor_id=${id}`}
                            me="8px"
                          >
                            <Button
                              fontSize="sm"
                              variant="brand"
                              fontWeight="500"
                              lineHeight="19px"
                              w="100%"
                              h="50"
                              mb="0"
                              ms="10px"
                              className="!h-[39px]"
                            >
                              Create New
                            </Button>
                          </Link>

                          {/* <Button
                            fontSize="sm"
                            variant="brand"
                            fontWeight="500"
                            lineHeight="19px"
                            w="100%"
                            h="50"
                            mb="0"
                            ms="10px"
                            onClick={onOpen}
                            className="!h-[39px]"
                          >
                            Add existing
                          </Button>

                          <Modal isOpen={isOpen} onClose={onClose}>
                            <ModalOverlay />

                            <ModalContent>
                              <ModalHeader>Add existing customer</ModalHeader>
                              <ModalCloseButton />

                              <ModalBody>
                                <Divider mb="24px" />
                                <Text mb="24px">
                                  Search existing customers to add to this
                                  vendor
                                </Text>
                                <Box className="!max-w-md w-full">
                                  <Select
                                    placeholder="Select customer"
                                    options={availableCustomersOptions}
                                    onChange={(e) => {
                                      setSelectCustomerId(e.value);
                                    }}
                                    size="lg"
                                    className="select mb-0"
                                    classNamePrefix="two-easy-select"
                                  ></Select>
                                </Box>
                              </ModalBody>

                              <ModalFooter>
                                <Button
                                  variant="outline"
                                  mr="auto"
                                  onClick={onClose}
                                >
                                  Close
                                </Button>
                                <Button
                                  variant="primary"
                                  onClick={() => addCustomerToVendor()}
                                >
                                  Add to vendor
                                </Button>
                              </ModalFooter>
                            </ModalContent>
                          </Modal> */}
                        </Flex>
                      </Flex>

                      <Divider />

                      <Box pt={{ base: "40px", md: "40px", xl: "40px" }}>
                        <SimpleGrid
                          mb="20px"
                          columns={{ sm: 1 }}
                          spacing={{ base: "20px", xl: "20px" }}
                        >
                          <Flex minWidth="max-content">
                            <SearchBar
                              background={menuBg}
                              onChangeSearchQuery={onChangeSearchQuery}
                              me="10px"
                              borderRadius="30px"
                            />
                          </Flex>

                          {/* {!loading &&
                            customers?.customers.data.length >= 0 && (
                              <PaginationTable
                                columns={columns}
                                showDelete={true}
                                data={customers?.customers.data}
                                options={{
                                  initialState: {
                                    pageIndex: queryPageIndex,
                                    pageSize: queryPageSize,
                                  },
                                  manualPagination: true,
                                  pageCount:
                                    customers?.customers.paginatorInfo.lastPage,
                                }}
                                setQueryPageIndex={setQueryPageIndex}
                                setQueryPageSize={setQueryPageSize}
                                onDelete={(id: any) => {
                                  setSelectCustomerId(id);
                                  removeCustomerFromVendor();
                                }}
                                isServerSide
                                path="/admin/customers"
                              />
                            )} */}
                        </SimpleGrid>
                      </Box>
                    </>
                  )}
                  {/* Invoice */}
                  {/* {isVendorSetting == 2 && (
                    <>
                      {vendor?.id !== null && <InvoiceTab vendor_id={vendor?.id} />}

                    </>
                  )} */}
                </GridItem>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default VendorEdit;
