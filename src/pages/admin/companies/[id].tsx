// Built-in and React imports
// GraphQL imports
import { useMutation, useQuery } from "@apollo/client";
// Chakra UI imports
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  IconButton,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  faFileInvoiceDollar,
  faGear,
  faUserLock,
} from "@fortawesome/free-solid-svg-icons";
import { faUserMinus } from "@fortawesome/pro-regular-svg-icons";
import { faTimes } from "@fortawesome/pro-solid-svg-icons";
// External library imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
// Local components
import AddressesModal from "components/addresses/AddressesModal";
import InvoiceTab from "components/companies/InvoiceTab";
import FileInputLink from "components/fileInput/FileInputLink";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
// Local GraphQL queries and mutations
import {
  defaultCompany,
  // DELETE_COMPANY_MUTATION,
  GET_COMPANY_QUERY,
  paymentTerms,
  UPDATE_COMPANY_MUTATION,
} from "graphql/company";
import {
  CompanyRate,
  CREATE_COMPANY_RATE_MUTATION,
  DELETE_COMPANY_RATE_MUTATION,
  GET_COMPANY_RATE_QUERY,
  GET_LIST_OF_SEAFREIGHTS,
  UPDATE_COMPANY_RATE_MUTATION,
} from "graphql/CompanyRate";
import {
  GET_CUSTOMERS_QUERY,
  UPDATE_CUSTOMER_MUTATION,
} from "graphql/customer";
// Layout imports
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
// Next.js imports
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

interface Seafreight {
  value: number;
  label: string;
  cbm_rate: number;
  min_charge: number;
  state: string;
}

interface GroupedSeafreights {
  [key: string]: Seafreight[];
}

