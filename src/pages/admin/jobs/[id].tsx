// Chakra imports
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  FormControl,
  Grid,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import InvoiceTab from "components/jobs/InvoiceTab";
import JobDetailsTab from "components/jobs/JobDetailsTab";
import MessageLogTab from "components/jobs/MessageLogTab";
import ReportsTab from "components/jobs/ReportsTab";
import { TabsComponent } from "components/tabs/TabsComponet";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { GET_COMPANY_QUERY, GET_COMPANYS_QUERY } from "graphql/company";
import { GET_COMPANY_RATE_QUERY } from "graphql/CompanyRate";
import { defaultCustomer, GET_CUSTOMERS_QUERY } from "graphql/customer";
import { GET_CUSTOMER_ADDRESSES_QUERY } from "graphql/customerAddress";
import { GET_DRIVERS_QUERY } from "graphql/driver";
import { GET_ITEM_TYPES_QUERY } from "graphql/itemType";
import defaultJobQuoteData, {
  defaultJob,
  DELETE_JOB_MUTATION,
  GET_ALL_TIMESLOT_DEPOTS,
  GET_JOB_QUERY,
  UPDATE_JOB_MUTATION,
} from "graphql/job";
import { GET_JOB_CATEGORIES_QUERY } from "graphql/jobCategories";
import {
  CREATE_JOB_CC_EMAIL_MUTATION,
  DELETE_JOB_CC_EMAIL_MUTATION,
} from "graphql/jobCcEmails";
import {
  CREATE_JOB_DESTINATION_MUTATION,
  defaultJobDestination,
  DELETE_JOB_DESTINATION_MUTATION,
  UPDATE_JOB_DESTINATION_MUTATION,
} from "graphql/jobDestination";
import {
  CREATE_JOB_ITEM_MUTATION,
  defaultJobItem,
  DELETE_JOB_ITEM_MUTATION,
  UPDATE_JOB_ITEM_MUTATION,
} from "graphql/jobItem";
import {
  CREATE_JOB_PRICE_CALCULATION_DETAIL_MUTATION,
  CreateJobPriceCalculationDetailInput,
  defaultJobPriceCalculationDetail,
  GET_JOB_PRICE_CALCULATION_DETAIL_QUERY,
  UPDATE_JOB_PRICE_CALCULATION_DETAIL_MUTATION,
  // UpdateJobPriceCalculationDetailInput,
} from "graphql/JobPriceCalculationDetail";
import { GET_JOB_STATUSES_QUERY } from "graphql/jobStatus";
import { GET_JOB_TYPES_QUERY } from "graphql/jobType";
import { DELETE_MEDIA_MUTATION } from "graphql/media";
import {
  formatDate,
  formatDateTimeToDB,
  formatTimeUTCtoInput,
  // getTimezone,
  // isAfterCutoff,
  today,
} from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import { useRouter } from "next/router";
import {
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
interface _CalculationData {
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
}

export function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

function JobEdit() {
  const toast = useToast();
  const isMounted = useIsMounted();
  // const textColor = useColorModeValue("navy.700", "white");
  const textColorSecodary = useColorModeValue("#888888", "#888888");
  const [job, setJob] = useState(defaultJob);
  const [refinedData, setRefinedData] = useState(defaultJobQuoteData);
  const [quoteCalculationRes, setQuoteCalculationRes] = useState(
    defaultJobPriceCalculationDetail,
  );
  // const [changedFields, setChangedFields] =
  //   useState<typeof defaultJob>(defaultJob);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [_pricecalculationid, setPricecalculationid] = useState(null);
  const [buttonText, setButtonText] = useState("Get A Quote");
  const router = useRouter();
  // const { id } = router.query;
  const routeReady = router.isReady && typeof router.query.id === "string";
  const jobId = routeReady ? parseInt(router.query.id as string, 10) : null;
  const id = jobId;
  // console.log(id, "ids");
  const [isSaving, setIsSaving] = useState(false);
  const [updatingMedia, setUpdatingMedia] = useState(false);
  const [tabId, setActiveTab] = useState(1);
  const [jobItems, setJobItems] = useState([defaultJobItem]);
  const [originalJobItems, setOriginalJobItems] = useState([]); // used to delete items if are not contained in the new jobItems array
  const [customerSelected, setCustomerSelected] = useState(defaultCustomer);
  const [jobTypeOptions, setJobTypeOptions] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [jobStatuses, setJobStatuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [companiesOptions, setCompaniesOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [savedAddressesSelect, setSavedAddressesSelect] = useState([]);
  const [jobDateAt, setJobDateAt] = useState(today);
  const [readyAt, setReadyAt] = useState("06:00");
  const [dropAt, setDropAt] = useState("17:00");
  const [originalJobDestinations, setOriginalJobDestinations] = useState([]);
  const [jobDestinations, setJobDestinations] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedSearchDriver, setDebouncedSearchDriver] = useState("");
  const re = useMemo(() => {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  }, []);
  const [deleteJobCcEmailId, setDeleteJobCcEmailId] = useState(null);
  const [createdCcEmail, setCreatedCcEmail] = useState(null);
  const [jobCcEmails, setJobCcEmails] = useState([]);
  const [jobCcEmailTags, setJobCcEmailTags] = useState([]);
  const isAdmin = useSelector((state: RootState) => state.user.isAdmin);
  // const customerId = useSelector((state: RootState) => state.user.customerId);
  // const companyId = useSelector((state: RootState) => state.user.companyId);
  const isCompany = useSelector((state: RootState) => state.user.isCompany);
  const isCustomer = useSelector((state: RootState) => state.user.isCustomer);
  const [pickUpDestination, setPickUpDestination] = useState(
    defaultJobDestination,
  );
  const [_isSameDayJob, setIsSameDayJob] = useState(false);
  const [_isTomorrowJob, setIsTomorrowJob] = useState(false);
  // const [filteredJobTypeOptions, setFilteredJobTypeOptions] = useState([]);
  const [locationOptions, _setLocationOptions] = useState([
    { value: "VIC", label: "Victoria" },
    { value: "QLD", label: "Queensland" },
  ]);

  const [depotOptions, setDepotOptions] = useState([]);
  const [filtereddepotOptions, setFilteredDepotOptions] = useState([]);
  const [companyWeight, setCompanyWeight] = useState(null);
  const [_selectedDepot, setSelectedDepot] = useState("");

  const [prevJobState, setPrevJobState] = useState({
    freight_type: refinedData.freight_type,
    transport_type: job.transport_type,
    transport_location: job.transport_location,
    job_items: jobItems, // Add job_items to the state
  });

  const [companyRates, setCompanyRates] = useState([]);

  const [_selectedRegion, setSelectedRegion] = useState({
    area: "",
    cbm_rate: 0,
    minimum_charge: 0,
  });

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
      isVisible: true,
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
      isVisible:
        isAdmin ||
        !(
          isCustomer &&
          (job.customer_invoice == undefined ||
            job.customer_invoice?.invoice_status_id == 1)
        ),
    },
  ];

  // const NEW_CUTOFF_RULES_START_DATE = "2024-10-24";

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
        accessor: "name" as const,
      },
      {
        Header: "uploaded by",
        accessor: "uploaded_by" as const,
      },
      {
        Header: "date uploaded",
        accessor: "created_at" as const,
        type: "date",
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

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setDebouncedSearch(e);
    }, 300);
  }, []);

  const onChangeCustomerSearchQuery = useMemo(() => {
    return debounce((e) => {
      setDebouncedSearchDriver(e);
    }, 300);
  }, []);

  const {
    loading: jobLoading,
    data: jobData, // Renamed 'data' to 'jobData'
    refetch: getJob,
  } = useQuery(GET_JOB_QUERY, {
    variables: {
      id: id,
    },
    skip: !routeReady || !id,
    onCompleted: (data) => {
      if (!isMounted.current) return; 

      if (!data?.job) {
        router.push("/admin/jobs");
        return;
      }

      if (!updatingMedia) {
        setJob((prev) => ({
          ...prev,
          ...data?.job,
          company_id: parseInt(data?.job.company_id, 10),
          media: data?.job.media,
          job_category_id: data?.job.job_category_id,
          transport_location: data?.job.transport_location,
          transport_type: data?.job.transport_type,
          company_area: data?.job.company_area,
          job_type_id: data?.job.job_type_id,
          pick_up_state: data?.job.pick_up_state,
          timeslot_depots: data?.job.timeslot_depots,
          job_status_id: data?.job.job_status_id,
        }));
        if (data?.job.company_area && companyRates.length > 0) {
          const matchingRate = companyRates.find(
            (rate) => rate.area === data.job.company_area,
          );
          if (matchingRate) {
            setSelectedRegion({
              area: matchingRate.area,
              cbm_rate: matchingRate.cbm_rate,
              minimum_charge: matchingRate.minimum_charge,
            });
          }
        }

        // ✅ Refetch company rates if company_id is valid
        if (data.job.company_id) {
          getCompanyRates();
        }

        // ✅ Set refined data (freight type, state, etc.)
        const selectedCategoryName = jobCategories.find(
          (job_category) => job_category.value == data.job.job_category_id,
        )?.label;
        const selectedStateCode =
          data.job.pick_up_state == "Victoria"
            ? "VIC"
            : data.job.pick_up_state == "Queensland"
              ? "QLD"
              : "";
        const selectedLocation = locationOptions.find(
          (location) => location.label == data.job.pick_up_state,
        );
        setRefinedData((prev) => ({
          ...prev,
          freight_type: selectedCategoryName || null,
          state_code: selectedLocation?.value || null,
          state: selectedLocation?.label || null,
        }));

        setFilteredDepotOptions(
          depotOptions.filter(
            (option) => option.state_code === selectedStateCode,
          ),
        );

        // ✅ Fetch customers by company ID
        getCustomersByCompanyId({
          query: "",
          page: 1,
          first: 1000,
          orderByColumn: "id",
          orderByOrder: "ASC",
          company_id: data.job.company_id,
        });

        // ✅ Set date/time fields
        setJobDateAt(
          data.job.ready_at ? formatDate(data.job.ready_at) : jobDateAt,
        );
        setReadyAt(
          data.job.ready_at ? formatTimeUTCtoInput(data.job.ready_at) : readyAt,
        );
        setDropAt(
          data.job.drop_at ? formatTimeUTCtoInput(data.job.drop_at) : dropAt,
        );
        setIsSameDayJob(today === formatDate(data.job.ready_at));
        setIsTomorrowJob(
          new Date(formatDate(data.job.ready_at)).toDateString() ===
          new Date(
            new Date(today).setDate(new Date(today).getDate() + 1),
          ).toDateString(),
        );

        // ✅ Set destination data
        const _destinations =
          data.job.job_destinations?.filter((d: any) => !d.is_pickup) || [];

        setOriginalJobDestinations(_destinations);
        setJobDestinations(_destinations);

        setPickUpDestination(
          data.job.pick_up_destination || {
            ...defaultJobDestination,
            id: 0,
            is_new: true,
          },
        );

        // ✅ Set job items
        setOriginalJobItems(data.job.job_items || []);
        setJobItems(data.job.job_items || []);

        // ✅ Set CC emails
        setJobCcEmails(data.job.job_cc_emails || []);
        setJobCcEmailTags(
          data.job.job_cc_emails?.map((e: { email: string }) => e.email) || [],
        );

        // ✅ Quote Calculation
        const { totalCBM, totalWeight } = calculateFinalWeightCBM(job.job_category_id, jobItems, companyWeight);

        setQuoteCalculationRes((prev) => ({
          ...prev,
          total_weight: totalWeight,
          cbm_auto: totalCBM,
        }));
      } else {
        // ✅ For updating media only
        setJob((prev) => ({
          ...prev,
          media: data?.job.media,
        }));
        setJobCcEmails(data.job.job_cc_emails || []);
        setUpdatingMedia(false);
      }
      // console.log({ jobStatuses, drivers, jobCategories }, "ll");
    },

    onError(error) {
      // console.log("onError");
      console.log(error);
    },
  });

 const { data: _depotData } = useQuery(GET_ALL_TIMESLOT_DEPOTS, {
    context: { noAuthRedirect: true },
    onCompleted: (data) => {
      if (!isMounted.current) return; // ✅ skip if unmounted
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
      }
    },
    onError: (error) => {
      console.error("Error fetching depots:", error);
      if (!isMounted.current) return; // ✅ skip if unmounted
      toast({
        title: "Error fetching depots",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });
  useEffect(() => {
    if (job.company_area && companyRates.length > 0) {
      const matchingRate = companyRates.find(
        (rate) => rate.area === job.company_area,
      );
      if (matchingRate) {
        setSelectedRegion({
          area: matchingRate.area,
          cbm_rate: matchingRate.cbm_rate,
          minimum_charge: matchingRate.minimum_charge,
        });
      }
    }
  }, [companyRates, job.company_area]);

  const { loading: _companyLoading, data: _companyData } = useQuery(
    GET_COMPANY_QUERY,
    {
      variables: {
        id: job?.company_id,
      },
      skip: !job?.company_id,
      onCompleted: (data) => {
        if (data?.company == null) {
          // router.push("/admin/companies");
        }
        // console.log("Company data:", data.company);
        if (data?.company?.weight_per_cubic != null) {
          setCompanyWeight(data.company.weight_per_cubic);
        }
        setRefinedData({
          ...refinedData,
        });
      },
      onError(_error) {
        // console.log("onError");
        // console.log(error);
      },
    },
  );

  useEffect(() => {
    if (jobData?.job) {
      // Use 'jobData' instead of 'data'
      setJob({
        ...job,
        job_category_id: jobData.job.job_category_id,
        transport_location: jobData.job.transport_location,
        job_type_id: jobData.job.job_type_id,
      });

      // Find the selected category name based on job_category_id
      const selectedCategoryName = jobCategories.find(
        (job_category) => job_category.value === jobData.job.job_category_id,
      )?.label;

      const selectedLocation = locationOptions.find(
        (location) => location.value === jobData.job.transport_location,
      );

      const _matchedJobType = jobTypeOptions.find(
        (type) => type.id === jobData.job.job_type_id,
      );

      setRefinedData({
        ...refinedData,
        freight_type: selectedCategoryName,
        state_code: jobData.job.transport_location,
        state: selectedLocation?.label || null,
        // job_type: matchedJobType?.name || null,
        // job_type_color: matchedJobType?.color || null
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobData, jobCategories, jobTypeOptions, companyRates]); // Use 'jobData' instead of 'data'

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

  const [handleUpdateJob, { }] = useMutation(UPDATE_JOB_MUTATION, {
    variables: {
      input: {
        id: job.id,
        name: job.name,
        reference_no: job.reference_no,
        booked_by: job.booked_by,
        company_area: job.company_area,
        notes: job.notes,
        job_category_id: job.job_category_id,
        job_status_id: job.job_status_id,
        job_type_id: job.job_type_id,
        decline_reason_id: job.decline_reason_id,
        driver_id: job.driver_id,
        region_id: job.region_id,
        customer_id: job.customer_id,
        company_id: job.company_id,
        start_at: job.start_at,
        ready_at: job.ready_at,
        drop_at: job.drop_at,
        completed_at: job.completed_at,
        pick_up_lng: job.pick_up_lng,
        pick_up_lat: job.pick_up_lat,
        pick_up_address: job.pick_up_address,
        pick_up_state: job.pick_up_state,
        pick_up_notes: job.pick_up_notes,
        pick_up_name: job.pick_up_name,
        pick_up_report: job.pick_up_report,
        delivery_name: job.delivery_name,
        delivery_report: job.delivery_report,
        customer_notes: job.customer_notes,
        base_notes: job.base_notes,
        admin_notes: job.admin_notes,
        decline_notes: job.decline_notes,
        minutes_waited: job.minutes_waited,
        is_inbound_connect: job.is_inbound_connect,
        is_hand_unloading: job.is_hand_unloading,
        is_dangerous_goods: job.is_dangerous_goods,
        is_tailgate_required: job.is_tailgate_required,
        timeslot: job.timeslot,
        timeslot_depots: job.timeslot_depots,
        last_free_at: job.last_free_at,
        // sort_id: job.sort_id,
        quoted_price: job.quoted_price,
        transport_type: job.transport_type,
        transport_location: job.transport_location,
      },
      // // console.log("job", job)
    },
    onCompleted: async (data) => {
      //update job items
      for (let jobItem of jobItems) {
        if (jobItem.is_new) {
          handleCreateJobItem({
            input: {
              ...jobItem,
              job_id: parseInt(data.updateJob.id),
              is_new: undefined,
              dimension_height_cm: undefined,
              dimension_width_cm: undefined,
              dimension_depth_cm: undefined,
              volume_cm: undefined,
              id: undefined,
              item_type: undefined,
            },
          });
        } else {
          handleUpdateJobItem({
            variables: {
              input: {
                ...jobItem,
                item_type: undefined,
                is_new: undefined,
                dimension_height_cm: undefined,
                dimension_width_cm: undefined,
                dimension_depth_cm: undefined,
                volume_cm: undefined,
              },
            },
          });
        }
      }
      //delete job items
      originalJobItems.forEach((originalJobItem) => {
        if (
          !jobItems.find((jobItem) => {
            return jobItem.id == originalJobItem.id;
          })
        ) {
          handleDeleteJobItem({
            variables: {
              id: parseInt(originalJobItem.id),
            },
          });
        }
      });
      //update job destinations
      let _jobDestinations = [...jobDestinations];
      for (let jobDestination of _jobDestinations) {
        if (jobDestination.is_new) {
          await handleCreateJobDestination({
            input: {
              ...jobDestination,
              job_id: parseInt(data.updateJob.id),
              id: undefined,
              is_new: undefined,
              customer_id: undefined,
              label: undefined,
              is_pickup: false,
              updated_at: undefined,
              route_point: undefined,
              issue_reports: undefined,
              media: undefined,
            },
          });
        } else {
          handleUpdateJobDestination({
            variables: {
              input: {
                ...jobDestination,
                route_point: undefined,
                customer_id: undefined,
                label: undefined,
                updated_at: undefined,
                is_pickup: false,
                issue_reports: undefined,
                media: undefined,
                is_new: undefined,
              },
            },
          });
        }
      }
      //delete job destinations
      originalJobDestinations.forEach((originalJobDestination) => {
        if (
          !jobDestinations.find((jobDestination) => {
            return jobDestination.id == originalJobDestination.id;
          })
        ) {
          handleDeleteJobDestination({
            variables: {
              id: parseInt(originalJobDestination.id),
            },
          });
        }
      });

      handleUpdateJobDestination({
        variables: {
          input: {
            ...pickUpDestination,
            route_point: undefined,
            label: undefined,
            is_pickup: true,
            updated_at: undefined,
            issue_reports: undefined,
            media: undefined,
            is_new: undefined,
          },
        },
      });
      await getJob();
      setIsSaving(false);

      toast({
        title: "Job updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      setIsSaving(false); // redeploy
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteJob, { }] = useMutation(DELETE_JOB_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (_data) => {
      toast({
        title: "Job deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/jobs");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  useQuery(GET_JOB_CATEGORIES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (!isMounted.current) return;
      const options = data.jobCategorys.data.map((item: any) => ({
        value: parseInt(item.id),
        label: item.name,
      }));
      setJobCategories(options);
    },
  });
  useQuery(GET_JOB_STATUSES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (!isMounted.current) return;
      // setJobStatuses([]);
      data.jobStatuses.data.map((jobStatus: any) => {
        setJobStatuses((_entity) => [
          ..._entity,
          {
            value: parseInt(jobStatus.id),
            label: jobStatus.name,
          },
        ]);
      });
    },
  });
  useQuery(GET_DRIVERS_QUERY, {
    variables: {
      query: debouncedSearchDriver,
      page: 1,
      first: 10000,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (!isMounted.current) return;
      // setDrivers([]);
      data.drivers.data.map((driver: any) => {
        if (!isMounted.current) return;
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

  useQuery(GET_JOB_TYPES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (!isMounted.current) return;
      setJobTypeOptions(
        data.jobTypes?.data.map((jobType: any) => ({
          label: jobType.name,
          value: jobType.id,
        })),
      );
    },
  });
  // Use the useQuery hook to fetch the data
  useQuery(GET_JOB_PRICE_CALCULATION_DETAIL_QUERY, {
    variables: { job_id: Number(job.id) },
    fetchPolicy: "network-only",
    skip: !job.id || !Boolean(job.id), // To ensure no falsy value interferes
    onCompleted: async (data) => {
      if (!isMounted.current) return;
      if (data.jobPriceCalculationDetail) {
        setIsUpdateMode(true); // Data exists, so it's an update
        setPricecalculationid(data.jobPriceCalculationDetail.id);
        setRefinedData({
          ...data.jobPriceCalculationDetail,
          tail_lift: data.jobPriceCalculationDetail?.tail_lift,
          cbm_auto: data.jobPriceCalculationDetail?.cbm_auto,
          customer_id: data.jobPriceCalculationDetail?.customer_id,
          dangerous_goods: data.jobPriceCalculationDetail?.dangerous_goods,
          freight: data.jobPriceCalculationDetail?.freight,
          fuel: data.jobPriceCalculationDetail?.fuel,
          time_slot: data.jobPriceCalculationDetail?.time_slot,
          tailgate: data.jobPriceCalculationDetail?.tailgate,
          hand_unload: data.jobPriceCalculationDetail?.hand_unload,
          stackable: data.jobPriceCalculationDetail?.stackable,
          total_price: data.jobPriceCalculationDetail?.total,
          total_weight: data.jobPriceCalculationDetail?.total_weight,
        });
        setQuoteCalculationRes((prev) => ({
          ...prev,
          total_price: data.jobPriceCalculationDetail?.total,
          total: data.jobPriceCalculationDetail?.total,
          tail_lift: data.jobPriceCalculationDetail?.tail_lift,
          total_weight:
            data.jobPriceCalculationDetail.total_weight !== undefined
              ? data.jobPriceCalculationDetail.total_weight
              : prev.total_weight,
          cbm_auto:
            data.jobPriceCalculationDetail.cbm_auto !== undefined
              ? data.jobPriceCalculationDetail.cbm_auto
              : prev.cbm_auto,
          customer_id: data.jobPriceCalculationDetail?.customer_id,
          dangerous_goods: data.jobPriceCalculationDetail?.dangerous_goods,
          freight: data.jobPriceCalculationDetail?.freight,
          fuel: data.jobPriceCalculationDetail?.fuel,
          hand_unload: data.jobPriceCalculationDetail?.hand_unload,
          stackable: data.jobPriceCalculationDetail.stackable,
          time_slot: data.jobPriceCalculationDetail?.time_slot,
          tailgate: data.jobPriceCalculationDetail?.tailgate,
        }));
        setButtonText("Update Quote");
      }
      //  setQuoteCalculationRes(defaultJobPriceCalculationDetail);
      const { totalCBM, totalWeight } = calculateFinalWeightCBM(job.job_category_id, jobItems, companyWeight);
      setQuoteCalculationRes((prev) => ({
        ...prev,
        total_weight: totalWeight,
        cbm_auto: totalCBM,
      }));
      getJob();
    },
    onError: (error) => {
      // Handle the error and set data to empty
      console.log("Error fetching job price calculation detail:", error);
      setIsUpdateMode(false); // No data found, so we need to create a new entry
      setRefinedData(defaultJobQuoteData);
      setQuoteCalculationRes(defaultJobPriceCalculationDetail);

      const { totalCBM, totalWeight } = calculateFinalWeightCBM(job.job_category_id, jobItems, companyWeight);
      setQuoteCalculationRes((prev) => ({
        ...prev,
        total_weight: totalWeight,
        cbm_auto: totalCBM,
      }));
      setButtonText("Get A Quote");
      if (error.message.includes("No record found")) {
        console.warn(
          "No quote calculation detail yet for this job — skipping.",
        );
      } else {
        console.error("Error fetching job price calculation detail:", error);
        showGraphQLErrorToast(error);
      }
    },
  });
  useQuery(GET_ITEM_TYPES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    fetchPolicy: "network-only",
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

  useQuery(GET_COMPANYS_QUERY, {
    variables: {
      query: debouncedSearch,
      page: 1,
      first: 10000,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      const newCompaniesOptions = data.companys.data.map((_entity: any) => ({
        value: parseInt(_entity.id),
        label: _entity.name,
      }));

      setCompaniesOptions(newCompaniesOptions);

      // If a company is already selected, update refinedData with its properties
      const selectedCompany = newCompaniesOptions.find(
        (entity: { value: number }) => entity.value === job.company_id,
      );

      if (selectedCompany) {
        setRefinedData({
          ...refinedData,
        });
      }
    },
  });

  const [getCompanyRates, { data: _companyRatesData }] = useLazyQuery(
    GET_COMPANY_RATE_QUERY,
    {
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        if (!isMounted.current) return;
        if (data?.getRatesByCompany) {
          const rates = [...data.getRatesByCompany];
          setCompanyRates(rates);
          setRefinedData((prevData) => ({
            ...prevData,
            company_rates: rates,
          }));
        }
      },
      onError: (error) => {
        console.error("Company rates error:", error);
        if (!error.message.includes("No record found")) {
          showGraphQLErrorToast(error);
        }
      },
    },
  );
  useEffect(() => {
    if (job?.company_id && job.company_id !== 0) {
      getCompanyRates({ variables: { company_id: Number(job.company_id) } });
    }
  }, [job.company_id, getCompanyRates]);
  useEffect(() => {
    if (!jobItems || jobItems.length === 0) return; // no calculation if no items

    const calculateTotals = () => {

      const { totalCBM, totalWeight } = calculateFinalWeightCBM(job.job_category_id, jobItems, companyWeight);

      setQuoteCalculationRes((prev) => ({
        ...prev,
        total_weight: totalWeight,
        cbm_auto: totalCBM,
      }));
    };

    calculateTotals();
  }, [companyWeight, job.job_category_id, jobItems]);


  function handleRemoveFromJobItems(index: number) {
    let _jobItems = [...jobItems];
    _jobItems.splice(index, 1);
    setJobItems(_jobItems);
  }
  const handleJobItemChanged = (
    value: any,
    index: number,
    fieldToUpdate?: string,
  ) => {
    let _jobItems = [...jobItems];
    if (!value.dimension_height_cm) {
      value.dimension_height_cm = (
        parseFloat(value.dimension_height) * 100
      ).toFixed(2);
    }
    if (!value.dimension_width_cm) {
      value.dimension_width_cm = (
        parseFloat(value.dimension_width) * 100
      ).toFixed(2);
    }
    if (!value.dimension_depth_cm) {
      value.dimension_depth_cm = (
        parseFloat(value.dimension_depth) * 100
      ).toFixed(2);
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
    setPrevJobState((prevState) => ({
      ...prevState,
      job_items: _jobItems,
    }));
  };
  const addToJobItems = () => {
    let nextId = 1; // Default to 1 if jobItems is empty
    if (jobItems.length > 0) {
      nextId = jobItems[jobItems.length - 1].id + 1;
    }
    setJobItems((jobItems) => [
      ...jobItems,
      { ...defaultJobItem, ...{ id: nextId, is_new: true } },
    ]);
  };

  useEffect(() => {
    dateChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobDateAt, readyAt, dropAt]);
  const dateChanged = () => {
    try {
      setJob({
        ...job,
        ready_at: formatDateTimeToDB(jobDateAt, readyAt),
        drop_at: formatDateTimeToDB(jobDateAt, dropAt),
      });
    } catch (e) {
      //// console.log(e);
    }
  };
  const addToJobDestinations = () => {
    let nextId = jobDestinations[jobDestinations.length - 1]
      ? jobDestinations[jobDestinations.length - 1].id + 1
      : 1;
    setJobDestinations((jobDestinations) => [
      ...jobDestinations,
      { ...defaultJobDestination, ...{ id: nextId, is_new: true } },
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
    //check if any job destination is_saved_address and populate setSavedAddresses
  };
  //handleDeleteJobItem
  const [handleDeleteJobItem, { }] = useMutation(DELETE_JOB_ITEM_MUTATION, {
    onCompleted: (_data) => {
      // console.log("Job Item Deleted", data);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  //handleDelete
  const [handleDeleteJobDestination, { }] = useMutation(
    DELETE_JOB_DESTINATION_MUTATION,
    {
      onCompleted: (_data) => {
        // console.log("Job destination Deleted", data);
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

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
  //handleCreateJobDestination
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
  //handleUpdateJobItems
  const [handleUpdateJobItem, { }] = useMutation(UPDATE_JOB_ITEM_MUTATION, {
    onCompleted: (_data) => {
      // console.log("Job item updated");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  //handleUpdateJobDestinations
  const [handleUpdateJobDestination, { }] = useMutation(
    UPDATE_JOB_DESTINATION_MUTATION,
    {
      onCompleted: (_data) => {
        // console.log("Job destination updated");
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  //deleteMedia
  const [handleDeleteMedia, { }] = useMutation(DELETE_MEDIA_MUTATION, {
    onCompleted: (_data) => {
      toast({
        title: "Attachment deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      getJob();
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const { refetch: getCustomersByCompanyId } = useQuery(GET_CUSTOMERS_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
      company_id: job.company_id, // Ensure this is provided if needed
    },
    skip: !job.company_id,
    onCompleted: (data) => {
      setCustomerOptions([]);
      setCustomerOptions(
        formatToSelect(data.customers.data, "id", "full_name"),
      );
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

  const handleJobCcEmailsChange = useCallback(
    (event: SyntheticEvent, jobCcEmailTags: string[]) => {
      setJobCcEmailTags(
        jobCcEmailTags.filter((email) => {
          return re.test(email);
        }),
      );
    },
    [re],
  );
  const [handleCreateJobCcEmail, { }] = useMutation(
    CREATE_JOB_CC_EMAIL_MUTATION,
    {
      variables: {
        input: {
          job_id: job.id,
          email: createdCcEmail,
        },
      },
      onCompleted: (_data) => {
        toast({
          title: "Additional email notification created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        getJob();
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  const handleJobCcEmailAdd = useCallback(
    (_event: SyntheticEvent, email: string) => {
      if (re.test(email)) {
        setCreatedCcEmail(email);
        setTimeout(() => {
          handleCreateJobCcEmail();
        }, 500);
      } else {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [handleCreateJobCcEmail, re, toast],
  );

  const handleJobCcEmailRemove = useCallback(
    (_event: SyntheticEvent, index: number) => {
      setDeleteJobCcEmailId(jobCcEmails[index]["id"]);
      setJobCcEmails(jobCcEmails.filter((_, i) => i !== index));
      setJobCcEmailTags(jobCcEmailTags.filter((_, i) => i !== index));

      setTimeout(() => {
        handleDeleteJobCcEmail();
      }, 500);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jobCcEmailTags, jobCcEmails],
  );

  const [handleDeleteJobCcEmail, { }] = useMutation(
    DELETE_JOB_CC_EMAIL_MUTATION,
    {
      variables: {
        id: deleteJobCcEmailId,
      },
      onCompleted: (_data) => { },
      onError: (error) => {
        showGraphQLErrorToast(error);
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
  }, [job.customer_id, customerOptions, getCustomerAddresses]);

  const handleCreateJobPriceCalculationDetail = (
    jobPriceDetail: CreateJobPriceCalculationDetailInput,
  ) => {
    return new Promise((resolve, reject) => {
      createJobPriceCalculationDetail({ variables: { input: jobPriceDetail } })
        .then(({ data }) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };

  const [createJobPriceCalculationDetail] = useMutation(
    CREATE_JOB_PRICE_CALCULATION_DETAIL_MUTATION,
  );

  const handleUpdateJobPriceCalculationDetail = (quoteCalculationRes: any) => {
    //console.log(quoteCalculationRes, "quoteCalculationRes");
    return new Promise((resolve, reject) => {
      updateJobPriceCalculationDetail({
        variables: {
          job_id: Number(job.id),
          input: {
            // job_id: Number(updatedData.job_id),
            customer_id: Number(job.customer_id),
            cbm_auto: Number(quoteCalculationRes.cbm_auto), // Ensure type casting
            total_weight: Number(quoteCalculationRes.total_weight),
            freight: Number(quoteCalculationRes.freight),
            fuel: Number(quoteCalculationRes.fuel),
            hand_unload: Number(quoteCalculationRes.hand_unload),
            dangerous_goods: Number(quoteCalculationRes.dangerous_goods),
            time_slot: Number(quoteCalculationRes.time_slot),
            tail_lift: Number(quoteCalculationRes.tail_lift),
            stackable: Number(quoteCalculationRes.stackable),
            total: Number(quoteCalculationRes.total),
          },
        },
      })
        .then(({ data }) => {
          //console.log("Mutation response:", data);
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };

  const [updateJobPriceCalculationDetail] = useMutation(
    UPDATE_JOB_PRICE_CALCULATION_DETAIL_MUTATION,
  );

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

  const sendFreightData = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_PRICE_QUOTE_API_URL;
    // console.log(string, "st");
    if (!validateAddresses()) return;
    // Remove duplicate check that was causing multiple API calls
    setButtonText("Get A Quote");
    const today = new Date().toISOString(); // Get current date and time in ISO format

    const jobDestination1 =
      jobDestinations.length > 0
        ? {
          state: jobDestinations[0]?.address_state,
          suburb: jobDestinations[0]?.address_city,
          postcode: jobDestinations[0]?.address_postal_code,
          address: jobDestinations[0]?.address,
        }
        : null;

    const selectedCategoryName = jobCategories.find(
      (job_category) => job_category.value == job?.job_category_id,
    )?.label;
    // const selectedstate = locationOptions.find(
    //   (item) => item.label == job.pick_up_state,
    // )?.label;

    const selectedstate = locationOptions.find(
      (location) =>
        location.label?.toLowerCase() == job?.pick_up_state?.toLowerCase(),
    );
    // console.log(selectedstate, "selectedstate");
    const selectedJobTypeName = jobTypeOptions.find(
      (job_type) => job_type.value == job.job_type_id,
    )?.label;

    const selectedDepot = depotOptions.find(
      (depot) => depot.value === job.timeslot_depots,
    )?.label;
    // debugger
    const filteredCompanyRates = companyRates?.filter(
      (rate) => rate.state === jobDestination1?.state,
    );
    // console.log(filteredCompanyRates, "filteredCompanyRates")

    const payload = {
      customer_id: Number(job.customer_id),
      freight_type: refinedData.freight_type || selectedCategoryName,
      transport_type: job.transport_type,
      service_choice: selectedJobTypeName || refinedData.service_choice,
      // cbm_rate: refinedData.cbm_rate,
      // minimum_charge: refinedData.minimum_charge,
      // area: refinedData.area,
      state: refinedData.state || selectedstate?.label,
      state_code: refinedData.state_code || selectedstate?.value,
      company_rates:
        (job.job_category_id == 1 && selectedstate?.value === "QLD") ||
          selectedstate?.value === "VIC"
          ? filteredCompanyRates.map((rate) => ({
            company_id: rate.company_id,
            seafreight_id: rate.seafreight_id,
            area: rate.area,
            cbm_rate: rate.cbm_rate,
            state: rate.state,
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
          ? job.timeslot_depots || selectedDepot
          : "", // Pass selectedDepot here
        tail_lift: job.is_tailgate_required || false,
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
      const calculationData = response?.data;
      setQuoteCalculationRes({
        ...quoteCalculationRes,
        cbm_auto: Number(calculationData?.cbm_auto ?? 0),
        total_weight: Number(calculationData?.total_weight ?? 0),
        freight: Number(calculationData?.freight ?? 0),
        fuel: Number(calculationData?.fuel ?? 0),
        hand_unload: Number(calculationData?.hand_unload ?? 0),
        dangerous_goods: Number(calculationData?.dangerous_goods ?? 0),
        time_slot: Number(calculationData?.time_slot ?? 0),
        tail_lift: Number(calculationData?.tail_lift ?? 0),
        stackable: Number(calculationData?.stackable ?? 0),
        total: Number(calculationData?.total ?? 0),
      });
      toast({ title: "Quote Calculation Success", status: "success" });
      if (isUpdateMode) {
        await handleUpdateJobPriceCalculationDetail(calculationData)
          .then((_data) => {
            // console.log("Updated successfully:", data);
            handleUpdateJob();
            toast({
              title: "Quote price updated",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          })
          .catch((error) => {
            console.error("Error updating job price:", error);
          });
      } else {
        //console.log("Update mode");
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
          job_id: Number(job.id),
          customer_id: Number(job.customer_id),
          cbm_auto: Number(calculationData.cbm_auto), // Ensure type casting
          total_weight: Number(calculationData.total_weight),
          freight: Number(calculationData.freight),
          fuel: Number(calculationData.fuel),
          hand_unload: Number(calculationData.hand_unload),
          dangerous_goods: Number(calculationData.dangerous_goods),
          time_slot: Number(calculationData.time_slot),
          tail_lift: Number(calculationData.tail_lift),
          stackable: Number(calculationData.stackable),
          total: Number(calculationData.total),
        })
          .then((data) => {
            console.log("created successfully:", data);
            handleUpdateJob();
            toast({
              title: "Quote price created",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          })
          .catch((error) => {
            console.error("Error creating job price:", error);
          });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Add this validation function near the other validation helpers
  const validateTimeslotDepot = () => {
    // Only required for LCL (job_category_id == 1) and Inbound Connect is Yes
    if (
      job.is_inbound_connect &&
      job.job_category_id == 1 &&
      (!job.timeslot_depots ||
        job.timeslot_depots == null ||
        job.timeslot_depots === "")
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

  // Update handleSaveJobPriceCalculation to use the validation
  const handleSaveJobPriceCalculation = () => {
    if (!validateTimeslotDepot()) return;
    const hasChanged =
      prevJobState.freight_type !== refinedData.freight_type ||
      prevJobState.transport_type !== job.transport_type ||
      prevJobState.transport_location !== job.transport_location ||
      prevJobState.job_items.some(
        (item, index) =>
          item.id !== jobItems[index].id ||
          item.name !== jobItems[index].name ||
          item.notes !== jobItems[index].notes ||
          item.quantity !== jobItems[index].quantity ||
          item.volume !== jobItems[index].volume ||
          item.weight !== jobItems[index].weight ||
          item.dimension_height !== jobItems[index].dimension_height ||
          item.dimension_width !== jobItems[index].dimension_width ||
          item.dimension_depth !== jobItems[index].dimension_depth,
      );
    if (isUpdateMode) {
      if (hasChanged) {
        setButtonText("Quote");
        sendFreightData();
      } else {
        // setIsSaving(true);
        // handleUpdateJob();
        toast({
          title: "No changes detected",
          description: "No changes detected, no need to update.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } else {
      // console.log("add");
      setButtonText("Quote");
      sendFreightData();
    }
  };

  // Update handleUpdateJob to use the validation
  const handleUpdateJobWithValidation = () => {
    if (!validateTimeslotDepot()) {
      setIsSaving(false);
      return;
    }
    handleUpdateJob();
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
          {!jobLoading && (
            <Grid pl="6" backgroundColor="white">
              <FormControl>
                <Flex justify="space-between" align="center" className="my-8">
                  <h1 className="">Delivery #{job.id}</h1>

                  <Flex alignItems="center">
                    {job.quote?.id && (
                      <Button
                        hidden={!isAdmin}
                        variant="primary"
                        isDisabled={isSaving}
                        onClick={() => {
                          router.push("/admin/quotes/" + job.quote?.id);
                        }}
                        mr="2"
                      >
                        View Quote
                      </Button>
                    )}

                    <Button
                      hidden={!isAdmin}
                      variant="primary"
                      isDisabled={isSaving}
                      onClick={() => {
                        setIsSaving(true);
                        handleUpdateJobWithValidation();
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
                  <JobDetailsTab
                    isAdmin={isAdmin}
                    job={job}
                    setJob={setJob}
                    jobStatuses={jobStatuses}
                    jobCategories={jobCategories}
                    depotOptions={depotOptions}
                    _setDepotOptions={setDepotOptions}
                    drivers={drivers}
                    companiesOptions={companiesOptions}
                    customerOptions={customerOptions}
                    customerSelected={customerSelected}
                    jobCcEmailTags={jobCcEmailTags}
                    handleJobCcEmailsChange={handleJobCcEmailsChange}
                    handleJobCcEmailAdd={handleJobCcEmailAdd}
                    handleJobCcEmailRemove={handleJobCcEmailRemove}
                    jobDateAt={jobDateAt}
                    setJobDateAt={setJobDateAt}
                    readyAt={readyAt}
                    setReadyAt={setReadyAt}
                    dropAt={dropAt}
                    setDropAt={setDropAt}
                    jobTypeOptions={jobTypeOptions}
                    refinedData={refinedData}
                    setRefinedData={setRefinedData}
                    today={today}
                    setIsSameDayJob={setIsSameDayJob}
                    setIsTomorrowJob={setIsTomorrowJob}
                    savedAddressesSelect={savedAddressesSelect}
                    pickUpDestination={pickUpDestination}
                    setPickUpDestination={setPickUpDestination}
                    getCustomerAddresses={getCustomerAddresses}
                    jobDestinations={jobDestinations}
                    handleJobDestinationChanged={handleJobDestinationChanged}
                    addToJobDestinations={addToJobDestinations}
                    handleRemoveFromJobDestinations={
                      handleRemoveFromJobDestinations
                    }
                    isCompany={isCompany}
                    quoteCalculationRes={quoteCalculationRes}
                    buttonText={buttonText}
                    handleSaveJobPriceCalculation={
                      handleSaveJobPriceCalculation
                    }
                    filtereddepotOptions={filtereddepotOptions}
                    setFilteredDepotOptions={setFilteredDepotOptions}
                    setSelectedDepot={setSelectedDepot}
                    sendFreightData={sendFreightData}
                    jobItems={jobItems}
                    addToJobItems={addToJobItems}
                    handleRemoveFromJobItems={handleRemoveFromJobItems}
                    handleJobItemChanged={handleJobItemChanged}
                    itemsTableColumns={itemsTableColumns}
                    itemTypes={itemTypes}
                    getJob={getJob}
                    handleDeleteMedia={handleDeleteMedia}
                    jobLoading={jobLoading}
                    attachmentColumns={attachmentColumns}
                    handleDeleteJob={handleDeleteJob}
                    onChangeCustomerSearchQuery={onChangeCustomerSearchQuery}
                    onChangeSearchQuery={onChangeSearchQuery}
                    textColorSecodary={textColorSecodary}
                    _updatingMedia={updatingMedia}
                    setUpdatingMedia={setUpdatingMedia}
                  />
                )}

                {/* Job Details */}
                {tabId == 2 && <ReportsTab jobObject={job} />}
                {/* Message Log */}
                {tabId == 3 && <MessageLogTab jobObject={job} />}
                {/* Message Invoice */}
                {tabId == 4 && <InvoiceTab jobObject={job} />}
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default JobEdit;
