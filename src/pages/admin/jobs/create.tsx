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
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { faTrashCan } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ColorSelect from "components/fields/ColorSelect";
import CustomInputField from "components/fields/CustomInputField";
import FileInput from "components/fileInput/FileInput";
import JobAddressesSection from "components/jobs/JobAddressesSection";
import JobInputTable from "components/jobs/JobInputTable";
import PaginationTable from "components/table/PaginationTable";
import TagsInput from "components/tagsInput";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { GET_COMPANYS_QUERY } from "graphql/company";
import { defaultCustomer, GET_CUSTOMERS_QUERY } from "graphql/customer";
import { GET_CUSTOMER_ADDRESSES_QUERY } from "graphql/customerAddress";
import { GET_ITEM_TYPES_QUERY } from "graphql/itemType";
import {
  CREATE_JOB_MUTATION,
  defaultJob,
  SEND_CONSIGNMENT_DOCKET,
} from "graphql/job";
import { GET_JOB_CATEGORIES_QUERY } from "graphql/jobCategories";
import { CREATE_JOB_CC_EMAIL_MUTATION } from "graphql/jobCcEmails";
import {
  CREATE_JOB_DESTINATION_MUTATION,
  defaultJobDestination,
} from "graphql/jobDestination";
import { CREATE_JOB_ITEM_MUTATION, defaultJobItem } from "graphql/jobItem";
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

  const { isAdmin, customerId, companyId, isCompany, isCustomer } = useSelector(
    (state: RootState) => state.user,
  );

  const textColor = useColorModeValue("navy.700", "white");
  const [job, setJob] = useState(defaultJob);
  const [itemTypes, setItemTypes] = useState([]);
  const [customerSelected, setCustomerSelected] = useState(defaultCustomer);
  const [jobDestinations, setJobDestinations] = useState([
    { ...defaultJobDestination, ...{ id: 2, address_line_1: "" } },
  ]);
  const [pickUpDestination, setPickUpDestination] = useState({
    ...defaultJobDestination,
    ...{ id: 1, address_line_1: "" },
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Temporary saved addresses
  const [isSaving, setIsSaving] = useState(false);
  const [jobItems, setJobItems] = useState([defaultJobItem]);
  const [savedAddressesSelect, setSavedAddressesSelect] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [jobTypeOptions, setJobTypeOptions] = useState([]);
  const [companiesOptions, setCompaniesOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [temporaryMedia, setTemporaryMedia] = useState([]);
  const [jobDateAt, setJobDateAt] = useState(today);
  const [readyAt, setReadyAt] = useState("06:00");
  const [dropAt, setDropAt] = useState("17:00");
  const [jobCcEmails, setJobCcEmails] = useState([]);
  const [jobCcEmailTags, setJobCcEmailTags] = useState([]);
  const [isSameDayJob, setIsSameDayJob] = useState(true);
  const [isTomorrowJob, setIsTomorrowJob] = useState(false);
  const [filteredJobTypeOptions, setFilteredJobTypeOptions] = useState([]);

  let re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

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
  const defaultSelect = [
    { value: 1, label: "option 1" },
    { value: 2, label: "option 2" },
  ];
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

  useEffect(() => {
    if (companyId) {
      setJob((job) => ({ ...job, ...{ company_id: companyId } }));
      getCustomersByCompanyId({ ...defaultVariables, company_id: companyId });
    }
  }, [companyId]);

  const [handleCreateJob, { loading }] = useMutation(CREATE_JOB_MUTATION, {
    variables: {
      input: {
        ...job,
        id: undefined,
        job_status_id: 1,
        media: undefined,
      },
    },
    onCompleted: async (data) => {
      // save job cc emails
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

      // save job items
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
      // save job destinations
      const resultPickup = await handleCreateJobDestination({
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
        // small delay to prevent the error of the jobDestination not being created.
        const result = await handleCreateJobDestination({
          input: {
            ...jobDestination,
            is_pickup: false,
            customer_id: undefined,
            id: undefined,
            jobDestination: undefined,
          },
        });
        // handle success case for this media object
      }

      await handleSendConsignmentDocket({
        variables: {
          id: parseInt(data.createJob.id),
        },
      });

      toast({
        title: "Job created",
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
                  entity: "Job",
                  entity_id: data.createJob.id,
                },
                media: media.file,
              },
            });
          }, 500);
        };
        reader.readAsArrayBuffer(media.file);
      });

      router.push(`/admin/jobs/${data.createJob.id}`);
      setIsSaving(false);
    },
    onError: (error) => {
      setIsSaving(false);
      showGraphQLErrorToast(error);
    },
  });

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

  const [handleSendConsignmentDocket] = useMutation(SEND_CONSIGNMENT_DOCKET);

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
  };
  useQuery(GET_JOB_CATEGORIES_QUERY, {
    variables: defaultVariables,
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
  };
  const addToJobItems = () => {
    let nextId = jobItems[jobItems.length - 1].id + 1;
    setJobItems((jobItems) => [
      ...jobItems,
      { ...defaultJobItem, ...{ id: nextId } },
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
  // Change className of select based on job.job_type_id
  const jobTypeClassName = (jobTypeId: number) => {
    let selectClassName = "";
    if (jobTypeId === 1) {
      selectClassName = "bg-[var(--chakra-colors-purple-400)]";
    } else if (jobTypeId === 2) {
      selectClassName = "bg-[var(--chakra-colors-orange-500)]";
    } else if (jobTypeId === 3) {
      selectClassName = "bg-[var(--chakra-colors-red-500)]";
    }
    return selectClassName;
  };
  const handleRemoveFromTemporaryMedia = (id: number) => {
    let _temporaryMedia = [...temporaryMedia];
    _temporaryMedia = _temporaryMedia.filter((e) => e.id !== id);
    setTemporaryMedia(_temporaryMedia);
  };
  const { refetch: getCustomersByCompanyId } = useQuery(GET_CUSTOMERS_QUERY, {
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
        setCustomerSelected({
          ..._customerOptions.find((_e) => _e.value === customerId).entity,
        });
        getCustomerAddresses();
      }
    },
  });

  const handleJobCcEmailsChange = useCallback(
    (event: SyntheticEvent, jobCcEmailTags: string[]) => {
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
    [],
  );

  useEffect(() => {
    // Function to calculate filtered job types based on cutoff logic
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

        if (job.job_category_id === 1) {
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
        } else if (job.job_category_id === 2) {
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
                    onChange={(e) => {
                      setJob({
                        ...job,
                        customer_id: e.value || null,
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
                    </Grid>
                  </Box>

                  <Divider className="my-12" />

                  {/* Delivery Information */}
                  <Box mb="16px">
                    <h3 className="mb-5 mt-3">Delivery Information</h3>
                    {/* foreach jobDestinations */}
                    {jobDestinations.map((jobDestination, index) => {
                      return (
                        <Box key={jobDestination.id}>
                          <Grid templateColumns="repeat(10, 1fr)" gap={4}>
                            <GridItem colSpan={2}>
                              <h4 className="mb-5 mt-3">
                                Delivery Address {index + 1}
                              </h4>
                            </GridItem>
                            <JobAddressesSection
                              entityModel={job}
                              onAddressSaved={(hasChanged) => {
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
                              setJob({
                                ...job,
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
                            defaultValue={"0"}
                            onChange={(e) => {
                              setJob({
                                ...job,
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
                              setJob({
                                ...job,
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
                  </Box>
                </Box>

                <Divider className="mt-12 mb-6" />

                {/* Create Job Button */}
                <Flex alignItems="center" className="mb-6">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsSaving(true);
                      handleCreateJob();
                    }}
                    isDisabled={isSaving}
                  >
                    Create Job
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

export default JobEdit;