function CompanyEdit() {
  const toast = useToast();
  let menuBg = useColorModeValue("white", "navy.800");
  const textColor = useColorModeValue("navy.700", "white");
  // //  const textColorSecondary = "gray.400";
  const [company, setCompany] = useState(defaultCompany);
  const [initialCompany, setInitialCompany] = useState(defaultCompany);
  const [isCompanySetting, setIsCompanySetting] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { id } = router.query;
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [rateCardUrl, setRateCardUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [companyRate, setCompanyRate] = useState<Partial<CompanyRate>>({
    company_id: id as string,
    seafreight_id: null,
    area: "",
    cbm_rate: 0,
    minimum_charge: 0,
    state: "",
  });
  const [companyRates, setCompanyRates] = useState<CompanyRate[]>([]);
  const [prevCompanyRates, setPrevCompanyRates] = useState<CompanyRate[]>([]);
  const [isAddingRate, setIsAddingRate] = useState(false);
  const [groupedSeafreights, setGroupedSeafreights] =
    useState<GroupedSeafreights>({});
  const [stateOptions, setStateOptions] = useState([]);
  const [selectedState, setSelectedState] = useState("");

  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");

  const [newRate, setNewRate] = useState<CompanyRate>({
    id: undefined,
    company_id: "",
    seafreight_id: null,
    area: "",
    cbm_rate: 0,
    minimum_charge: 0,
    state: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const { loading: companyLoading, refetch: getCompany } = useQuery(
    GET_COMPANY_QUERY,
    {
      variables: {
        id: id,
      },
      skip: !id,
      onCompleted: (data) => {
        if (data?.company == null) {
          router.push("/admin/companies");
        }
        setCompany({ ...company, ...data?.company });
        setInitialCompany({ ...data?.company });
        setRateCardUrl(data?.company.rate_card_url);
        setLogoUrl(data?.company.logo_url);
      },
      onError(error) {
        // console.log("onError");
        console.log(error);
      },
    },
  );
  const hasCompanyChanges = () => {
    // Skip comparison if company data hasn't been loaded yet
    if (!initialCompany.id || !company.id) return false;

    return Object.keys(company).some((key) => {
      // Skip these fields from comparison
      if (key === "rate_card_url" || key === "logo_url") return false;

      // Handle null/undefined cases
      const companyValue = (company as any)[key] ?? "";
      const initialValue = (initialCompany as any)[key] ?? "";

      return companyValue !== initialValue;
    });
  };
  const { data: companyRatesData, refetch: getCompanyRates } = useQuery(
    GET_COMPANY_RATE_QUERY,
    {
      variables: { company_id: company.id },
      skip: !company.id,
      fetchPolicy: "network-only", // Add this to ensure fresh data
      onCompleted: (data) => {
        if (data?.getRatesByCompany) {
          const rates = [...data.getRatesByCompany];
          setCompanyRates(rates);
          setPrevCompanyRates(rates);
        }
      },
    },
  );

  const {
    // data: seafreightData,
    // loading: seafreightLoading,
    // error: seafreightError,
  } = useQuery(GET_LIST_OF_SEAFREIGHTS, {
    onCompleted(data) {
      const grouped = data.allSeafreights.reduce(
        (
          acc: {
            [x: string]: {
              value: any;
              label: any;
              cbm_rate: any;
              min_charge: any;
              state: any;
            }[];
          },
          item: {
            state: string | number;
            id: any;
            location_name: any;
            cbm_rate: any;
            min_charge: any;
          },
        ) => {
          if (!acc[item.state]) {
            acc[item.state] = [];
          }
          acc[item.state].push({
            value: item.id,
            label: item.location_name,
            cbm_rate: item.cbm_rate,
            min_charge: item.min_charge,
            state: item.state,
          });
          return acc;
        },
        {},
      );
      setGroupedSeafreights(grouped);
      const states = Object.keys(grouped).map((state) => ({
        value: state,
        label: state,
      }));
      setStateOptions(states);
    },
    onError(error) {
      console.error("GraphQL Error:", error);
      toast({
        title: "Error fetching seafreights",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  useEffect(() => {
    if (company.id) {
      getCompanyRates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id, getCompanyRates]);

  const handleRegionChange = (selected: any) => {
    const selectedSeafreight = (groupedSeafreights as Record<string, any[]>)[
      selectedState
    ]?.find((item: any) => item.value === selected.value);

    if (selectedSeafreight) {
      // Check if the combination already exists
      if (isRegionAlreadyUsed(selectedState, selectedSeafreight.label)) {
        toast({
          title: "Duplicate Entry",
          description: `A rate for ${selectedSeafreight.label} in ${selectedState} already exists`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setCompanyRate({
        ...companyRate,
        seafreight_id: selected.value,
        area: selectedSeafreight.label,
        cbm_rate: selectedSeafreight.cbm_rate,
        minimum_charge: selectedSeafreight.min_charge,
      });
    }
  };

  const isRegionAlreadyUsed = (state: string, region: string) => {
    return companyRates.some(
      (rate) => rate.state === state && rate.area === region,
    );
  };

  const handleStateChange = (selected: any) => {
    setSelectedState(selected.value);
    // Reset the region selection when state changes
    setCompanyRate({
      ...companyRate,
      state: selected.value,
      seafreight_id: null,
      area: "",
      cbm_rate: 0,
      minimum_charge: 0,
    });
  };

  // const addNewRate = () => {
  //   // Check if there are any empty rates
  //   const hasEmptyRate = companyRates.some(
  //     (rate) =>
  //       !rate.area ||
  //       !rate.state ||
  //       !rate.seafreight_id ||
  //       rate.cbm_rate === 0 ||
  //       rate.minimum_charge === 0,
  //   );

  //   if (hasEmptyRate) {
  //     toast({
  //       title: "Validation Error",
  //       description:
  //         "Please fill in all fields (Area, CBM Rate, and Minimum Charge) before adding a new rate",
  //       status: "error",
  //       duration: 3000,
  //       isClosable: true,
  //     });
  //     return;
  //   }
  //   setCompanyRates([
  //     ...companyRates,
  //     {
  //       id: undefined,
  //       company_id: String(company.id),
  //       seafreight_id: null,
  //       area: "",
  //       cbm_rate: 0,
  //       minimum_charge: 0,
  //       state: "",
  //       created_at: new Date().toISOString(),
  //       updated_at: new Date().toISOString(),
  //     },
  //   ]);
  // };
  const hasValidChangesToSave = () => {
    // Check if the current companyRate has valid data
    if (companyRate && Object.keys(companyRate).length > 0) {
      if (
        companyRate.area &&
        companyRate.state &&
        companyRate.seafreight_id &&
        companyRate.cbm_rate > 0 &&
        companyRate.minimum_charge > 0
      ) {
        return true;
      }
    }

    // Check if there's a new rate being added
    if (isAddingRate && newRate) {
      if (
        newRate.area &&
        newRate.state &&
        newRate.seafreight_id &&
        newRate.cbm_rate > 0 &&
        newRate.minimum_charge > 0
      ) {
        return true;
      }
    }

    // Check if existing rates have been modified
    const hasModifiedRates = companyRates.some((rate) => {
      const prevRate = prevCompanyRates.find((pr) => pr.id === rate.id);
      return (
        prevRate &&
        (prevRate.area !== rate.area ||
          prevRate.cbm_rate !== rate.cbm_rate ||
          prevRate.minimum_charge !== rate.minimum_charge ||
          prevRate.state !== rate.state)
      );
    });

    return hasModifiedRates;
  };

  const addNewRate = () => {
    setIsAddingRate(true);
    setNewRate({
      id: undefined,
      company_id: String(company.id),
      seafreight_id: null,
      area: "",
      cbm_rate: 0,
      minimum_charge: 0,
      state: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  const handleRateInputChange = (index: number, field: string, value: any) => {
    const updatedRates = [...companyRates];
    const rate = updatedRates[index];

    // Update the rate with new value
    updatedRates[index] = {
      ...rate,
      [field]:
        field === "cbm_rate" || field === "minimum_charge"
          ? parseFloat(value) || 0
          : value,
    };

    setCompanyRates(updatedRates);
    setIsEditMode(true); // Set edit mode when user modifies existing rate
  };

  const saveRates = async () => {
    try {
      setIsSaving(true);

      if (isAddingRate) {
        // Handle Add Mode
        if (
          !companyRate.area ||
          !companyRate.state ||
          !companyRate.seafreight_id ||
          companyRate.cbm_rate === 0 ||
          companyRate.minimum_charge === 0
        ) {
          toast({
            title: "Validation Error",
            description:
              "Please fill in all fields (State, Region, CBM Rate, and Minimum Charge) before saving",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Check for duplicate state/region combination
        if (isRegionAlreadyUsed(companyRate.state, companyRate.area)) {
          toast({
            title: "Duplicate Entry",
            description: `A rate for ${companyRate.area} in ${companyRate.state} already exists`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Create new rate
        await createCompanyRate({
          variables: {
            company_id: String(company.id),
            seafreight_id: String(companyRate.seafreight_id),
            area: companyRate.area,
            cbm_rate: Number(companyRate.cbm_rate),
            minimum_charge: Number(companyRate.minimum_charge),
            state: companyRate.state,
          },
        });
      } else if (isEditMode) {
        // Handle Edit Mode
        const modifiedRates = companyRates.filter((rate) => {
          const prevRate = prevCompanyRates.find((pr) => pr.id === rate.id);
          return (
            prevRate &&
            (prevRate.area !== rate.area ||
              prevRate.cbm_rate !== rate.cbm_rate ||
              prevRate.minimum_charge !== rate.minimum_charge ||
              prevRate.state !== rate.state ||
              prevRate.seafreight_id !== rate.seafreight_id)
          );
        });

        // Validate modified rates
        const invalidRate = modifiedRates.find(
          (rate) =>
            !rate.area ||
            !rate.state ||
            !rate.seafreight_id ||
            rate.cbm_rate === 0 ||
            rate.minimum_charge === 0,
        );

        if (invalidRate) {
          toast({
            title: "Validation Error",
            description:
              "Please ensure all fields are filled for the modified rates",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Update modified rates
        for (const rate of modifiedRates) {
          await updateCompanyRate({
            variables: {
              id: rate.id,
              company_id: String(company.id),
              seafreight_id: rate.seafreight_id,
              area: rate.area,
              cbm_rate: parseFloat(rate.cbm_rate.toString()),
              minimum_charge: parseFloat(rate.minimum_charge.toString()),
              state: rate.state,
            },
          });
        }
      }

      // Refresh rates from API
      const { data } = await getCompanyRates({
        variables: { company_id: company.id },
        fetchPolicy: "network-only",
      });

      if (data?.getRatesByCompany) {
        setCompanyRates(data.getRatesByCompany);
        setPrevCompanyRates(data.getRatesByCompany);
      }

      // Reset states
      setCompanyRate({
        company_id: String(company.id),
        seafreight_id: null,
        area: "",
        cbm_rate: 0,
        minimum_charge: 0,
        state: "",
      });
      setSelectedState("");
      setIsAddingRate(false);
      setIsEditMode(false);

      toast({
        title: isAddingRate
          ? "New rate added successfully"
          : "Rates updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error saving rates",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const [createCompanyRate] = useMutation(CREATE_COMPANY_RATE_MUTATION);
  const [updateCompanyRate] = useMutation(UPDATE_COMPANY_RATE_MUTATION);

  const [handleUpdateCompany, {}] = useMutation(UPDATE_COMPANY_MUTATION, {
    variables: {
      input: { ...company, rate_card_url: undefined, logo_url: undefined },
    },
    onCompleted: async (data) => {
      try {
        if (companyRatesData?.companyRate) {
          // Update existing rate
          await updateCompanyRate({
            variables: {
              id: companyRatesData.companyRate.id,
              input: {
                company_id: data.company.id,
                state: companyRate.state,
                seafreight_id: companyRate.seafreight_id || null,
                area: companyRate.area || "",
                cbm_rate: parseFloat(companyRate.cbm_rate?.toString() || "0"),
                minimum_charge: parseFloat(
                  companyRate.minimum_charge?.toString() || "0",
                ),
              },
            },
          });
        } else {
          // Create new rate
          await createCompanyRate({
            variables: {
              input: {
                company_id: data.company.id,
                state: companyRate.state || "",
                seafreight_id: companyRate.seafreight_id || null,
                area: companyRate.area || "",
                cbm_rate: parseFloat(companyRate.cbm_rate?.toString() || "0"),
                minimum_charge: parseFloat(
                  companyRate.minimum_charge?.toString() || "0",
                ),
              },
            },
          });
        }

        toast({
          title: "Company and rates updated successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        router.push("/admin/companies");
      } catch (error) {
        showGraphQLErrorToast(error as any);
      }
    },
    onError(error) {
      showGraphQLErrorToast(error);
    },
  });

  // const [handleDeleteCompany, {}] = useMutation(DELETE_COMPANY_MUTATION, {
  //   variables: {
  //     id: id,
  //   },
  //   onCompleted: (data) => {
  //     toast({
  //       title: "Company deleted",
  //       status: "success",
  //       duration: 3000,
  //       isClosable: true,
  //     });
  //     router.push("/admin/companies");
  //   },
  //   onError: (error) => {
  //     showGraphQLErrorToast(error);
  //   },
  // });

  const [deleteCompanyRate] = useMutation(DELETE_COMPANY_RATE_MUTATION);

  const handleDeleteRate = async (rateId: string) => {
    try {
      await deleteCompanyRate({
        variables: {
          id: rateId,
        },
      });

      // Refresh rates from API
      const { data } = await getCompanyRates({
        variables: { company_id: company.id },
        fetchPolicy: "network-only",
      });

      if (data?.getRatesByCompany) {
        setCompanyRates(data.getRatesByCompany);
        setPrevCompanyRates(data.getRatesByCompany);
      }

      toast({
        title: "Rate deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error deleting rate",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const [availableCustomersOptions, setAvailableCustomersOptions] = useState(
    [],
  );
  const [_searchAvailableCustomerQuery, _setSearchAvailableCustomerQuery] =
    useState("");

  const [selectCustomerId, setSelectCustomerId] = useState(null);

  // const onChangeSearchAvailableCustomerQuery = useMemo(() => {
  //   return debounce((e) => {
  //     setSearchAvailableCustomerQuery(e);
  //   }, 300);
  // }, []);

  const columns = useMemo(
    () => [
      {
        Header: "First Name",
        accessor: "first_name" as const,
      },
      {
        Header: "Last Name",
        accessor: "last_name" as const,
      },
      {
        Header: "Phone Number",
        accessor: "phone_no" as const,
      },
      {
        Header: "Company Role",
        accessor: "is_company_admin" as const,
        trueLabel: "Admin",
        falseLabel: "User",
        type: "boolean",
      },
      {
        Header: "Send POD",
        accessor: "is_pod_sendable" as const,
        trueLabel: "Yes",
        falseLabel: "No",
        type: "boolean",
      },
      {
        Header: "Send Invoice",
        accessor: "is_invoice_sendable" as const,
        trueLabel: "Yes",
        falseLabel: "No",
        type: "boolean",
      },
      {
        Header: "Email",
        accessor: "email" as const,
      },
      {
        Header: "Actions",
        accessor: "id" as const,
        isDelete: true,
        isView: true,
        isEdit: false,
        deleteIcon: faUserMinus,
      },
    ],
    [],
  );

  const {
    // loading: availableCustomersLoading,
    // data: availableCustomers,
    refetch: getAvailableCustomers,
  } = useQuery(GET_CUSTOMERS_QUERY, {
    variables: {
      query: searchQuery,
      page: 1,
      first: 10000,
      orderByColumn: "id",
      orderByOrder: "ASC",
      company_id: null,
    },
    onCompleted: (data) => {
      setAvailableCustomersOptions([]);
      data.customers.data.map((customer: any) => {
        setAvailableCustomersOptions((availableCustomersOptions) => [
          ...availableCustomersOptions,
          { value: parseInt(customer.id), label: customer.email },
        ]);
      });
    },
  });

  const {
    loading,
    // error,
    data: customers,
    refetch: getCustomers,
  } = useQuery(GET_CUSTOMERS_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "ASC",
      company_id: id,
    },
  });

  const [addCustomerToCompany, {}] = useMutation(UPDATE_CUSTOMER_MUTATION, {
    variables: {
      input: {
        id: selectCustomerId,
        company_id: id,
      },
    },
    onCompleted: () => {
      toast({
        title: "Customer updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      getCustomers();
      getAvailableCustomers();
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [removeCustomerFromCompany, {}] = useMutation(
    UPDATE_CUSTOMER_MUTATION,
    {
      variables: {
        input: {
          id: Number(selectCustomerId),
          company_id: null,
        },
      },

      onCompleted: () => {
        toast({
          title: "Customer removed",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        getCustomers();
        getAvailableCustomers();
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  return (
    <AdminLayout>
      <Box
        className="mk-companies-id"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
      >
        {/* Main Fields */}
        <Grid pr="24px">
          {!companyLoading && (
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
                    <h2 className="mt-10 mb-4">{company.name}</h2>
                  </Box>

                  {/* Left side buttons */}
                  <Flex mt={8} flexDirection="column" className="border-b">
                    <Button
                      disabled={isCompanySetting == 0}
                      onClick={() => setIsCompanySetting(0)}
                      alignItems="start"
                      h={45}
                      fontSize="14px"
                      className={
                        isCompanySetting == 0
                          ? "!items-center !justify-start !font-medium text-white !bg-[var(--chakra-colors-primary-400)] !rounded-none"
                          : "!items-center !justify-start !font-medium text-[var(--chakra-colors-black-400)] !bg-white !rounded-none"
                      }
                    >
                      <FontAwesomeIcon icon={faGear} className="mr-1" />
                      Company Settings
                    </Button>

                    <Button
                      disabled={isCompanySetting == 1}
                      onClick={() => setIsCompanySetting(1)}
                      alignItems="start"
                      h={45}
                      fontSize="14px"
                      className={
                        isCompanySetting == 1
                          ? "!items-center !justify-start !font-medium !text-left text-white !bg-[var(--chakra-colors-primary-400)] !rounded-none"
                          : "!items-center !justify-start !font-medium text-[var(--chakra-colors-black-400)] !bg-white !rounded-none"
                      }
                    >
                      <FontAwesomeIcon icon={faUserLock} className="mr-1" />
                      Company Users
                    </Button>

                    <Button
                      disabled={isCompanySetting == 2}
                      onClick={() => setIsCompanySetting(2)}
                      alignItems="start"
                      h={45}
                      fontSize="14px"
                      className={
                        isCompanySetting == 2
                          ? "!items-center !justify-start !font-medium !text-left text-white !bg-[var(--chakra-colors-primary-400)] !rounded-none"
                          : "!items-center !justify-start !font-medium text-[var(--chakra-colors-black-400)] !bg-white !rounded-none"
                      }
                    >
                      <FontAwesomeIcon
                        icon={faFileInvoiceDollar}
                        className="mr-1"
                      />
                      Invoices
                    </Button>
                  </Flex>
                </GridItem>

                {/* Right side */}
                <GridItem pl="2" area={"main"}>
                  {/* Company Settings */}
                  {isCompanySetting == 0 && (
                    <FormControl className="pb-10">
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb="24px"
                        className="mt-8"
                      >
                        <h2 className="mb-0">Company Settings</h2>
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
                            onClick={() => handleUpdateCompany()}
                            isLoading={companyLoading}
                            isDisabled={!hasCompanyChanges()}
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
                          value={company.name}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                          value={company.abn}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                          value={company.contact_phone}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                          value={company.contact_email}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                            value={paymentTerms.find(
                              (term) => term.value === company.payment_term,
                            )}
                            options={paymentTerms}
                            onChange={(selectedOption) => {
                              setCompany({
                                ...company,
                                payment_term: selectedOption?.value,
                              });
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
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Weight (kg/cubic)
                        </FormLabel>
                        <Input
                          isRequired
                          type="number"
                          name="weight_per_cubic"
                          value={company.weight_per_cubic}
                          onChange={(e) =>
                            setCompany({
                              ...company,
                              [e.target.name]: e.target.value ? parseInt(e.target.value, 10) : ""
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
                          Company Logo
                        </FormLabel>
                        <Flex
                          alignItems={"center"}
                          ms={{ base: "0px", md: "0px" }}
                        >
                          {logoUrl && (
                            <Button
                              onClick={() => {
                                if (logoUrl) {
                                  window.open(
                                    logoUrl,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }
                              }}
                              fontSize="sm"
                              variant="outline"
                              fontWeight="500"
                              lineHeight="19px"
                              w="80%"
                              h="50"
                              mb="0"
                              className="!h-[39px]"
                            >
                              View Logo
                            </Button>
                          )}
                          <FileInputLink
                            width="60px"
                            height="50px"
                            entity="Company"
                            collection_name="companyLogo"
                            description="Upload Logo"
                            entityId={company.id}
                            onUpload={(new_url: string) => {
                              setLogoUrl(new_url);
                              getCompany();
                            }}
                            accept="image/*"
                          ></FileInputLink>
                        </Flex>
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
                          Integration email
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="integration_email"
                          value={company.integration_email}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                          value={company.admin_notes || ""}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                            value={company.base_notes || ""}
                            onChange={(e) =>
                              setCompany({
                                ...company,
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
                          value={company.account_email}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                          value={company.address}
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
                        defaultAddress={company}
                        isModalOpen={isAddressModalOpen}
                        description="Billing address"
                        onModalClose={(e) => setIsAddressModalOpen(e)}
                        onSetAddress={(target) => {
                          setCompany({ ...company, ...target });
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
                          value={company.address_line_1}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                          value={company.address_line_2}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                          value={company.address_city}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                          value={company.address_state}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                          value={company.address_postal_code}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                          Rate Card
                        </FormLabel>
                        <Flex
                          alignItems={"center"}
                          ms={{ base: "0px", md: "0px" }}
                        >
                          {rateCardUrl && (
                            <Button
                              onClick={() => {
                                if (rateCardUrl) {
                                  window.open(
                                    rateCardUrl,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }
                              }}
                              fontSize="sm"
                              variant="outline"
                              fontWeight="500"
                              lineHeight="19px"
                              w="80%"
                              h="50"
                              mb="0"
                              className="!h-[39px]"
                            >
                              Download Rate Card
                            </Button>
                          )}
                          <FileInputLink
                            width="60px"
                            height="50px"
                            entity="Company"
                            collection_name="rate_card_url"
                            description="Upload Rate Card"
                            entityId={company.id}
                            onUpload={(new_url: string) => {
                              setRateCardUrl(new_url);
                              getCompany();
                            }}
                            accept="application/pdf"
                          ></FileInputLink>
                        </Flex>
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
                          LCL Rate
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="number"
                          name="lcl_rate"
                          value={company.lcl_rate}
                          onChange={(e) =>
                            setCompany({
                              ...company,
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
                      <Divider />

                      <h3 className="mt-6 mb-4">Custom rate</h3>
                      <Box>
                        <Flex justifyContent="end" mb={4}>
                          <Button
                            onClick={addNewRate}
                            fontSize="sm"
                            variant="brand"
                            fontWeight="500"
                          >
                            + Add Rate
                          </Button>
                        </Flex>

                        {/* Display only saved rates */}
                        <Grid
                          templateColumns="1fr 1fr 1fr 1fr 40px"
                          gap={4}
                          mb={4}
                        >
                          <Text fontSize="sm" fontWeight="500">
                            STATE
                          </Text>
                          <Text fontSize="sm" fontWeight="500">
                            QUADRANT
                          </Text>
                          <Text fontSize="sm" fontWeight="500">
                            CBM RATE
                          </Text>
                          <Text fontSize="sm" fontWeight="500">
                            MIN CHARGE
                          </Text>
                        </Grid>

                        {companyRates.map((rate, index) => (
                          <SimpleGrid
                            key={rate.id || index}
                            columns={5}
                            spacing={4}
                            mb={4}
                          >
                            <FormControl>
                              <Select
                                value={{ value: rate.state, label: rate.state }}
                                options={stateOptions}
                                onChange={(selected) => {
                                  const updatedRates = [...companyRates];
                                  updatedRates[index] = {
                                    ...rate,
                                    state: selected.value,
                                    seafreight_id: null,
                                    area: "",
                                    cbm_rate: 0,
                                    minimum_charge: 0,
                                  };
                                  setCompanyRates(updatedRates);
                                }}
                              />
                            </FormControl>

                            <FormControl>
                              <Select
                                value={{
                                  value: rate.seafreight_id,
                                  label: rate.area,
                                }}
                                options={groupedSeafreights[rate.state] || []}
                                onChange={(selected) => {
                                  const selectedSeafreight = groupedSeafreights[
                                    rate.state
                                  ]?.find(
                                    (sf: any) => sf.value === selected.value,
                                  );
                                  if (selectedSeafreight) {
                                    handleRateInputChange(
                                      index,
                                      "seafreight_id",
                                      selected.value,
                                    );
                                    handleRateInputChange(
                                      index,
                                      "area",
                                      selectedSeafreight.label,
                                    );
                                    handleRateInputChange(
                                      index,
                                      "cbm_rate",
                                      selectedSeafreight.cbm_rate,
                                    );
                                    handleRateInputChange(
                                      index,
                                      "minimum_charge",
                                      selectedSeafreight.min_charge,
                                    );
                                    setIsEditMode(true);
                                  }
                                }}
                                isDisabled={!rate.state}
                              />
                            </FormControl>

                            <FormControl>
                              <Input
                                type="number"
                                value={rate.cbm_rate}
                                onChange={(e) =>
                                  handleRateInputChange(
                                    index,
                                    "cbm_rate",
                                    e.target.value,
                                  )
                                }
                              />
                            </FormControl>

                            <FormControl>
                              <Input
                                type="number"
                                value={rate.minimum_charge}
                                onChange={(e) =>
                                  handleRateInputChange(
                                    index,
                                    "minimum_charge",
                                    e.target.value,
                                  )
                                }
                              />
                            </FormControl>
                            <FormControl>
                              <IconButton
                                aria-label="Delete rate"
                                icon={<FontAwesomeIcon icon={faTimes} />}
                                size="sm"
                                sx={{
                                  backgroundColor: "lightpink",
                                  marginTop: "3px",
                                }}
                                colorScheme="red"
                                variant="ghost"
                                onClick={() =>
                                  rate.id && handleDeleteRate(rate.id)
                                }
                                isDisabled={!rate.id}
                              />
                            </FormControl>
                          </SimpleGrid>
                        ))}

                        {isAddingRate && (
                          <Box mt={6}>
                            <Text fontSize="md" fontWeight="500" mb={4}>
                              Add New Rate
                            </Text>
                            <SimpleGrid columns={5} spacing={4}>
                              <Select
                                value={stateOptions.find(
                                  (option) => option.value === selectedState,
                                )}
                                options={stateOptions}
                                onChange={handleStateChange}
                                placeholder="Select State"
                              />
                              <Select
                                value={(
                                  groupedSeafreights as Record<string, any[]>
                                )[selectedState]?.find(
                                  (option: any) =>
                                    option.value === companyRate.seafreight_id,
                                )}
                                options={
                                  (groupedSeafreights as Record<string, any[]>)[
                                  selectedState
                                  ] || []
                                }
                                onChange={handleRegionChange}
                                placeholder="Select Region"
                                isDisabled={!selectedState}
                              />
                              <Input
                                type="number"
                                value={companyRate.cbm_rate}
                                onChange={(e) =>
                                  setCompanyRate({
                                    ...companyRate,
                                    cbm_rate: parseFloat(e.target.value),
                                  })
                                }
                              />
                              <Input
                                type="number"
                                value={companyRate.minimum_charge}
                                onChange={(e) =>
                                  setCompanyRate({
                                    ...companyRate,
                                    minimum_charge: parseFloat(e.target.value),
                                  })
                                }
                              />
                            </SimpleGrid>
                          </Box>
                        )}

                        <Button
                          onClick={saveRates}
                          fontSize="sm"
                          variant="brand"
                          fontWeight="500"
                          mt={6}
                          mb={4}
                          isDisabled={!hasValidChangesToSave()}
                          isLoading={isSaving}
                        >
                          Save Rates
                        </Button>
                      </Box>
                      <Divider />

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
                          value={company.is_pod_sendable ? "1" : "0"}
                          onChange={(e) => {
                            setCompany({
                              ...company,
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
                          value={company.is_invoice_sendable ? "1" : "0"}
                          onChange={(e) => {
                            setCompany({
                              ...company,
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

                  {/* Company Users */}
                  {isCompanySetting == 1 && (
                    <>
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb="24px"
                        className="mt-8"
                      >
                        <h2 className="mb-0">Company Users</h2>
                        <Flex>
                          <Link
                            href={`/admin/customers/create?company_id=${id}`}
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

                          <Button
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
                                  company
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
                                  onClick={() => addCustomerToCompany()}
                                >
                                  Add to company
                                </Button>
                              </ModalFooter>
                            </ModalContent>
                          </Modal>
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

                          {!loading &&
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
                                  removeCustomerFromCompany();
                                }}
                                isServerSide
                                path="/admin/customers"
                              />
                            )}
                        </SimpleGrid>
                      </Box>
                    </>
                  )}
                  {/* Invoice */}
                  {isCompanySetting == 2 && (
                    <>
                      {company.id !== null && (
                        <InvoiceTab company_id={company.id} />
                      )}
                    </>
                  )}
                </GridItem>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default CompanyEdit;
