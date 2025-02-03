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
  SimpleGrid,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { faTrashCan } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AreYouSureAlert from "components/alert/AreYouSureAlert";
import ColorSelect from "components/fields/ColorSelect";
import CustomInputField from "components/fields/CustomInputField";
import FileInput from "components/fileInput/FileInput";
import InvoiceTab from "components/jobs/InvoiceTab";
import JobAddressesSection from "components/jobs/JobAddressesSection";
import JobInputTable from "components/jobs/JobInputTable";
import MessageLogTab from "components/jobs/MessageLogTab";
import ReportsTab from "components/jobs/ReportsTab";
import PaginationTable from "components/table/PaginationTable";
import { TabsComponent } from "components/tabs/TabsComponet";
import TagsInput from "components/tagsInput";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { GET_COMPANYS_QUERY } from "graphql/company";
import { defaultCustomer, GET_CUSTOMERS_QUERY } from "graphql/customer";
import { GET_CUSTOMER_ADDRESSES_QUERY } from "graphql/customerAddress";
import { GET_DRIVERS_QUERY } from "graphql/driver";
import { GET_ITEM_TYPES_QUERY } from "graphql/itemType";
import {
  defaultJob,
  DELETE_JOB_MUTATION,
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
import { GET_JOB_STATUSES_QUERY } from "graphql/jobStatus";
import { GET_JOB_TYPES_QUERY } from "graphql/jobType";
import { DELETE_MEDIA_MUTATION } from "graphql/media";
import {
  formatDate,
  formatDateTimeToDB,
  formatTime,
  formatTimeUTCtoInput,
  getTimezone,
  isAfterCutoff,
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
  useState,
} from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

function JobEdit() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecodary = useColorModeValue("#888888", "#888888");
  const [job, setJob] = useState(defaultJob);
  const router = useRouter();
  const { id } = router.query;
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
  let re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const [deleteJobCcEmailId, setDeleteJobCcEmailId] = useState(null);
  const [createdCcEmail, setCreatedCcEmail] = useState(null);
  const [jobCcEmails, setJobCcEmails] = useState([]);
  const [jobCcEmailTags, setJobCcEmailTags] = useState([]);
  const isAdmin = useSelector((state: RootState) => state.user.isAdmin);
  const customerId = useSelector((state: RootState) => state.user.customerId);
  const companyId = useSelector((state: RootState) => state.user.companyId);
  const isCompany = useSelector((state: RootState) => state.user.isCompany);
  const isCustomer = useSelector((state: RootState) => state.user.isCustomer);
  const [pickUpDestination, setPickUpDestination] = useState(
    defaultJobDestination,
  );
  const [isSameDayJob, setIsSameDayJob] = useState(false);
  const [isTomorrowJob, setIsTomorrowJob] = useState(false);
  const [filteredJobTypeOptions, setFilteredJobTypeOptions] = useState([]);

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

  const NEW_CUTOFF_RULES_START_DATE = "2024-10-24";

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
    [],
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
    data: jobData,
    refetch: getJob,
  } = useQuery(GET_JOB_QUERY, {
    variables: {
      id: id,
    },
    skip: !id,
    onCompleted: (data) => {
      if (data?.job == null) {
        router.push("/admin/jobs");
      }

      if (!updatingMedia) {
        setJob({ ...job, ...data?.job, media: data?.job.media });
        getCustomersByCompanyId({
          query: "",
          page: 1,
          first: 100,
          orderByColumn: "id",
          orderByOrder: "ASC",
          company_id: data.job.company_id,
        });

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
        // jobDestinations without is_pickup
        let _jobDestinations = data.job.job_destinations.filter(
          (destination: any) => !destination.is_pickup,
        );
        setOriginalJobDestinations([]);
        setOriginalJobDestinations(_jobDestinations);

        setJobDestinations([]);
        setPickUpDestination(
          data.job.pick_up_destination
            ? data.job.pick_up_destination
            : { ...defaultJobDestination, id: 0, is_new: true },
        );
        setJobDestinations(_jobDestinations);
        setOriginalJobItems([]);
        setOriginalJobItems(data.job.job_items);
        setJobItems([]);
        setJobItems(data.job.job_items);
        setJobCcEmails([]);
        setJobCcEmails(data.job.job_cc_emails);
        setJobCcEmailTags(
          data.job.job_cc_emails.map(
            (job_cc_email: { id: number; email: string }) => job_cc_email.email,
          ),
        );
      } else {
        setJob({ ...job, media: data?.job.media });
        setJobCcEmails(data.job.job_cc_emails);
        setUpdatingMedia(false);
      }
    },
    onError(error) {
      console.log("onError");
      console.log(error);
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

  const [handleUpdateJob, {}] = useMutation(UPDATE_JOB_MUTATION, {
    variables: {
      input: {
        ...job,
        job_destinations: undefined,
        job_items: undefined,
        media: undefined,
        chats: undefined,
        customer_invoice: undefined,
        pick_up_destination: undefined,
        total_volume: undefined,
        driver: undefined,
        job_status: undefined,
        job_category: undefined,
        job_type: undefined,
        customer: undefined,
        company: undefined,
        total_weight: undefined,
        total_quantity: undefined,
        invoice_url: undefined,
        pod_url: undefined,
        job_cc_emails: undefined,
        quote: undefined,
        created_at: undefined,
      },
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
          const resultPickup = await handleCreateJobDestination({
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

  const [handleDeleteJob, {}] = useMutation(DELETE_JOB_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
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
    onCompleted: (data) => {
      setJobCategories([]);
      data.jobCategorys.data.map((driverStatus: any) => {
        setJobCategories((jobCategories) => [
          ...jobCategories,
          {
            value: parseInt(driverStatus.id),
            label: driverStatus.name,
          },
        ]);
      });
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
    onCompleted: (data) => {
      setJobStatuses([]);
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

  useQuery(GET_JOB_TYPES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setJobTypeOptions([]);
      data.jobTypes.data.map((_entity: any) => {
        setJobTypeOptions((jobTypes) => [
          ...jobTypes,
          {
            value: parseInt(_entity.id),
            label: _entity.name,
          },
        ]);
      });
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
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setCompaniesOptions([]);
      data.companys.data.map((_entity: any) => {
        setCompaniesOptions((companys) => [
          ...companys,
          {
            value: parseInt(_entity.id),
            label: _entity.name,
          },
        ]);
      });
    },
  });

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
  };
  const addToJobItems = () => {
    let nextId = jobItems[jobItems.length - 1].id + 1;
    setJobItems((jobItems) => [
      ...jobItems,
      { ...defaultJobItem, ...{ id: nextId, is_new: true } },
    ]);
  };
  useEffect(() => {
    dateChanged();
  }, [jobDateAt, readyAt, dropAt]);
  const dateChanged = () => {
    try {
      setJob({
        ...job,
        ready_at: formatDateTimeToDB(jobDateAt, readyAt),
        drop_at: formatDateTimeToDB(jobDateAt, dropAt),
      });
    } catch (e) {
      //console.log(e);
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
  const [handleDeleteJobItem, {}] = useMutation(DELETE_JOB_ITEM_MUTATION, {
    onCompleted: (data) => {
      console.log("Job Item Deleted", data);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  //handleDelete
  const [handleDeleteJobDestination, {}] = useMutation(
    DELETE_JOB_DESTINATION_MUTATION,
    {
      onCompleted: (data) => {
        console.log("Job destination Deleted", data);
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
  const [handleUpdateJobItem, {}] = useMutation(UPDATE_JOB_ITEM_MUTATION, {
    onCompleted: (data) => {
      console.log("Job item updated");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  //handleUpdateJobDestinations
  const [handleUpdateJobDestination, {}] = useMutation(
    UPDATE_JOB_DESTINATION_MUTATION,
    {
      onCompleted: (data) => {
        console.log("Job destination updated");
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  //deleteMedia
  const [handleDeleteMedia, {}] = useMutation(DELETE_MEDIA_MUTATION, {
    onCompleted: (data) => {
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
    [],
  );
  const handleJobCcEmailAdd = useCallback(
    (event: SyntheticEvent, email: string) => {
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
    [],
  );

  const handleJobCcEmailRemove = useCallback(
    (event: SyntheticEvent, index: number) => {
      setDeleteJobCcEmailId(jobCcEmails[index]["id"]);
      setJobCcEmails(jobCcEmails.filter((_, i) => i !== index));
      setJobCcEmailTags(jobCcEmailTags.filter((_, i) => i !== index));

      setTimeout(() => {
        handleDeleteJobCcEmail();
      }, 500);
    },
    [jobCcEmailTags, jobCcEmails],
  );

  const [handleDeleteJobCcEmail, {}] = useMutation(
    DELETE_JOB_CC_EMAIL_MUTATION,
    {
      variables: {
        id: deleteJobCcEmailId,
      },
      onCompleted: (data) => {},
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const [handleCreateJobCcEmail, {}] = useMutation(
    CREATE_JOB_CC_EMAIL_MUTATION,
    {
      variables: {
        input: {
          job_id: job.id,
          email: createdCcEmail,
        },
      },
      onCompleted: (data) => {
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
  }, [job.customer_id, customerOptions]);

  useEffect(() => {
    // Function to calculate filtered job types based on cutoff logic
    if (
      new Date(job.created_at).setHours(0, 0, 0, 0) <
      new Date(NEW_CUTOFF_RULES_START_DATE).setHours(0, 0, 0, 0)
    ) {
      return;
    }

    const calculateFilteredOptions = async () => {
      let filteredOptions = Array.isArray(jobTypeOptions)
        ? [...jobTypeOptions]
        : [];

      if (
        !job.job_category_id ||
        pickUpDestination.lat === 0 ||
        pickUpDestination.lng === 0
      ) {
        return setFilteredJobTypeOptions(filteredOptions);
      }

      try {
        const timezone = await getTimezone(
          pickUpDestination.lat,
          pickUpDestination.lng,
        );
        if (job.job_category_id == 1) {
          // LCL Bookings
          if (isSameDayJob) {
            filteredOptions = filteredOptions.filter(
              (opt) => opt.label !== "Standard",
            );
            resetJobTypeAndShowToast();
          } else if (isTomorrowJob) {
            const isAfterLclCutoff = isAfterCutoff("16:00", timezone);

            if (isAfterLclCutoff) {
              filteredOptions = filteredOptions.filter(
                (opt) => opt.label !== "Standard",
              );
              resetJobTypeAndShowToast();
            }
          }
        } else if (job.job_category_id == 2) {
          // Airfreight Bookings
          if (isSameDayJob) {
            const isAfterAirfreightCutoff = isAfterCutoff("11:00", timezone);

            if (isAfterAirfreightCutoff) {
              filteredOptions = filteredOptions.filter(
                (opt) => opt.label !== "Standard",
              );
              resetJobTypeAndShowToast();
            }
          }
        }

        setFilteredJobTypeOptions(filteredOptions);
      } catch (error) {
        console.error(
          "Error fetching timezone or applying cutoff logic",
          error,
        );
      }
    };

    calculateFilteredOptions();
  }, [
    job.job_category_id,

    jobDateAt,
    pickUpDestination,
    jobTypeOptions,
    isSameDayJob,
    isTomorrowJob,
  ]);

  // Define the reusable function
  const resetJobTypeAndShowToast = () => {
    if (job.job_type_id == 1) {
      setJob({
        ...job,
        ready_at: formatDateTimeToDB(jobDateAt, readyAt),
        drop_at: formatDateTimeToDB(jobDateAt, dropAt),
        job_type_id: null,
      });
      toast({
        title: "Job Type Required",
        description:
          "Standard service is no longer available for this time. Please select Express or Urgent.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
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
                        handleUpdateJob();
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
                  <Box mt={10}>
                    {/* Basic fields */}
                    {isAdmin ? (
                      <Box mb="16px">
                        <CustomInputField
                          isSelect={true}
                          optionsArray={jobStatuses}
                          label="Job Status:"
                          value={jobStatuses.find(
                            (job_status) =>
                              job_status?.value == job.job_status_id,
                          )}
                          placeholder=""
                          onChange={(e) => {
                            setJob({
                              ...job,
                              job_status_id: e.value || null,
                            });
                          }}
                        />
                        <CustomInputField
                          isSelect={true}
                          optionsArray={drivers}
                          label="Assigned to:"
                          onInputChange={(e) => {
                            onChangeCustomerSearchQuery(e);
                          }}
                          value={drivers.find(
                            (driver) => driver.value == job.driver_id,
                          )}
                          placeholder=""
                          onChange={(e) => {
                            setJob({
                              ...job,
                              driver_id: e.value || null,
                            });
                          }}
                        />
                        <CustomInputField
                          isSelect={true}
                          optionsArray={jobCategories}
                          label="Job category:"
                          value={jobCategories.find(
                            (job_category) =>
                              job_category.value == job.job_category_id,
                          )}
                          placeholder=""
                          onChange={(e) => {
                            const selectedCategory = e.value;
                            setJob({
                              ...job,
                              job_category_id: selectedCategory || null,
                            });
                          }}
                        />
                        {!isCompany && (
                          <CustomInputField
                            isSelect={true}
                            optionsArray={companiesOptions}
                            label="Company:"
                            onInputChange={(e) => {
                              onChangeSearchQuery(e);
                            }}
                            value={companiesOptions.find(
                              (entity) => entity.value == job.company_id,
                            )}
                            placeholder=""
                            onChange={(e) => {
                              setJob({
                                ...job,
                                company_id: e.value || null,
                                customer_id: null,
                              });
                              getCustomersByCompanyId({
                                query: "",
                                page: 1,
                                first: 100,
                                orderByColumn: "id",
                                orderByOrder: "ASC",
                                company_id: e.value,
                              });
                            }}
                          />
                        )}

                        <CustomInputField
                          isSelect={true}
                          optionsArray={customerOptions}
                          label="Customer:"
                          value={
                            customerOptions.find(
                              (entity) => entity.value == job.customer_id,
                            ) || { value: null, label: "" }
                          }
                          placeholder=""
                          onChange={(e) => {
                            setJob({
                              ...job,
                              customer_id: e.value || null,
                            });
                          }}
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
                              <GridItem>
                                Additional email notification to:{" "}
                              </GridItem>
                            </SimpleGrid>
                          </FormLabel>
                          <Box>
                            <TagsInput
                              tags={jobCcEmailTags}
                              onTagsChange={handleJobCcEmailsChange}
                              onTagAdd={handleJobCcEmailAdd}
                              onTagRemove={handleJobCcEmailRemove}
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
                          label="Operator phone:"
                          placeholder=""
                          isDisabled={true}
                          name="operator_phone"
                          value={customerSelected.phone_no}
                          onChange={
                            (e) => {}
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
                            (e) => {}
                            //setJob({
                            //  ...job,
                            //  [e.target.name]: e.target.value,
                            //})
                          }
                        />
                        <CustomInputField
                          label="Date:"
                          type={"date"}
                          placeholder=""
                          name="job_date_at"
                          value={jobDateAt}
                          onChange={(e) => {
                            setJobDateAt(e.target.value);
                            setIsSameDayJob(today === e.target.value);
                            setIsTomorrowJob(
                              new Date(e.target.value).toDateString() ===
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
                            const value =
                              e.target.value == "" ? null : e.target.value;
                            setJob({
                              ...job,
                              [e.target.name]: value,
                            });
                          }}
                        />

                        <ColorSelect
                          label="Type:"
                          optionsArray={filteredJobTypeOptions}
                          selectedJobId={job.job_type_id}
                          value={
                            job.job_type_id
                              ? filteredJobTypeOptions.find(
                                  (jobType) => jobType.value == job.job_type_id,
                                )
                              : null
                          }
                          placeholder="Select type"
                          onChange={(e) => {
                            setJob({
                              ...job,
                              job_type_id: e.value || null,
                            });
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

                        <CustomInputField
                          isInput
                          label="Quoted Price (Buy Price)"
                          placeholder=""
                          name="quoted_price"
                          value={job.quoted_price}
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
                      </Box>
                    ) : (
                      <Box mb="16px">
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Status:
                          </Text>
                          <Text fontSize="sm">{job.job_status?.name}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Job category:
                          </Text>
                          <Text fontSize="sm">{job.job_category?.name}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Booked by:
                          </Text>

                          <SimpleGrid columns={{ sm: 1 }}>
                            <GridItem>
                              <Text fontSize="sm">
                                {job.customer?.full_name}
                              </Text>
                            </GridItem>
                            <GridItem>
                              <Text fontSize="xs" color={textColorSecodary}>
                                {job.company?.name}
                              </Text>
                            </GridItem>
                          </SimpleGrid>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Operator phone:
                          </Text>
                          <Text fontSize="sm">{job.customer?.phone_no}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Operator email:
                          </Text>
                          <Text fontSize="sm">{job.customer?.email}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Notification Emails:
                          </Text>
                          {job.job_cc_emails?.map((email: any) => (
                            <Text fontSize="sm" key={email?.email}>
                              {email?.email}
                              {", "}
                            </Text>
                          ))}
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Date:
                          </Text>
                          <Text fontSize="sm">
                            {formatDate(jobDateAt, "DD MMM YYYY")}
                          </Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Ready by:
                          </Text>
                          <Text fontSize="sm">{formatTime(job.ready_at)}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Drop by:
                          </Text>
                          <Text fontSize="sm">{formatTime(job.drop_at)}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Reference:
                          </Text>
                          <Text fontSize="sm">{job.reference_no}</Text>
                        </Flex>
                      </Box>
                    )}

                    <Divider className="my-12" />

                    {/* Addresses */}
                    <Box>
                      <h2 className="mb-4">Addresses</h2>

                      {/* Pickup address */}
                      <Box mb="16px">
                        <h3 className="mb-5 mt-3">Pickup Information</h3>
                        <Grid templateColumns="repeat(10, 1fr)" gap={0}>
                          <GridItem colSpan={2}>
                            <h4 className="mt-3">Pickup depot</h4>
                          </GridItem>
                          {isAdmin ? (
                            <JobAddressesSection
                              isAdmin={isAdmin}
                              entityModel={job}
                              savedAddressesSelect={savedAddressesSelect}
                              defaultJobDestination={pickUpDestination}
                              onAddressSaved={(hasChanged) => {
                                getCustomerAddresses();
                              }}
                              jobDestinationChanged={(jobDestination) => {
                                setPickUpDestination({
                                  ...pickUpDestination,
                                  ...jobDestination,
                                  ...{ is_pickup: true },
                                });
                                setJob({
                                  ...job,
                                  ...{
                                    pick_up_lng: jobDestination.lng,
                                    pick_up_lat: jobDestination.lat,
                                    pick_up_address: jobDestination.address,
                                    pick_up_notes: jobDestination.notes,
                                    pick_up_name: jobDestination.name,
                                    pick_up_report: jobDestination.report,
                                  },
                                });
                              }}
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

                      <Divider className="my-6" />

                      {/* Delivery Information */}
                      <Box mb="16px">
                        <h3 className="mb-5 mt-3">Delivery Information</h3>
                        {/* foreach jobDestinations */}
                        {jobDestinations.map((jobDestination, index) => {
                          return (
                            <Box key={jobDestination.id}>
                              <Grid templateColumns="repeat(10, 1fr)" gap={4}>
                                <GridItem colSpan={2}>
                                  <h4 className="mt-3">
                                    Delivery Address {index + 1}
                                  </h4>
                                </GridItem>
                                {isAdmin ? (
                                  <JobAddressesSection
                                    isAdmin={isAdmin}
                                    entityModel={job}
                                    savedAddressesSelect={savedAddressesSelect}
                                    defaultJobDestination={jobDestination}
                                    jobDestinationChanged={(jobDestination) => {
                                      handleJobDestinationChanged(
                                        jobDestination,
                                        index,
                                      );
                                    }}
                                    onAddressSaved={(hasChanged) => {
                                      getCustomerAddresses();
                                    }}
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
                                        {jobDestination.address}
                                      </p>
                                    </Flex>
                                  </GridItem>
                                )}

                                <GridItem>
                                  <Flex>
                                    {/* if index == 0 */}
                                    {jobDestinations.length > 1 && isAdmin && (
                                      <Button
                                        bg="white"
                                        className="!text-[var(--chakra-colors-black-400)] mt-[3px] !py-3 !px-1 !h-[unset]"
                                        onClick={() => {
                                          handleRemoveFromJobDestinations(
                                            index,
                                          );
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
                              <Divider className="my-6" />
                            </Box>
                          );
                        })}
                      </Box>

                      {isAdmin && (
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
                          <Divider className="my-12" />
                        </Box>
                      )}
                    </Box>

                    {/* Items */}
                    <Box mb="16px" mt={4}>
                      <Flex justify="space-between" align="center" mb="37px">
                        <h3 className="">Items</h3>
                        <Button
                          hidden={!isAdmin}
                          variant="secondary"
                          onClick={() => {
                            addToJobItems();
                          }}
                        >
                          + Add item
                        </Button>
                      </Flex>
                      {isAdmin ? (
                        <Box>
                          <JobInputTable
                            columns={itemsTableColumns}
                            data={jobItems}
                            optionsSelect={itemTypes}
                            onRemoveClick={(index) => {
                              handleRemoveFromJobItems(index);
                            }}
                            onValueChanged={handleJobItemChanged}
                          />

                          <Divider className="my-12" />
                        </Box>
                      ) : (
                        <Table>
                          <Thead>
                            <Tr>
                              <Th>TYPE</Th>
                              <Th>DIMENSIONS (L,W,H)</Th>
                              <Th>QTY</Th>
                              <Th>WEIGHT</Th>
                              <Th>CBM</Th>
                            </Tr>
                          </Thead>
                          <Tbody
                            className="bg-white divide-y divide-gray-200"
                            style={{ height: "200px" }}
                          >
                            {jobItems.map((jobItem) => {
                              return (
                                <Tr key={jobItem.id}>
                                  <Td> {jobItem.item_type?.name}</Td>
                                  <Td>
                                    {(jobItem.dimension_height * 100).toFixed(
                                      2,
                                    )}
                                    cm x{" "}
                                    {(jobItem.dimension_width * 100).toFixed(2)}
                                    cm x{" "}
                                    {(jobItem.dimension_depth * 100).toFixed(2)}
                                    cm
                                  </Td>
                                  <Td> {jobItem.quantity}</Td>
                                  <Td> {jobItem.weight}kg</Td>
                                  <Td>{jobItem.volume.toFixed(2)}cbm</Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      )}
                    </Box>

                    {/* Attachments */}
                    <Box>
                      <h3 className="mb-6">Attachments</h3>
                      {isAdmin && (
                        <Flex width="100%" className="mb-6">
                          <FileInput
                            entity="Job"
                            entityId={job.id}
                            onUpload={() => {
                              getJob();
                              setUpdatingMedia(true);
                            }}
                            description="Browse or drop your files here to upload"
                            height="80px"
                            bg="primary.100"
                          ></FileInput>
                        </Flex>
                      )}

                      {/* foreach jobAttachments */}
                      {!jobLoading && job?.media.length >= 0 && (
                        <PaginationTable
                          columns={attachmentColumns}
                          data={job.media}
                          showDelete={isAdmin}
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

                    <Divider className="my-12" />

                    {/* Additional Info */}
                    <Box mb="16px">
                      <h3 className="mb-5">Additional Info</h3>
                      {isAdmin ? (
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
                        </Box>
                      ) : (
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
                            {job.customer_notes}
                          </Text>
                        </Flex>
                      )}
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
                                isDisabled={!isAdmin}
                                value={job.is_inbound_connect ? "1" : "0"}
                                onChange={(e) => {
                                  setJob({
                                    ...job,
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
                                isDisabled={!isAdmin}
                                value={job.is_hand_unloading ? "1" : "0"}
                                onChange={(e) => {
                                  setJob({
                                    ...job,
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
                                isDisabled={!isAdmin}
                                value={job.is_dangerous_goods ? "1" : "0"}
                                onChange={(e) => {
                                  setJob({
                                    ...job,
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
                                isDisabled={!isAdmin}
                                value={job.is_tailgate_required ? "1" : "0"}
                                onChange={(e) => {
                                  setJob({
                                    ...job,
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
                      </Box>
                    </Box>
                    {isAdmin && (
                      <Box>
                        <Divider className="mt-12 mb-6" />

                        <Flex alignItems="center" className="mb-8">
                          <AreYouSureAlert
                            onDelete={handleDeleteJob}
                          ></AreYouSureAlert>
                        </Flex>
                      </Box>
                    )}
                  </Box>
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
