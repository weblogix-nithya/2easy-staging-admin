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
  Radio,
  RadioGroup,
  // SelectField,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
// import { t } from "@chakra-ui/styled-system/dist/types/utils";
import { faTrashCan } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import ColorSelect from "components/fields/ColorSelect";
import CustomInputField from "components/fields/CustomInputField";
// import CustomInputFieldAdornment from "components/fields/CustomInputFieldAdornment";
import FileInput from "components/fileInput/FileInput";
import JobAddressesSection from "components/jobs/JobAddressesSection";
import JobInputTable from "components/jobs/JobInputTable";
import PaginationTable from "components/table/PaginationTable";
import TagsInput from "components/tagsInput";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { GET_COMPANY_QUERY, GET_COMPANYS_QUERY } from "graphql/company";
import { GET_COMPANY_RATE_QUERY } from "graphql/CompanyRate";
import { defaultCustomer, GET_CUSTOMERS_QUERY } from "graphql/customer";
import { GET_CUSTOMER_ADDRESSES_QUERY } from "graphql/customerAddress";
import { GET_ITEM_TYPES_QUERY } from "graphql/itemType";
import {
  CREATE_JOB_MUTATION,
  defaultJob,
  GET_ALL_TIMESLOT_DEPOTS,
  // SEND_CONSIGNMENT_DOCKET,
} from "graphql/job";
import defaultJobQuoteData from "graphql/job";
import { GET_JOB_CATEGORIES_QUERY } from "graphql/jobCategories";
import { CREATE_JOB_CC_EMAIL_MUTATION } from "graphql/jobCcEmails";
import {
  CREATE_JOB_DESTINATION_MUTATION,
  defaultJobDestination,
} from "graphql/jobDestination";
import { CREATE_JOB_ITEM_MUTATION, defaultJobItem } from "graphql/jobItem";
import {
  CREATE_JOB_PRICE_CALCULATION_DETAIL_MUTATION,
  CreateJobPriceCalculationDetailInput,
  defaultJobPriceCalculationDetail,
  // JobPriceCalculationDetail,
} from "graphql/JobPriceCalculationDetail";
import { GET_JOB_TYPES_QUERY } from "graphql/jobType";
import { ADD_MEDIA_MUTATION } from "graphql/media";
import {
  formatDateTimeToDB,
  getTimezone,
  isAfterCutoff,
  today,
} from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import { useRouter } from "next/router";
import {
  // startTransition,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";
import { calculateFinalWeightCBM } from "utils/calculatePalletSpacesOccupied";

function JobPage() {
  const toast = useToast();
  const freightCalculatedRef = useRef(false);
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const {
    isAdmin,
    customerId,
    companyId,
    isCompany,
    isCompanyAdmin,
    isCustomer,
  } = useSelector((state: RootState) => state.user);
  // console.log(isAdmin, customerId, companyId, isCompany, isCustomer, "isAdmin, customerId, companyId, isCompany, isCustomer");
  // const textColor = useColorModeValue("navy.700", "white");
  const [job, setJob] = useState(defaultJob);
  const [itemTypes, setItemTypes] = useState([]);
  // console.log(job, "job");
  const [customerSelected, setCustomerSelected] = useState(defaultCustomer);
  const [jobDestinations, setJobDestinations] = useState([
    { ...defaultJobDestination, ...{ id: 2, address_line_1: "" } },
  ]);
  const [pickUpDestination, setPickUpDestination] = useState({
    ...defaultJobDestination,
    ...{ id: 1, address_line_1: "" },
  });
  // const [refinedData, setRefinedData] = useState({
  //   ...defaultJobQuoteData,
  //   freight_type: "LCL",
  // });

  const [depotOptions, setDepotOptions] = useState([]);
  const [filtereddepotOptions, setFilteredDepotOptions] = useState([]);

  const [refinedData, setRefinedData] = useState({
    ...defaultJobQuoteData,
    freight_type: "LCL",
    pick_up_state: "",
    pick_up_stateCode: "",
    depotOptions: [],
    timeslot_depots: "",
  });

  const [companyRates, setCompanyRates] = useState([]);
  const [quoteCalculationRes, setQuoteCalculationRes] = useState(
    defaultJobPriceCalculationDetail,
  );

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tempcalculation, setTempcalculation] = useState({
    cbm_auto: 0,
    total_weight: 0,
  });
  const [isQuotePrice, setIsQuotePrice] = useState(false);

  // Temporary saved addresses
  const [isSaving, setIsSaving] = useState(false);
  const [jobItems, setJobItems] = useState([defaultJobItem]);
  // console.log(jobItems, "jobitem");
  const [savedAddressesSelect, setSavedAddressesSelect] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [jobTypeOptions, setJobTypeOptions] = useState([]);
  const [companiesOptions, setCompaniesOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [temporaryMedia, setTemporaryMedia] = useState([]);
  const [jobDateAt, setJobDateAt] = useState(today);
  const [readyAt, setReadyAt] = useState("06:00");
  const [dropAt, setDropAt] = useState("17:00");
  // const [jobCcEmails, setJobCcEmails] = useState([]);
  const [jobCcEmailTags, setJobCcEmailTags] = useState([]);
  const [isSameDayJob, setIsSameDayJob] = useState(true);
  const [isTomorrowJob, setIsTomorrowJob] = useState(false);
  const [filteredJobTypeOptions, setFilteredJobTypeOptions] = useState([]);
  const [companyWeight, setCompanyWeight] = useState(null);
  const re = useMemo(
    () =>
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    [],
  );

  const getStateCode = (stateName: string) => {
    const normalizedStateName = stateName.toLowerCase().trim();
    switch (normalizedStateName) {
      case "victoria":
        return "VIC";
      case "queensland":
        return "QLD";
      // You can add more cases here for other states if needed
      default:
        return normalizedStateName; // Return the state name as is if it doesn't match any known state
    }
  };

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setDebouncedSearch(e);
    }, 300);
  }, []);

  const router = useRouter();
  const defaultVariables = {
    query: "",
    page: 1,
    first: 100,
    orderByColumn: "id",
    orderByOrder: "ASC",
  };

  const itemsTableColumns = useMemo(
    () => [
      {
        Header: "Type",
      },
      {
        Header: "DIMENSIONS (L,W,H)",
      },
      {
        Header: "QTY",
      },
      {
        Header: "WEIGHT",
      },
      {
        Header: "CBM",
      },
      {
        Header: "ACTION",
      },
    ],
    [],
  );
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

  // Fetch only when you want
  const { refetch: getCompanyRates } = useQuery(GET_COMPANY_RATE_QUERY, {
    skip: true, //  avoid automatic fetch
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data?.getRatesByCompany) {
        setCompanyRates([...data.getRatesByCompany]);
        setRefinedData((prev) => ({
          ...prev,
          company_rates: [...data.getRatesByCompany],
        }));
      }
    },
  });
  // only store the weight

  const { refetch: getCompany } = useQuery(GET_COMPANY_QUERY, {
    skip: true, // don't auto-run, we'll call manually
    onCompleted: (data) => {
      if (data?.company?.weight_per_cubic != null) {
        setCompanyWeight(data.company.weight_per_cubic);
      }
    },
    onError: (error) => {
      console.error("Error fetching company weight:", error);
    },
  });
  const { data: _depotData } = useQuery(GET_ALL_TIMESLOT_DEPOTS, {
    onCompleted: (data) => {
      if (data?.allTimeslotDepots) {
        const depots = data.allTimeslotDepots
          .filter((depot: any) => depot.is_active)
          .map((depot: any) => ({
            value: depot.depot_name,
            label: depot.depot_name,
            price: depot.depot_price,
            state_code: depot.state_code,
            pincode: depot.pincode,
          }));
        setDepotOptions(depots);
        // console.log("depots", data.allTimeslotDepots);
        // console.log("depots", depots);
      }
    },
    onError: (error) => {
      console.error("Error fetching depots:", error);
      toast({
        title: "Error fetching depots",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  useQuery(GET_ITEM_TYPES_QUERY, {
    variables: defaultVariables,
    onCompleted: (data) => {
      const itemTypesArray = data.itemTypes.data.map(
        (_entity: { id: string; name: string }) => ({
          value: parseInt(_entity.id),
          label: _entity.name,
        }),
      );

      // Sort items, pushing "Other" to the end
      const sortedItemTypes = itemTypesArray.sort(
        (
          a: { value: number; label: string },
          b: { value: number; label: string },
        ) => {
          if (a.label === "Other") return 1;
          if (b.label === "Other") return -1;
          return 0;
        },
      );

      setItemTypes(sortedItemTypes);
    },
  });

  useQuery(GET_JOB_TYPES_QUERY, {
    variables: defaultVariables,
    onCompleted: async (data) => {
      const options = data.jobTypes.data.map((_entity: any) => ({
        value: parseInt(_entity.id),
        label: _entity.name,
      }));

      setJobTypeOptions(options);

      try {
        // If lat/lng exists, calculate timezone and filter
        if (pickUpDestination?.lat && pickUpDestination?.lng) {
          const timezone = await getTimezone(
            pickUpDestination.lat,
            pickUpDestination.lng,
          );

          let updatedOptions = [...options];

          if (job.job_category_id === 1) {
            if (isSameDayJob) {
              updatedOptions = updatedOptions.filter(
                (opt) => opt.label !== "Standard",
              );
              resetJobTypeAndShowToast();
            } else if (isTomorrowJob && isAfterCutoff("16:00", timezone)) {
              updatedOptions = updatedOptions.filter(
                (opt) => opt.label !== "Standard",
              );
              resetJobTypeAndShowToast();
            }
          }

          if (
            job.job_category_id === 2 &&
            isSameDayJob &&
            isAfterCutoff("11:00", timezone)
          ) {
            updatedOptions = updatedOptions.filter(
              (opt) => opt.label !== "Standard",
            );
            resetJobTypeAndShowToast();
          }

          setFilteredJobTypeOptions(updatedOptions);
        } else {
          setFilteredJobTypeOptions(options);
        }
      } catch (error) {
        toast({
          title: "Error loading job types",
          description: error instanceof Error ? error.message : "Unknown error",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        setFilteredJobTypeOptions(options); // fallback to full list
      }
    },
  });

  useQuery(GET_COMPANYS_QUERY, {
    variables: {
      query: debouncedSearch,
      page: 1,
      first: 10000,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      const newCompaniesOptions = data.companys.data.map((_entity: any) => ({
        value: parseInt(_entity.id),
        label: _entity.name,
      }));

      setCompaniesOptions(newCompaniesOptions);

      // If a company is already selected, update refinedData with its properties
      const selectedCompany = newCompaniesOptions.find(
        (entity: { value: number }) => entity.value == job.company_id,
        // (entity: { value: number }) => entity.value == job.company_id,
      );

      if (selectedCompany) {
        setRefinedData({
          ...refinedData,
        });
        // console.log(selectedCompany.min_rate, "selected company min rate")
      }

      if (!isAdmin) {
        const companyWithId = newCompaniesOptions.find(
          (entity: { value: number }) => entity.value == companyId,
        );
        if (companyWithId) {
          setRefinedData({
            ...refinedData,
          });
          // console.log(companyWithId,'companywithid min rate')
        }
      }
    },
  });

  useEffect(() => {
    if ((!isCompany && !isCompanyAdmin) || !companyId) return;

    const timeout = setTimeout(() => {
      if (job.company_id !== companyId) {
        setJob((prev) => ({ ...prev, company_id: companyId }));

        getCustomersByCompanyId({ ...defaultVariables, company_id: companyId });

        getCompanyRates({
          company_id: String(companyId),
        });
      }
    }, 100);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const [handleCreateJob] = useMutation(CREATE_JOB_MUTATION, {
    variables: {
      input: {
        ...job,
        id: undefined,
        company_id: isAdmin ? Number(job.company_id) : Number(companyId),
        job_status_id: 1,
        job_type_id: job.job_type_id,
        transport_type: job.transport_type,
        transport_location: job.transport_location,
        timeslot_depots: job.timeslot_depots,
        media: undefined,
      },
    },
    onCompleted: async (data) => {
      let _jobCcEmailTags = [...jobCcEmailTags];
      for (let jobCcEmailTag of _jobCcEmailTags) {
        handleCreateJobCcEmail({
          input: {
            id: undefined,
            email: jobCcEmailTag,
            job_id: parseInt(data.createJob.id),
          },
        });
      }

      let _jobItems = [...jobItems];
      for (let jobItem of _jobItems) {
        jobItem.job_id = parseInt(data.createJob.id);
        handleCreateJobItem({
          input: {
            ...jobItem,
            is_new: undefined,
            dimension_height_cm: undefined,
            dimension_width_cm: undefined,
            dimension_depth_cm: undefined,
            volume_cm: undefined,
            id: undefined,
            item_type: undefined,
          },
        });
      }
      const today = new Date().toISOString(); // Gets current date and time in ISO format

      const jobDestination1 =
        jobDestinations.length > 0
          ? {
            state: jobDestinations[0]?.address_state,
            suburb: jobDestinations[0]?.address_city,
            postcode: jobDestinations[0]?.address_postal_code,
            address: jobDestinations[0]?.address,
          }
          : null;

      const filteredCompanyRates = companyRates?.filter(
        (rate) => rate.state === jobDestination1?.state,
      );
      const payload = {
        freight_type: refinedData.freight_type,
        transport_type: job.transport_type,
        state:
          refinedData.state ||
          job.pick_up_state ||
          pickUpDestination.address_state,
        state_code: refinedData.state_code || refinedData.pick_up_stateCode,
        service_choice: refinedData.service_choice,
        company_rates:
          (job.job_category_id == 1 &&
            refinedData.pick_up_stateCode === "QLD") ||
            refinedData.pick_up_stateCode === "VIC"
            ? filteredCompanyRates.map((rate) => ({
              company_id: rate.company_id,
              seafreight_id: rate.seafreight_id,
              area: rate.area,
              cbm_rate: rate.cbm_rate,
              minimum_charge: rate.minimum_charge,
            }))
            : [],
        job_pickup_address: {
          state: pickUpDestination?.address_state,
          suburb: pickUpDestination?.address_city,
          postcode: pickUpDestination?.address_postal_code,
          address: pickUpDestination?.address,
        },
        job_destination_address:
          jobDestinations.length > 0
            ? {
              state: jobDestinations[0]?.address_state,
              suburb: jobDestinations[0]?.address_city,
              postcode: jobDestinations[0]?.address_postal_code,
              address: jobDestinations[0]?.address,
            }
            : {},
        pickup_time: {
          ready_by: readyAt,
        },
        delivery_time: {
          drop_by: dropAt,
        },
        surcharges: {
          hand_unload: job.is_hand_unloading || false,
          dangerous_goods: job.is_dangerous_goods || false,
          time_slot: job.is_inbound_connect || null,
          timeslot_depots: job.is_inbound_connect
            ? refinedData.timeslot_depots
            : null,
          tail_lift: job.is_tailgate_required || null,
          stackable: false, // If applicable, update this
        },
        job_items: jobItems.map((item) => ({
          id: item.id,
          name: item.name || "",
          notes: item.notes || "",
          quantity: item.quantity,
          volume: item.volume,
          weight: item.weight,
          dimension_height: item.dimension_height,
          dimension_width: item.dimension_width,
          dimension_depth: item.dimension_depth,
          job_destination: jobDestination1 || null,
          item_type: {
            id: item.item_type?.id || "",
            name: item.item_type?.name || "",
          },
          created_at: refinedData.created_at || today,
          updated_at: refinedData.updated_at || today,
        })),
      };
      try {
        const response = await axios.post(apiUrl, payload, {
          headers: { "Content-Type": "application/json" },
        });
        const calculationData = response.data as {
          cbm_auto: number;
          total_weight: number;
          freight: number;
          fuel: number;
          hand_unload: number;
          dangerous_goods: number;
          time_slot: number;
          tail_lift: number;
          stackable: number;
          total: number;
        };

        await handleCreateJobPriceCalculationDetail({
          job_id: parseInt(data.createJob.id),
          customer_id: Number(job.customer_id),
          cbm_auto: Number(calculationData.cbm_auto ?? 0),
          total_weight: Number(calculationData.total_weight ?? 0),
          freight: Number(calculationData.freight ?? 0),
          fuel: Number(calculationData.fuel ?? 0),
          hand_unload: Number(calculationData.hand_unload ?? 0),
          dangerous_goods: Number(calculationData.dangerous_goods ?? 0),
          time_slot: Number(calculationData.time_slot ?? 0),
          tail_lift: Number(calculationData.tail_lift ?? 0),
          stackable: Number(calculationData.stackable ?? 0),
          total: Number(calculationData.total ?? 0),
        });
      } catch (error) {
        console.error(error, "error in create quote");
      }
      await handleCreateJobDestination({
        input: {
          ...pickUpDestination,
          is_pickup: true,
          customer_id: undefined,
          id: undefined,
          job_id: parseInt(data.createJob.id),
          jobDestination: undefined,
        },
      });

      let _jobDestinations = [...jobDestinations];
      for (let jobDestination of _jobDestinations) {
        jobDestination.id = undefined;
        jobDestination.job_id = parseInt(data.createJob.id);
        await handleCreateJobDestination({
          input: {
            ...jobDestination,
            is_pickup: false,
            customer_id: undefined,
            id: undefined,
            jobDestination: undefined,
          },
        });
      }

      toast({
        title: "Job created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // ✅ Wait for all media uploads to finish
      for (const media of temporaryMedia) {
        const reader = new FileReader();

        await new Promise<void>((resolve, _reject) => {
          reader.onerror = () => {
            // console.log("file reading has failed");
            resolve(); // skip and continue
          };
          reader.onabort = () => {
            // console.log("file reading was aborted");
            resolve(); // skip and continue
          };
          reader.onload = () => {
            handleCreateMedia({
              variables: {
                input: {
                  entity: "Job",
                  entity_id: data.createJob.id,
                },
                media: media.file,
              },
            });
            setTimeout(resolve, 100); // small delay for stability
          };
          reader.readAsArrayBuffer(media.file);
        });
      }
      console.log("Navigating to:", `/admin/jobs/${data.createJob.id}`);

      // if (router.isReady) {
      //   await router.push(`/admin/jobs/${data.createJob.id}`);
      //   console.log("Navigation successful");
      // } else {
      //   console.log("Router is not ready, delaying navigation");
      // }
      await router.replace(`/admin/jobs/${data.createJob.id}`);
      if (!router.isReady) {
        router.reload();
      }
      // router.push(`/admin/jobs/${data.createJob.id}`);
      console.log("navigating to after", `/admin/jobs/${data.createJob.id}`);
      // window.location.href = `/admin/jobs/${data.createJob.id}`;

      setIsSaving(false);
    },
    onError: (error) => {
      setIsSaving(false);
      showGraphQLErrorToast(error);
    },
  });

  //handleCreateMedia
  const [handleCreateMedia, { }] = useMutation(ADD_MEDIA_MUTATION, {
    onCompleted: () => {
      /*toast({
        title: "Media updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });*/
      // console.log("Media created");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  const handleCreateJobItem = (jobItem: any) => {
    return new Promise((resolve, reject) => {
      createJobItem({ variables: jobItem })
        .then(({ data }) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };

  const [createJobItem] = useMutation(CREATE_JOB_ITEM_MUTATION);

  const handleCreateJobPriceCalculationDetail = (
    jobPriceDetail: CreateJobPriceCalculationDetailInput,
  ) => {
    return new Promise((resolve, reject) => {
      createJobPriceCalculationDetail({
        variables: { input: jobPriceDetail },
      })
        .then(({ data }) => {
          // console.log(data, "dd");
          resolve(data);
        })
        .catch((error) => {
          // console.log(error, "error in create job price calculation detail");
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };

  const [createJobPriceCalculationDetail] = useMutation(
    CREATE_JOB_PRICE_CALCULATION_DETAIL_MUTATION,
  );

  const handleCreateJobCcEmail = (jobCcEmail: any) => {
    return new Promise((resolve, reject) => {
      createJobCcEmail({ variables: jobCcEmail })
        .then(({ data }) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };
  const [createJobCcEmail] = useMutation(CREATE_JOB_CC_EMAIL_MUTATION);

  const handleCreateJobDestination = (jobDestination: any) => {
    return new Promise((resolve, reject) => {
      createJobDestination({ variables: jobDestination })
        .then(({ data }) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };
  const [createJobDestination] = useMutation(CREATE_JOB_DESTINATION_MUTATION);

  // const [handleSendConsignmentDocket] = useMutation(SEND_CONSIGNMENT_DOCKET);

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
  const addToJobDestinations = () => {
    let nextId = jobDestinations[jobDestinations.length - 1].id + 1;
    setJobDestinations((jobDestinations) => [
      ...jobDestinations,
      { ...defaultJobDestination, ...{ id: nextId } },
    ]);
  };

  const handleRemoveFromJobDestinations = (index: number) => {
    let _jobDestinations = [...jobDestinations];
    _jobDestinations.splice(index, 1);
    setJobDestinations(_jobDestinations);
  };
  //handleJobDestinationChanged
  const handleJobDestinationChanged = async (value: any, index: number) => {
    let _jobDestinations = [...jobDestinations];
    _jobDestinations[index] = value;
    setJobDestinations(_jobDestinations);
    let currentstate =
      _jobDestinations[0]?.address_state == "Victoria"
        ? "VIC"
        : jobDestinations[0]?.address_state == "Queensland"
          ? "QLD"
          : "";
    const filtereddepotOption = depotOptions.filter(
      (option) => option.state_code == currentstate,
    );
    // console.log(filtereddepotOption, "filtereddepotOption");
    setFilteredDepotOptions(filtereddepotOption);
  };
  useQuery(GET_JOB_CATEGORIES_QUERY, {
    variables: defaultVariables,
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      const categories = data.jobCategorys.data.map((driverStatus: any) => ({
        value: parseInt(driverStatus.id),
        label: driverStatus.name,
      }));

      if (isMounted.current) {
        setJobCategories(categories);
      }
    },
    onError: (error) => {
      console.error("Job categories fetch failed:", error);
    },
  });

  const { refetch: getCustomerAddresses } = useQuery(
    GET_CUSTOMER_ADDRESSES_QUERY,
    {
      variables: {
        query: "",
        page: 1,
        first: 200,
        orderByColumn: "id",
        orderByOrder: "ASC",
        customer_id: job.customer_id,
      },
      onCompleted: (data) => {
        setSavedAddressesSelect([]);
        setSavedAddressesSelect(
          formatToSelect(
            data.customerAddresses.data,
            "id",
            "address_business_name",
          ),
        );
      },
    },
  );
  useEffect(() => {
    if (job.customer_id && customerOptions.length > 0) {
      setCustomerSelected({
        ...customerOptions.find((_e) => _e.value == job.customer_id)?.entity,
      });
      getCustomerAddresses();
    }
    if (job.customer_id == null) {
      setCustomerSelected(defaultCustomer);
      setSavedAddressesSelect([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.customer_id, customerOptions]);

  const handleRemoveFromJobItems = (index: number) => {
    let _jobItems = [...jobItems];
    _jobItems.splice(index, 1);
    setJobItems(_jobItems);
  };
  const handleJobItemChanged = (
    value: any,
    index: number,
    fieldToUpdate?: string,
  ) => {
    let _jobItems = [...jobItems];
    if (!value.dimension_height_cm) {
      value.dimension_height_cm = parseFloat(value.dimension_height) * 100;
    }
    if (!value.dimension_width_cm) {
      value.dimension_width_cm = parseFloat(value.dimension_width) * 100;
    }
    if (!value.dimension_depth_cm) {
      value.dimension_depth_cm = parseFloat(value.dimension_depth) * 100;
    }
    if (fieldToUpdate == "volume") {
      value.volume =
        value.dimension_height *
        value.dimension_width *
        value.dimension_depth *
        value.quantity;
      value.volume_cm = (value.volume * 100).toFixed(2);
    }
    _jobItems[index] = value;
    setJobItems(_jobItems);
    // recalculateTempCalculations(_jobItems);
    // const totalWeight = _jobItems.reduce(
    //   (sum: any, item: { weight: any }) => sum + item.weight,
    //   0,
    // );
    // const totalCbm = _jobItems.reduce(
    //   (sum: any, item: { volume: any }) => sum + item.volume,
    //   0,
    // );
    const { totalCBM, totalWeight } = calculateFinalWeightCBM(job.job_category_id, jobItems, companyWeight);
    setQuoteCalculationRes({
      ...quoteCalculationRes,
      total_weight: totalWeight,
      cbm_auto: totalCBM,
    });
  };

  useEffect(() => {
    // Recalculate cbm_auto and total_weight whenever jobItems change
    const calculateTotals = () => {

      const { totalCBM, totalWeight } = calculateFinalWeightCBM(job.job_category_id, jobItems, companyWeight);

      setTempcalculation({
        cbm_auto: parseFloat(totalCBM.toFixed(2)), // Rounded to 2 decimal points
        total_weight: parseFloat(totalWeight.toFixed(2)), // Rounded to 2 decimal points
      });
    };

    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyWeight, job.job_category_id, jobItems]);

  const addToJobItems = () => {
    let nextId = jobItems[jobItems.length - 1].id + 1;
    setJobItems((jobItems) => [
      ...jobItems,
      { ...defaultJobItem, ...{ id: nextId } },
    ]);
  };

  const dateChanged = useCallback(() => {
    try {
      setJob({
        ...job,
        ready_at: formatDateTimeToDB(jobDateAt, readyAt),
        drop_at: formatDateTimeToDB(jobDateAt, dropAt),
      });
    } catch (e) {
      // console.log(e);
    }
  }, [job, jobDateAt, readyAt, dropAt]);

  useEffect(() => {
    dateChanged();
  }, [dateChanged]);

  const handleRemoveFromTemporaryMedia = (id: number) => {
    let _temporaryMedia = [...temporaryMedia];
    _temporaryMedia = _temporaryMedia.filter((e) => e.id !== id);
    setTemporaryMedia(_temporaryMedia);
  };
  const { refetch: getCustomersByCompanyId } = useQuery(GET_CUSTOMERS_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
      company_id: job.company_id, // Ensure this is provided if needed
    },
    skip: !isCompany,
    onCompleted: (data) => {
      setCustomerOptions([]);
      let _customerOptions = formatToSelect(
        data.customers.data,
        "id",
        "full_name",
      );
      setCustomerOptions(_customerOptions);
      if (isCustomer) {
        setJob({ ...job, ...{ customer_id: customerId } });
        const selectedCustomer = _customerOptions.find(
          (_e) => _e.value === customerId,
        )?.entity;
        if (selectedCustomer) {
          setCustomerSelected(selectedCustomer);
          // Update refinedData with the new properties
        }
        getCustomerAddresses();
      }
    },
  });

  const handleJobCcEmailsChange = useCallback(
    (_event: SyntheticEvent, jobCcEmailTags: string[]) => {
      setJobCcEmailTags(
        jobCcEmailTags.filter((email) => {
          if (!re.test(email)) {
            toast({
              title: "Invalid email",
              description: "Please enter a valid email",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }
          return re.test(email);
        }),
      );
    },
    [re, toast],
  );

  const resetJobTypeAndShowToast = () => {
    job.job_type_id = null;
    toast({
      title: "Job Type Required",
      description:
        "Standard service is no longer available for this time. Please select Express or Urgent.",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
  };
  // Define the reusable function
  useEffect(() => {
    let hasShownToast = false;

    const checkAndUpdateJobTypes = async () => {
      try {
        if (!pickUpDestination?.lat || !pickUpDestination?.lng) return;

        const timezone = await getTimezone(
          pickUpDestination.lat,
          pickUpDestination.lng,
        );

        let updatedOptions = [...jobTypeOptions];

        // LCL (Sea)
        if (job.job_category_id === 1) {
          if (isSameDayJob) {
            updatedOptions = updatedOptions.filter(
              (opt) => opt.label !== "Standard",
            );
            if (!hasShownToast) {
              resetJobTypeAndShowToast();
              hasShownToast = true;
            }
          } else if (isTomorrowJob) {
            const isAfterCut = isAfterCutoff("16:00", timezone);
            if (isAfterCut) {
              updatedOptions = updatedOptions.filter(
                (opt) => opt.label !== "Standard",
              );
              if (!hasShownToast) {
                resetJobTypeAndShowToast();
                hasShownToast = true;
              }
            }
          }
        }

        // Airfreight
        if (job.job_category_id === 2 && isSameDayJob) {
          const isAfterCut = isAfterCutoff("11:00", timezone);
          if (isAfterCut) {
            updatedOptions = updatedOptions.filter(
              (opt) => opt.label !== "Standard",
            );
            if (!hasShownToast) {
              resetJobTypeAndShowToast();
              hasShownToast = true;
            }
          }
        }

        setFilteredJobTypeOptions(updatedOptions);
      } catch (error) {
        console.error("Error updating job type options:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    };

    checkAndUpdateJobTypes();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pickUpDestination?.lat,
    pickUpDestination?.lng,
    job.job_category_id,
    jobDateAt,
    isSameDayJob,
    isTomorrowJob,
    jobTypeOptions,
  ]);

  const validateAddresses = () => {
    if (!pickUpDestination?.address) {
      toast({
        title: "Pickup address is required.",
        description: "Please enter the address in the correct format.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (jobDestinations.some((destination) => !destination.address)) {
      toast({
        title: "Delivery address is required.",
        description:
          "Please ensure all delivery addresses are properly entered.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  // Add this validation helper near the other validation helpers
  const validateTimeslotDepot = () => {
    // Only required for LCL (job_category_id == 1) and Inbound Connect is Yes
    if (
      job.is_inbound_connect === true &&
      job.job_category_id === 1 &&
      (!job.timeslot_depots || job.timeslot_depots === "")
    ) {
      toast({
        title: "Timeslot depot required",
        description:
          "Please select a timeslot depot when Inbound Connect is required.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  const handleJobCreation = () => {
    if (!validateAddresses()) return;
    if (!validateTimeslotDepot()) return;

    if (
      job.job_type_id === null ||
      job.job_type_id === undefined ||
      refinedData.service_choice === ""
    ) {
      toast({
        title: "Job Type Required",
        description: "Please select the available job type once again.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (
      (job.job_category_id == 1 || job.job_category_id == 2) &&
      (!job.transport_type ||
        job.transport_type == "" ||
        job.transport_type == null)
    ) {
      toast({
        title: "Transport Type Required",
        description: "Please select Import or Export as the transport type.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (isAdmin && !job.company_id) {
      toast({
        title: "Company Required",
        description: "Please select a company and customer again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsSaving(true);
    // sendFreightData();
    handleCreateJob();
  };

  const apiUrl = process.env.NEXT_PUBLIC_PRICE_QUOTE_API_URL;
  const sendFreightData = async () => {
    if (!validateAddresses()) return;
    if (!validateTimeslotDepot()) return;
    if (
      job.job_type_id === null ||
      job.job_type_id === undefined ||
      refinedData.service_choice === ""
    ) {
      toast({
        title: "Job Type Required",
        description: "Please select the available job type once again.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (
      (job.job_category_id == 1 || job.job_category_id == 2) &&
      (!job.transport_type || job.transport_type === "")
    ) {
      toast({
        title: "Transport Type Required",
        description: "Please select Import or Export as the transport type.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const today = new Date().toISOString(); // Gets current date and time in ISO format

    const jobDestination1 =
      jobDestinations.length > 0
        ? {
          state: jobDestinations[0]?.address_state,
          suburb: jobDestinations[0]?.address_city,
          postcode: jobDestinations[0]?.address_postal_code,
          address: jobDestinations[0]?.address,
        }
        : null;

    const filteredCompanyRates = companyRates?.filter(
      (rate) => rate.state === jobDestination1?.state,
    );
    const payload = {
      freight_type: refinedData.freight_type,
      transport_type: job.transport_type,
      state:
        refinedData.state ||
        job.pick_up_state ||
        pickUpDestination.address_state,
      state_code: refinedData.state_code || refinedData.pick_up_stateCode,
      service_choice: refinedData.service_choice,
      company_rates:
        (job.job_category_id == 1 && refinedData.pick_up_stateCode === "QLD") ||
          refinedData.pick_up_stateCode === "VIC"
          ? filteredCompanyRates.map((rate) => ({
            company_id: rate.company_id,
            seafreight_id: rate.seafreight_id,
            area: rate.area,
            cbm_rate: rate.cbm_rate,
            minimum_charge: rate.minimum_charge,
          }))
          : [],
      job_pickup_address: {
        state: pickUpDestination?.address_state,
        suburb: pickUpDestination?.address_city,
        postcode: pickUpDestination?.address_postal_code,
        address: pickUpDestination?.address,
      },
      job_destination_address:
        jobDestinations.length > 0
          ? {
            state: jobDestinations[0]?.address_state,
            suburb: jobDestinations[0]?.address_city,
            postcode: jobDestinations[0]?.address_postal_code,
            address: jobDestinations[0]?.address,
          }
          : {},
      pickup_time: {
        ready_by: readyAt,
      },
      delivery_time: {
        drop_by: dropAt,
      },
      surcharges: {
        hand_unload: job.is_hand_unloading || false,
        dangerous_goods: job.is_dangerous_goods || false,
        time_slot: job.is_inbound_connect || null,
        timeslot_depots: job.is_inbound_connect
          ? refinedData.timeslot_depots
          : null,
        tail_lift: job.is_tailgate_required || null,
        stackable: false, // If applicable, update this
      },
      job_items: jobItems.map((item) => ({
        id: item.id,
        name: item.name || "",
        notes: item.notes || "",
        quantity: item.quantity,
        volume: item.volume,
        weight: item.weight,
        dimension_height: item.dimension_height,
        dimension_width: item.dimension_width,
        dimension_depth: item.dimension_depth,
        job_destination: jobDestination1 || null,
        item_type: {
          id: item.item_type?.id || "",
          name: item.item_type?.name || "",
        },
        created_at: refinedData.created_at || today,
        updated_at: refinedData.updated_at || today,
      })),
    };
    try {
      const response = await axios.post(apiUrl, payload, {
        headers: { "Content-Type": "application/json" },
      });
      let calculationData = response.data;
      setQuoteCalculationRes((prev) => ({
        ...prev,
        ...calculationData,
      }));
      freightCalculatedRef.current = true;
      setIsQuotePrice(true);
      return calculationData;
    } catch (error) {
      console.error("Error:", error);
    }
  };

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
                <h1 className="my-8">
                  {isAdmin ? "New Delivery Job" : "New Job Booking"}
                </h1>

                {/* Basic fields */}
                <Box mb="16px">
                  <CustomInputField
                    isSelect={true}
                    optionsArray={jobCategories}
                    label="Job category:"
                    value={jobCategories.find(
                      (job_category) =>
                        job_category.value === job.job_category_id,
                    )}
                    placeholder=""
                    onChange={(e) => {
                      const selectedCategory = e.value;
                      const selectedCategoryName = jobCategories.find(
                        (job_category) =>
                          job_category.value === selectedCategory,
                      )?.label;

                      setJob({
                        ...job,
                        job_category_id: selectedCategory || null,
                      });

                      setRefinedData({
                        ...refinedData,
                        freight_type: selectedCategoryName || null,
                      });
                      // console.log(refinedData, "n");
                    }}
                  />

                  {/* Transport Type Select */}
                  {(job.job_category_id == 1 || job.job_category_id == 2) && (
                    <>
                      <CustomInputField
                        key="transport_typeKey"
                        isSelect={true}
                        optionsArray={[
                          { value: "import", label: "Import" },
                          { value: "export", label: "Export" },
                        ]}
                        label="Transport Type"
                        name="transport_type"
                        value={[
                          { value: "import", label: "Import" },
                          { value: "export", label: "Export" },
                        ].find((_e) => _e.value === job.transport_type)}
                        placeholder=""
                        onChange={(e) => {
                          setJob({ ...job, transport_type: e.value });
                          setRefinedData({
                            ...refinedData,
                            transport_type: e.value,
                          });
                        }}
                      />
                      <CustomInputField
                        key="locationKey"
                        isSelect={true}
                        optionsArray={[
                          { value: "VIC", label: "Victoria" },
                          { value: "QLD", label: "Queensland" },
                        ]}
                        label="State"
                        name="transport_location"
                        value={[
                          { value: "VIC", label: "Victoria" },
                          { value: "QLD", label: "Queensland" },
                        ].find((_e) => _e.value === job.transport_location)}
                        placeholder=""
                        onChange={(e) => {
                          const newState = {
                            ...refinedData,
                            state_code: e.value,
                            state: e.label,
                          };
                          setJob({ ...job, transport_location: e.value });
                          setRefinedData(newState);
                        }}
                      />
                      <Text
                        style={{
                          color: "red",
                          paddingLeft: "11.4rem",
                          paddingBottom: "1rem",
                          fontSize: "14px",
                        }}
                      >
                        Note: For LCL and Airfreight Only
                      </Text>
                    </>
                  )}

                  {!isCompany && (
                    <CustomInputField
                      isSelect={true}
                      optionsArray={companiesOptions}
                      label="Company:"
                      value={companiesOptions.find(
                        (entity) => entity.value === job.company_id,
                      )}
                      placeholder=""
                      onInputChange={(e) => {
                        onChangeSearchQuery(e);
                      }}
                      onChange={(e) => {
                        setCustomerSelected(defaultCustomer);
                        getCustomersByCompanyId({
                          ...defaultVariables,
                          company_id: e.value,
                        });
                        setJob({
                          ...job,
                          company_id: e.value || null,
                          customer_id: null,
                        });
                        setRefinedData({
                          ...refinedData,
                          area: null,
                          cbm_rate: null,
                          minimum_charge: null,
                        });

                        if (e.value) {

                          setCompanyWeight(null); // Reset before fetching
                          getCompany({ id: String(e.value) }).then((res) => {
                            setCompanyWeight(res.data.company.weight_per_cubic);
                          });
                          getCompanyRates({ company_id: String(e.value) });
                        }
                      }}
                    />
                  )}

                  <CustomInputField
                    isSelect={true}
                    optionsArray={customerOptions}
                    label={isCompany ? "Booked by" : "Customer:"}
                    value={
                      customerOptions.find(
                        (entity) => entity.value === job.customer_id,
                      ) || { value: 0, label: "" }
                    }
                    placeholder=""
                    isDisabled={isCompany || isCompanyAdmin}
                    onChange={(e) => {
                      if (isCompany && isCompanyAdmin) return;

                      setJob({
                        ...job,
                        customer_id: e.value || null,
                      });
                      const selectedCustomer = customerOptions.find(
                        (_e) => _e.value === e.value,
                      )?.entity;
                      if (selectedCustomer) {
                        setCustomerSelected(selectedCustomer);
                      }
                    }}
                  />

                  <CustomInputField
                    label="Operator phone:"
                    placeholder=""
                    isDisabled={true}
                    name="operator_phone"
                    value={customerSelected.phone_no}
                    onChange={
                      (_e) => { }
                      //setJob({
                      //  ...job,
                      //  [e.target.name]: e.target.value,
                      //})
                    }
                  />

                  <CustomInputField
                    label="Operator email:"
                    placeholder=""
                    name="operator_email"
                    isDisabled={true}
                    value={customerSelected.email}
                    onChange={
                      (_e) => { }
                      //setJob({
                      //  ...job,
                      //  [e.target.name]: e.target.value,
                      //})
                    }
                  />

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      <SimpleGrid columns={{ sm: 1 }}>
                        <GridItem>Additional email notification to: </GridItem>
                      </SimpleGrid>
                    </FormLabel>
                    <Box>
                      <TagsInput
                        tags={jobCcEmailTags}
                        onTagsChange={handleJobCcEmailsChange}
                        // onTagAdd={handleJobCcEmailAdd}
                        // onTagRemove={handleJobCcEmailRemove}
                        wrapProps={{
                          direction: "column",
                          align: "start",
                          width: "300px",
                        }}
                        wrapItemProps={(isInput) =>
                          isInput ? { alignSelf: "stretch" } : null
                        }
                      />
                    </Box>
                  </Flex>

                  <CustomInputField
                    label="Date:"
                    type={"date"}
                    placeholder=""
                    name="job_date_at"
                    value={jobDateAt}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      const selected = e.target.value;
                      const today = new Date().toISOString().split("T")[0];
                      if (selected.length >= 8 && selected < today) {
                        toast({
                          title: "Invalid Date",
                          description:
                            "Past dates are not allowed. Reset to today.",
                          status: "warning",
                          duration: 4000,
                          isClosable: true,
                        });
                        setJobDateAt(today);
                        setIsSameDayJob(true);
                        setIsTomorrowJob(false);
                        return;
                      }
                      setJobDateAt(selected);
                      setIsSameDayJob(today === selected);
                      setIsTomorrowJob(
                        new Date(selected).toDateString() ===
                        new Date(
                          new Date(today).setDate(
                            new Date(today).getDate() + 1,
                          ),
                        ).toDateString(),
                      );
                    }}
                  />

                  <CustomInputField
                    label="Ready by:"
                    type={"time"}
                    placeholder=""
                    name="ready_at"
                    value={readyAt}
                    onChange={(e) => {
                      setReadyAt(e.target.value);
                      setJob({
                        ...job,
                        ready_at: new Date(
                          `${jobDateAt} ${e.target.value}`,
                        ).toISOString(),
                        drop_at: new Date(
                          `${jobDateAt} ${dropAt}`,
                        ).toISOString(),
                      });
                    }}
                  />

                  <CustomInputField
                    label="Drop by:"
                    type={"time"}
                    placeholder=""
                    name="drop_at"
                    value={dropAt}
                    onChange={(e) => {
                      setDropAt(e.target.value);
                      setJob({
                        ...job,
                        ready_at: new Date(
                          `${jobDateAt} ${readyAt}`,
                        ).toISOString(),
                        drop_at: new Date(
                          `${jobDateAt} ${e.target.value}`,
                        ).toISOString(),
                      });
                    }}
                  />

                  <CustomInputField
                    label="Timeslot:"
                    placeholder=""
                    name="timeslot"
                    value={job.timeslot}
                    onChange={(e) =>
                      setJob({
                        ...job,
                        [e.target.name]: e.target.value,
                      })
                    }
                  />

                  <CustomInputField
                    label="Last Free Day:"
                    type={"date"}
                    placeholder=""
                    name="last_free_at"
                    value={job.last_free_at}
                    onChange={(e) => {
                      setJob({
                        ...job,
                        [e.target.name]: e.target.value,
                      });
                    }}
                  />

                  <ColorSelect
                    label="Type:"
                    optionsArray={filteredJobTypeOptions}
                    selectedJobId={job.job_type_id}
                    value={filteredJobTypeOptions.find(
                      (jobType) => jobType.value === job.job_type_id,
                    )}
                    placeholder="Select type"
                    onChange={(e) => {
                      // setJob({
                      //   ...job,
                      //   job_type_id: e.value || null,
                      // });
                      const selectedCategory = e.value;
                      const selectedCategoryName = filteredJobTypeOptions.find(
                        (job_category) =>
                          job_category.value === selectedCategory,
                      )?.label;

                      setJob({
                        ...job,
                        job_type_id: selectedCategory || null,
                      });

                      setRefinedData({
                        ...refinedData,
                        service_choice: selectedCategoryName || null,
                      });
                      // console.log(refinedData, "n");
                      // console.log(job, "job");
                    }}
                  />

                  <CustomInputField
                    label="Reference:"
                    placeholder=""
                    name="reference_no"
                    value={job.reference_no}
                    onChange={(e) =>
                      setJob({
                        ...job,
                        [e.target.name]: e.target.value,
                      })
                    }
                  />

                  <CustomInputField
                    label="Booked By:"
                    placeholder=""
                    name="booked_by"
                    value={job.booked_by}
                    onChange={(e) =>
                      setJob({
                        ...job,
                        [e.target.name]: e.target.value,
                      })
                    }
                  />

                  {isAdmin && (
                    <>
                      <CustomInputField
                        isInput
                        label="Quoted Price (Buy Price)"
                        placeholder=""
                        name="quoted_price"
                        onChange={(e) =>
                          setJob({
                            ...job,
                            [e.target.name]: e.target.value,
                          })
                        }
                      />
                      <CustomInputField
                        isTextArea={true}
                        label="Admin notes:"
                        placeholder="Admin notes"
                        name="admin_notes"
                        value={job.admin_notes}
                        onChange={(e) =>
                          setJob({
                            ...job,
                            [e.target.name]: e.target.value,
                          })
                        }
                      />
                    </>
                  )}

                  {/* {!isAdmin && job.transport_location === "QLD" && (
                    <CustomInputField
                      isSelect={true}
                      optionsArray={companyRates.map((rate) => ({
                        value: rate.area,
                        label: rate.area,
                      }))}
                      label="Area :"
                      value={
                        selectedRegion.area
                          ? {
                            value: selectedRegion.area,
                            label: selectedRegion.area,
                          }
                          : null
                      }
                      placeholder="Select area"
                      onChange={(e) => {
                        const selectedRate = companyRates.find(
                          (rate) => rate.area === e.value,
                        );
                        if (selectedRate) {
                          setSelectedRegion({
                            area: selectedRate.area,
                            cbm_rate: selectedRate.cbm_rate,
                            minimum_charge: selectedRate.minimum_charge,
                          });

                          setRefinedData((prev) => ({
                            ...prev,
                            area: selectedRate.area,
                            cbm_rate: selectedRate.cbm_rate,
                            minimum_charge: selectedRate.minimum_charge,
                          }));
                        }
                      }}
                    />
                  )} */}
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
                        savedAddressesSelect={savedAddressesSelect}
                        defaultJobDestination={pickUpDestination}
                        entityModel={job}
                        onAddressSaved={(_hasChanged) => {
                          getCustomerAddresses();
                        }}
                        jobDestinationChanged={(jobDestination) => {
                          const stateCode = getStateCode(
                            jobDestination.address_state,
                          );

                          setPickUpDestination({
                            ...pickUpDestination,
                            ...jobDestination,
                            ...{ is_pickup: true },
                          });
                          let currentPickupstate =
                            pickUpDestination.address_state == "Victoria"
                              ? "VIC"
                              : pickUpDestination.address_state == "Queensland"
                                ? "QLD"
                                : "";
                          const filtereddepotOption = depotOptions.filter(
                            (option) => option.state_code == currentPickupstate,
                          );
                          setFilteredDepotOptions(filtereddepotOption);
                          // console.log(
                          //   filtereddepotOption,
                          //   "filtereddepotOptions",
                          // );
                          setJob({
                            ...job,
                            ...{
                              pick_up_lng: jobDestination.lng,
                              pick_up_lat: jobDestination.lat,
                              pick_up_address: jobDestination.address,
                              pick_up_notes: jobDestination.notes,
                              pick_up_name: jobDestination.name,
                              pick_up_report: jobDestination.report,
                              pick_up_state: jobDestination.state,
                            },
                          });

                          setRefinedData({
                            ...refinedData,
                            ...{
                              pick_up_state: jobDestination.state,
                              pick_up_stateCode: stateCode,
                            },
                          });
                        }}
                      />
                    </Grid>
                  </Box>

                  <Divider className="my-12" />

                  {/* Delivery Information */}
                  <Box mb="16px">
                    <h3 className="mb-5 mt-3">Delivery Information</h3>
                    {/* foreach jobDestinations */}
                    {jobDestinations.map((jobDestination, index) => {
                      const key = jobDestination?.id ?? `new-${index}`;

                      return (
                        <Box key={key}>
                          <Grid templateColumns="repeat(10, 1fr)" gap={4}>
                            <GridItem colSpan={2}>
                              <h4 className="mb-5 mt-3">
                                Delivery Address {index + 1}
                              </h4>
                            </GridItem>
                            <JobAddressesSection
                              entityModel={job}
                              onAddressSaved={(_hasChanged) => {
                                getCustomerAddresses();
                              }}
                              savedAddressesSelect={savedAddressesSelect}
                              defaultJobDestination={jobDestination}
                              jobDestinationChanged={(jobDestination) => {
                                handleJobDestinationChanged(
                                  jobDestination,
                                  index,
                                );
                              }}
                            />
                            <GridItem>
                              <Flex>
                                {/* if index == 0 */}
                                {jobDestinations.length > 1 && (
                                  <Button
                                    bg="white"
                                    className="!text-[var(--chakra-colors-black-400)] mt-[3px] !py-3 !px-1 !h-[unset]"
                                    onClick={() => {
                                      handleRemoveFromJobDestinations(index);
                                    }}
                                  >
                                    <FontAwesomeIcon
                                      icon={faTrashCan}
                                      className="!text-[var(--chakra-colors-black-400)]"
                                    />
                                  </Button>
                                )}
                              </Flex>
                            </GridItem>
                          </Grid>
                          <Divider className="my-12" />
                        </Box>
                      );
                    })}
                  </Box>

                  <Box mb="16px">
                    <Flex alignItems="center" mb="16px" mt={5}>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          addToJobDestinations();
                        }}
                      >
                        + Add delivery location
                      </Button>
                    </Flex>
                  </Box>
                </Box>

                <Divider className="my-12" />

                {/* Items */}
                <Box mb="16px" mt={4}>
                  <Flex justify="space-between" align="center" className="mb-6">
                    <h3 className="">Items</h3>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        addToJobItems();
                      }}
                    >
                      + Add item
                    </Button>
                  </Flex>

                  <JobInputTable
                    columns={itemsTableColumns}
                    data={jobItems}
                    optionsSelect={itemTypes}
                    onRemoveClick={(index) => {
                      handleRemoveFromJobItems(index);
                    }}
                    onValueChanged={handleJobItemChanged}
                  />
                  <Box
                    mt={4}
                    p={3}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    backgroundColor="gray.50"
                  >
                    {/* CBM Auto */}
                    <Flex justify="flex-end" align="center" mb={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="500"
                        color="gray.700"
                        pl={4}
                      >
                        CBM Auto&nbsp;:&nbsp;
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color="blue.600"
                        textAlign="right"
                        pr={4}
                      >
                        {isQuotePrice
                          ? quoteCalculationRes.cbm_auto
                          : tempcalculation?.cbm_auto || 0}
                      </Text>
                    </Flex>

                    {/* Total Weight */}
                    <Flex justify="flex-end" align="center">
                      <Text
                        fontSize="sm"
                        fontWeight="500"
                        color="gray.700"
                        pl={4}
                      >
                        Total Weight&nbsp;:&nbsp;
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color="blue.600"
                        textAlign="right"
                        pr={4}
                      >
                        {isQuotePrice
                          ? quoteCalculationRes.total_weight
                          : tempcalculation?.total_weight || 0}
                      </Text>
                    </Flex>
                  </Box>
                </Box>

                <Divider className="my-12" />

                {/* Attachments */}
                <Box mb="16px">
                  <h3 className="mb-5 mt-3">Attachments</h3>
                  <Flex width="100%" className="mb-6">
                    <FileInput
                      entity="Job"
                      entityId={job.id}
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
                      value={job.customer_notes}
                      onChange={(e) =>
                        setJob({
                          ...job,
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
                        value={job.base_notes}
                        onChange={(e) =>
                          setJob({
                            ...job,
                            [e.target.name]: e.target.value,
                          })
                        }
                      />
                    )}
                  </Box>

                  <Box mb="16px">
                    <Flex alignItems="center" width="100%" pt={7}>
                      <SimpleGrid
                        columns={{ sm: 2, md: 2 }}
                        spacing={10}
                        width="100%"
                      >
                        <GridItem>
                          <Flex
                            flexDirection="column"
                            alignItems="flex-start"
                            width="100%"
                          >
                            <FormLabel
                              display="flex"
                              // mb={2}  // Added margin-bottom for spacing
                              fontSize="sm"
                              fontWeight="500"
                              _hover={{ cursor: "pointer" }}
                              pr={3}
                            >
                              Does this job require a timeslot booking through
                              Inbound Connect?
                            </FormLabel>
                            <RadioGroup
                              defaultValue={"0"}
                              onChange={(e) => {
                                setJob({
                                  ...job,
                                  is_inbound_connect: e === "1" ? true : false,
                                });
                                let curretstatecode =
                                  jobDestinations[0].address_state == "Victoria"
                                    ? "VIC"
                                    : jobDestinations[0].address_state ==
                                      "Queensland"
                                      ? "QLD"
                                      : "";
                                const filtereddepotOp = depotOptions.filter(
                                  (option) =>
                                    option.state_code == curretstatecode,
                                );
                                setFilteredDepotOptions(filtereddepotOp);
                              }}
                            >
                              <Stack direction="row">
                                <Radio value="0">No</Radio>
                                <Radio value="1" pl={6}>
                                  Yes
                                </Radio>
                              </Stack>
                            </RadioGroup>
                          </Flex>

                          {job.job_category_id === 1 &&
                            job.is_inbound_connect === true && (
                              <Box>
                                <CustomInputField
                                  isSelect={true}
                                  optionsArray={filtereddepotOptions} // Dynamically updated options
                                  label="Timeslot depots:"
                                  value={
                                    filtereddepotOptions.find(
                                      (option) =>
                                        option.value === job.timeslot_depots,
                                    ) || null
                                  }
                                  placeholder="Select a depot"
                                  onChange={(e) => {
                                    setRefinedData({
                                      ...refinedData,
                                      timeslot_depots: e.value,
                                    });
                                    setJob({
                                      ...job,
                                      timeslot_depots: e.value, // Update job.timeslot_depots
                                    });
                                  }}
                                />
                              </Box>
                            )}

                          <Flex
                            flexDirection="column"
                            alignItems="flex-start"
                            width="100%"
                            pt={7}
                          >
                            <FormLabel
                              display="flex"
                              mb={2} // Added margin-bottom for spacing
                              fontSize="sm"
                              fontWeight="500"
                              _hover={{ cursor: "pointer" }}
                            >
                              Does this job require hand unloading?
                            </FormLabel>
                            <RadioGroup
                              defaultValue={"0"}
                              onChange={(e) => {
                                setJob({
                                  ...job,
                                  is_hand_unloading: e === "1" ? true : false,
                                });
                              }}
                            >
                              <Stack direction="row">
                                <Radio value="0">No</Radio>
                                <Radio value="1" pl={6}>
                                  Yes
                                </Radio>
                              </Stack>
                            </RadioGroup>
                          </Flex>

                          <Flex
                            flexDirection="column"
                            alignItems="flex-start"
                            width="100%"
                            pt={7}
                          >
                            <FormLabel
                              display="flex"
                              mb={2} // Added margin-bottom for spacing
                              fontSize="sm"
                              fontWeight="500"
                              _hover={{ cursor: "pointer" }}
                            >
                              Are there dangerous goods being transported?
                            </FormLabel>
                            <RadioGroup
                              defaultValue={"0"}
                              onChange={(e) => {
                                setJob({
                                  ...job,
                                  is_dangerous_goods: e === "1" ? true : false,
                                });
                              }}
                            >
                              <Stack direction="row">
                                <Radio value="0">No</Radio>
                                <Radio value="1" pl={6}>
                                  Yes
                                </Radio>
                              </Stack>
                            </RadioGroup>
                          </Flex>

                          <Flex
                            flexDirection="column"
                            alignItems="flex-start"
                            width="100%"
                            pt={7}
                          >
                            <FormLabel
                              display="flex"
                              mb={2} // Added margin-bottom for spacing
                              fontSize="sm"
                              fontWeight="500"
                              _hover={{ cursor: "pointer" }}
                            >
                              Is a Tail Lift vehicle required?
                            </FormLabel>
                            <RadioGroup
                              defaultValue={"0"}
                              onChange={(e) => {
                                setJob({
                                  ...job,
                                  is_tailgate_required:
                                    e === "1" ? true : false,
                                });
                              }}
                            >
                              <Stack direction="row">
                                <Radio value="0">No</Radio>
                                <Radio value="1" pl={6}>
                                  Yes
                                </Radio>
                              </Stack>
                            </RadioGroup>
                          </Flex>
                        </GridItem>

                        <GridItem
                          pr={4} // Add desired right padding here
                        >
                          {(job.job_category_id == 1 ||
                            job.job_category_id == 2) &&
                            (refinedData.pick_up_stateCode === "VIC" ||
                              refinedData.pick_up_stateCode === "QLD") &&
                            quoteCalculationRes && (
                              <Flex
                                height="100%"
                                justifyContent="center"
                                pt={7}
                                flexDirection="column"
                              >
                                <Flex justify="center">
                                  {" "}
                                  {/* Center the button */}
                                  <Button
                                    bg="#3b82f6" /* Match the blue color */
                                    color="white"
                                    _hover={{
                                      bg: "#2563eb", // Slightly darker blue for hover
                                    }}
                                    _active={{
                                      bg: "#2563eb", // Active state
                                      transform: "scale(0.95)", // Slightly shrink button when activated
                                    }}
                                    borderRadius="8px" /* Rounded corners */
                                    px={6}
                                    py={3}
                                    fontWeight="500"
                                    fontSize="sm"
                                    onClick={() => {
                                      // logAllFormElements();
                                      sendFreightData();
                                    }}
                                  >
                                    Get A Quote
                                  </Button>
                                </Flex>
                                {quoteCalculationRes && (
                                  <Box mt={4}>
                                    <Stack spacing={3}>
                                      {/* Freight */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Freight:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.freight}
                                        </Text>
                                      </Flex>

                                      {/* Fuel */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Fuel:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.fuel}
                                        </Text>
                                      </Flex>

                                      {/* Hand Unload */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Hand Unload:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.hand_unload}
                                        </Text>
                                      </Flex>

                                      {/* Time Slot */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Time Slot:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.time_slot}
                                        </Text>
                                      </Flex>

                                      {/* tail_lift */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Tail Lift:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.tail_lift}
                                        </Text>
                                      </Flex>

                                      {/* Dangerous Goods */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Dangerous Goods:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.dangerous_goods}
                                        </Text>
                                      </Flex>

                                      {/* Stackable */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Stackable:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.stackable}
                                        </Text>
                                      </Flex>

                                      {/* Total */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Total:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.total}
                                        </Text>
                                      </Flex>
                                    </Stack>
                                  </Box>
                                )}
                              </Flex>
                            )}
                        </GridItem>
                      </SimpleGrid>
                    </Flex>
                    {/* Display response of the button click */}
                  </Box>
                </Box>

                <Divider className="mt-12 mb-6" />

                {/* Create Job Button */}
                <Flex alignItems="center" className="mb-6">
                  {/* <Button
                  variant="primary"
                  onClick={() => {
                    setIsSaving(true);
                    handleCreateJob();
                  }}
                  isDisabled={isSaving}
                >
                  Create Job
                </Button> */}
                  <Button
                    variant="primary"
                    onClick={handleJobCreation}
                    isDisabled={isSaving}
                  >
                    Create Job
                  </Button>
                  {/* <Button
                    variant="primary"
                    onClick={handleJobCreation}
                    isDisabled={
                      (job.job_category_id === 1 ||
                        job.job_category_id === 2) &&
                      (job.transport_location === "VIC" ||
                        job.transport_location === "QLD") &&
                      !isQuotePrice // Disable the button if setIsQuotePrice (isQuotePrice) is false
                        ? true
                        : isSaving // Otherwise, consider the existing `isSaving` condition
                    }
                  >
                    Create Job
                  </Button> */}
                </Flex>
              </FormControl>
            </Grid>
          }
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default JobPage;
