// Third-party imports
import { useQuery } from '@apollo/client';
import { SettingsIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Link,
  SimpleGrid,
  Spinner,
  Tag,
  TagCloseButton,
  TagLabel,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import { Select } from 'chakra-react-select';
// Local imports
import { FullChevronDown } from 'components/icons/Icons';
import ActionBar from 'components/jobs/ActionBar';
import FilterJobsModal from 'components/jobs/FilterJobsModal';
import {
  defaultJobFilter,
  defaultSelectedFilter,
  filterDisplayNames,
  SelectedFilter,
} from 'components/jobs/Filters';
import JobBulkAssignModal from 'components/jobs/JobBulkAssignModal';
import {
  getBulkAssignColumns,
  getColumns,
  tableColumn,
} from 'components/jobs/JobTableColumns';
import JobTableSettingsModal from 'components/jobs/JobTableSettingsModal';
import { SearchBar } from 'components/navbar/searchBar/SearchBar';
import PaginationTable from 'components/table/PaginationTable';
import { GET_AVAILABLE_DRIVERS_QUERY } from 'graphql/driver';
import {
  DynamicTableUser,
  GET_DYNAMIC_TABLE_USERS_QUERY,
} from 'graphql/dynamicTableUser';
import { GET_JOBS_QUERY } from 'graphql/job';
import { GET_JOB_CATEGORIES_QUERY } from 'graphql/jobCategories';
import { GET_JOB_STATUSES_QUERY } from 'graphql/jobStatus';
import { JoinOnClause } from 'graphql/types/types';
import {
  outputDynamicTableBody,
  outputDynamicTableHeader,
} from 'helpers/helper';
import AdminLayout from 'layouts/admin';
import debounce from 'lodash.debounce';
import { destroyCookie, parseCookies, setCookie } from 'nookies';
import React, { useEffect, useMemo, useState } from 'react';
import { downloadExcel } from 'react-export-table-to-excel';
import { FaFileExcel } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import {
  setIsFilterTicked,
  setJobFilters,
  setJobMainFilters,
} from 'store/jobFilterSlice';
import { RootState } from 'store/store';

export default function JobIndex() {
  let menuBg = useColorModeValue("white", "navy.800");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(150);
  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState<any>({ id: "id", direction: true });
  const [statusFilter, setStatusFilter] = useState("all");
  const [rangeDate, setRangeDate] = useState([null, null]);

  const [isTableLoading, setIsTableLoading] = useState(false);
  const { isAdmin, companyId, isCompany, isCustomer, userId } = useSelector(
    (state: RootState) => state.user,
  );
  const adminStatusOptions = [
    {
      value: "all",
      label: "Show All",
      statusIds: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      value: "current",
      label: "Current (Unassigned/Scheduled/En Route)",
      statusIds: [1, 2, 4],
    },
    {
      value: "in_transit",
      label: "In Transit (Assigned/In Transit)",
      statusIds: [3, 5],
    },
    {
      value: "completed",
      label: "Completed (Completed/Delivered)",
      statusIds: [6, 7],
    },
  ];

  const companyStatusOptions = [
    {
      value: "all",
      label: "Show All",
      statusIds: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      value: "Open",
      label: "Open",
      statusIds: [1],
    },
    {
      value: "Completed",
      label: "Completed",
      statusIds: [6, 7],
    },
  ];

  // Replace the statusOptions with a conditional assignment
  const statusOptions = !isCompany ? companyStatusOptions : adminStatusOptions;

  const { filters, displayName, jobMainFilters, is_filter_ticked } =
    useSelector((state: RootState) => state.jobFilter);
  const cookies = parseCookies();
  const dispatch = useDispatch();

  const [jobStatuses, setJobStatuses] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  // const [isCompleted, setIsCompleted] = useState(false); // 1 = pending, 2 = active, 4 = inactive
  // const [isPending, setIsPending] = useState(true); // First access is Pending
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverOptions, setDriverOptions] = useState([]);
  const [dynamicTableUsers, setDynamicTableUsers] = useState<
    DynamicTableUser[]
  >([]);
  const [isShowSelectedOnly, setIsShowSelectedOnly] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [jobFilter, setJobFilter] = useState(defaultJobFilter);
  const [mainJobFilter, setMainJobFilter] = useState(null);
  const [mainFilters, setMainFilters] = useState<any>(defaultSelectedFilter);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilter>(
    defaultSelectedFilter,
  );
  const [mainFilterDisplayNames, setMainFilterDisplayNames] =
    useState(filterDisplayNames); // Table Columns

  const columns = useMemo(
    () =>
      getColumns(
        isAdmin,
        isCustomer,
        dynamicTableUsers,
        // isPending,
        // isCompleted,
      ),
    [isCustomer, isAdmin, dynamicTableUsers],
  );

  const adminColumns = useMemo(() => columns, []); // Keep existing columns for admin
  // console.log(columns, "col");

  const companyColumns = columns.filter((column) =>
    [
      "name",
      "company.name",
      "reference_no",
      "job_category.name",
      "job_type.name",
      "job_status.name",
      "ready_at",
      "pick_up_destination.address_formatted",
      // 'pick_up_destination.address_business_name',
      "job_destinations.address",
      // 'job_destinations.address_business_name',
      "actions",
    ].includes(column.id),
  );

  // console.log(companyColumns, "companyColumns");

  const bulkAssignColumns = getBulkAssignColumns(
    isAdmin,
    isCustomer,
    dynamicTableUsers,
  );

  const defaultTableColumns = columns.reduce(
    (prev, column) => [...prev, column.id],
    [],
  );

  useEffect(() => {
    setIsChecked(true);
  }, [isChecked]);
  const [tableColumns, setTableColumn] =
    useState<string[]>(defaultTableColumns);
  useEffect(() => {
    if (is_filter_ticked == "1") {
      let _jobFilter = jobFilter;
      const updatedValues: any = {};
      for (const key in defaultSelectedFilter) {
        if (
          filters[key as keyof SelectedFilter] !== undefined &&
          filters[key as keyof SelectedFilter] !== "undefined" &&
          filters[key as keyof SelectedFilter] !== ""
        ) {
          updatedValues[key] = filters[key as keyof SelectedFilter];
        }
      }

      setJobFilter(jobMainFilters);
      _jobFilter = jobMainFilters;
      if (displayName) setMainFilterDisplayNames(displayName);
      updateTags(updatedValues, _jobFilter);
    }
  }, [is_filter_ticked]);

  const handleResetAll = () => {
    updateTags({ ...defaultSelectedFilter }, defaultJobFilter);
  };

  const updateTags = (updatedValues: SelectedFilter, jobFilter: any) => {
    const updatedJobFilter = { ...jobFilter };
    for (const key in defaultSelectedFilter) {
      if (
        updatedValues[key as keyof SelectedFilter] == undefined ||
        updatedValues[key as keyof SelectedFilter] == null ||
        updatedValues[key as keyof SelectedFilter].length == 0
      ) {
        delete updatedJobFilter[key as keyof SelectedFilter];
      }
      setCookie(
        null,
        `jobFilters_${key}`,
        JSON.stringify(updatedValues[key as keyof SelectedFilter]),
        {
          maxAge: 30 * 24 * 60 * 60,
          path: "*",
        },
      );
      dispatch(
        setJobFilters({
          key: key,
          value: updatedValues[key as keyof SelectedFilter],
        }),
      );
    }
    setCookie(null, `jobMainFilters`, JSON.stringify(updatedJobFilter), {
      maxAge: 30 * 24 * 60 * 60,
      path: "*",
    });
    dispatch(setJobMainFilters(updatedJobFilter));

    setJobFilter(updatedJobFilter);
    setMainJobFilter(updatedJobFilter);
    setSelectedFilters(updatedValues);
    setMainFilters(updatedValues);
  };
  const {
    isOpen: isOpenFilter,
    onOpen: onOpenFilter,
    onClose: onCloseFilter,
  } = useDisclosure();
  useEffect(() => {
    getJobStatuses();
    getJobCategories();
  }, []);

  const {
    isOpen: isOpenSetting,
    onOpen: onOpenSetting,
    onClose: onCloseSetting,
  } = useDisclosure();

  const {
    isOpen: isOpenBulkAssign,
    onOpen: onOpenBulkAssign,
    onClose: onCloseBulkAssign,
  } = useDisclosure();

  // const changeTab = useMemo(() => {
  //   return debounce((tab) => {
  //     // setIsPending(tab == 1);
  //     // setIsCompleted(tab == 2 ? true : false);
  //     setQueryPageIndex(0);
  //   }, 300);
  // }, []);

  useEffect(() => {
    if (isAdmin) getJobs();
    if (isCompany) getCompanyJobs();
  }, [
    queryPageIndex,
    queryPageSize,
    searchQuery,
    // isCompleted,
    mainFilters,
    rangeDate,
    // isPending,
  ]);

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const { refetch: getJobStatuses } = useQuery(GET_JOB_STATUSES_QUERY, {
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

  const { refetch: getJobCategories } = useQuery(GET_JOB_CATEGORIES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setJobCategories([]);
      data.jobCategorys.data.map((category: any) => {
        setJobCategories((jobCategories) => [
          ...jobCategories,
          {
            value: parseInt(category.id),
            label: category.name,
          },
        ]);
      });
    },
  });

  const processJobData = (jobsData: any[]) => {
    // Separate unassigned and assigned jobs
    const unassignedJobs = jobsData.filter((job) => !job.driver_id);
    const assignedJobs = jobsData.filter((job) => job.driver_id);
    // console.log(assignedJobs, "dddd");
    // Group assigned jobs by driver
    const groupedByDriver = assignedJobs.reduce((acc, job) => {
      const driverId = job.driver_id;
      if (!acc[driverId]) {
        acc[driverId] = {
          driverInfo: {
            id: driverId,
            name: job.driver?.full_name || "Unknown Driver",
            isDriverHeader: true,
            is_tailgated: job.driver?.is_tailgated || false,
            no_max_capacity: job.driver?.no_max_capacity || "-",
            no_max_pallets: job.driver?.no_max_pallets || "-",
            no_max_volume: job.driver?.no_max_volume || "-",
            phone_no: job.driver?.phone_no || "-",
            registration_no: job.driver?.registration_no || "-",
          },
          jobs: [],
        };
      }
      acc[driverId].jobs.push(job);
      return acc;
    }, {});

    // Create final data array with headers and jobs
    const processedData = [
      ...unassignedJobs,
      ...Object.values(groupedByDriver).flatMap((group) => [
        (
          group as {
            driverInfo: { id: string; name: string; isDriverHeader: boolean };
          }
        ).driverInfo,
        ...(group as { jobs: any[] }).jobs,
      ]),
    ];

    return processedData;
  };
  const orderByRelationship = useMemo(() => {
    let join = undefined as JoinOnClause;
    let column = sorting?.id ?? "id";
    let order = sorting?.direction ? "DESC" : "ASC";
    let table_name = "jobs";
    let scope = undefined;
    if (column.includes("driver")) {
      join = {
        name: "drivers",
        table_name: "drivers",
        key: "id",
        other_key: "driver_id",
        other_table_name: "jobs",
      };
      table_name = "drivers";
      column = "full_name";
    }
    return [
      {
        join: join ? [join] : undefined,
        column,
        order,
        table_name,
        // scope,
      },
    ];
  }, [sorting]);

  const {
    loading,
    error,
    data: jobs,
    refetch: getJobs,
  } = useQuery(GET_JOBS_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByRelationship: orderByRelationship,
      between_at:
        rangeDate && rangeDate[0]
          ? {
              from_at: rangeDate[0],
              to_at: rangeDate[1],
            }
          : undefined,
      job_status_ids: mainJobFilter?.job_status_ids || [1, 2, 3, 4, 5, 6, 7],
      ...mainJobFilter,
    },
    skip: !isAdmin,
  });

  const {
    loading: companyJobsLoading,
    error: companyJobsError,
    data: companyJobs,
    refetch: getCompanyJobs,
  } = useQuery(GET_JOBS_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByRelationship: orderByRelationship,
      company_id: parseInt(companyId),
      between_at:
        rangeDate && rangeDate[0]
          ? {
              from_at: rangeDate[0],
              to_at: rangeDate[1],
            }
          : undefined,
      job_status_ids: mainJobFilter?.job_status_ids || [1, 2, 3, 4, 5, 6, 7],
      ...mainJobFilter,
    },
    skip: !isCompany,
  });

  useQuery(GET_AVAILABLE_DRIVERS_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 300,
      orderByColumn: "id",
      orderByOrder: "ASC",
      available: true,
      // need to add in available drivers
    },
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      setDriverOptions([]);
      setDrivers([]);
      data.drivers.data.map((driver: any) => {
        setDriverOptions((driverOptions) => [
          ...driverOptions,
          {
            value: parseInt(driver.id),
            label: driver.full_name,
            data: driver,
          },
        ]);
        setDrivers(data.drivers.data);
      });
    },
  });

  useEffect(() => {
    onChangeSearchQuery.cancel();
  });

  const { refetch: getDynamicTableUsers } = useQuery(
    GET_DYNAMIC_TABLE_USERS_QUERY,
    {
      variables: {
        query: "",
        page: 1,
        first: 100,
        orderByColumn: "sort_id",
        orderByOrder: "ASC",
        user_id: userId,
      },
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        setDynamicTableUsers(
          data.dynamicTableUsers.data.filter(
            (item: DynamicTableUser) => item.is_active == true,
          ),
        );
      },
    },
  );

  const handleExport = () => {
    const header = outputDynamicTableHeader(dynamicTableUsers);
    const body = outputDynamicTableBody(
      dynamicTableUsers,
      tableColumn,
      selectedJobs,
    );
    downloadExcel({
      fileName: "react-export-table-to-excel.xls",
      sheet: "Delivery Jobs",
      tablePayload: {
        header,
        body: body,
      },
    });
  };
  const handleSortingChange = (sortBy: string | any[]) => {
    // console.log("handleSorting", sortBy);
    if (sortBy.length === 0) {
      setSorting({
        id: "id",
        direction: true,
      });
    } else {
      const [sort] = sortBy;
      const newDirection = sort.desc ? "DESC" : "ASC";
      const newSorting = {
        id: sort.id,
        direction: sort.desc,
      };
      setSorting(newSorting);
    }
  };

  const handleStatusChange = (selectedOption: any) => {
    setStatusFilter(selectedOption.value);
    setQueryPageIndex(0);

    // Update job status IDs filter based on selection
    let statusIds: number[] = [];
    if (selectedOption.value !== "all") {
      const option = statusOptions.find(
        (opt) => opt.value === selectedOption.value,
      );
      statusIds = option?.statusIds || [];
    }

    // Store the status IDs in state or update the existing filter
    const updatedJobFilter = {
      ...mainJobFilter,
      job_status_ids: statusIds.length > 0 ? statusIds : [1, 2, 3, 4, 5, 6, 7],
    };
    setMainJobFilter(updatedJobFilter);
  };

  useEffect(() => {
    setIsTableLoading(loading || companyJobsLoading);
  }, [companyJobsLoading, loading]);

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "97px", xl: "97px" }}>
        <SimpleGrid
          mb="70px"
          pt="32px"
          px="24px"
          columns={{ sm: 1 }}
          spacing={{ base: "20px", xl: "20px" }}
        >
          <Flex
            minWidth="max-content"
            alignItems="center"
            justifyContent="space-between"
          >
            <h1>Delivery Jobs</h1>

            {isAdmin && (
              <Button variant="no-effects" onClick={onOpenSetting}>
                <SettingsIcon className="mr-2" />
                Settings
              </Button>
            )}
          </Flex>
          <Flex minWidth="max-content" justifyContent="space-between">
            <Flex>
              <SearchBar
                onChangeSearchQuery={onChangeSearchQuery}
                placeholder="Search delivery jobs"
                background={menuBg}
                me="10px"
              />
              {isAdmin && (
                <>
                  <Button
                    variant="no-effects"
                    onClick={onOpenFilter}
                    className="text-[var(--chakra-colors-primary-400)]"
                  >
                    Filters
                    <FullChevronDown className="ml-2" />
                  </Button>
                  <Checkbox
                    onChange={(e) => {
                      if (!e.target.checked) {
                        destroyCookie(null, "jobMainFilters", { path: "*" });
                        destroyCookie(null, "displayName", { path: "*" });
                        handleResetAll();
                      }
                      setCookie(
                        null,
                        "is_filter_ticked",
                        e.target.checked ? "1" : "0",
                        {
                          maxAge: 30 * 24 * 60 * 60,
                          path: "*",
                        },
                      );
                      dispatch(setIsFilterTicked(e.target.checked ? "1" : "0"));
                    }}
                    isChecked={is_filter_ticked == "1" ? true : false}
                  ></Checkbox>
                </>
              )}
            </Flex>

            <Flex>
              <Link href="/admin/jobs/create">
                <Button variant="primary" className="mr-2">
                  {isCompany ? "New booking" : "Create job"}
                </Button>
              </Link>
              <Button
                leftIcon={<FaFileExcel />}
                variant="primary"
                onClick={handleExport}
              >
                Export Xls
              </Button>
            </Flex>
          </Flex>
          <Flex alignItems="left" flexWrap={"wrap"}>
            {Object.keys(mainFilters).map((filterKey) => {
              if (mainFilters[filterKey]) {
                return (
                  <Tag
                    key={filterKey}
                    size={"md"}
                    borderRadius="full"
                    variant="solid"
                    bg={"black.100"}
                    color={"black"}
                  >
                    <TagLabel>
                      {mainFilterDisplayNames[filterKey as keyof SelectedFilter]
                        .label +
                        ":" +
                        mainFilterDisplayNames[
                          filterKey as keyof SelectedFilter
                        ].value}
                    </TagLabel>
                    <TagCloseButton
                      onClick={() => {
                        // Remove the filter when the tag is closed
                        const newSelectedFilters = { ...mainFilters };
                        delete newSelectedFilters[
                          filterKey as keyof SelectedFilter
                        ];
                        updateTags(newSelectedFilters, jobFilter);
                      }}
                    />
                  </Tag>
                );
              }
            })}
            <Button
              // onClick={clearJobFilters}
              className="!h-[30px] ml-2"
              variant="smallGreySquare"
              bg={"none"}
              onClick={() => handleResetAll()}
            >
              Clear all
            </Button>
          </Flex>
          <Flex>
            <Box width="300px">
              <Select
                options={statusOptions}
                defaultValue={statusOptions[0]}
                onChange={handleStatusChange}
                placeholder="Select Status"
                className="basic-single"
                classNamePrefix="select"
              />
            </Box>
            <Box
              alignItems="center"
              flexDirection="column"
              w="30%"
              maxW="max-content"
              p="10px 10px"
              h="max-content"
              ml="4"
              sx={{
                ".react-daterange-picker__wrapper": {
                  border: "1px solid",
                  borderColor: "#e3e3e3",
                  padding: "6px",
                  borderRadius: "0.375rem",
                  marginTop: "-15px",
                },
              }}
            >
              {/* @ts-ignore */}
              <DateRangePicker value={rangeDate} onChange={setRangeDate} />
            </Box>
          </Flex>
          {/* <TabsComponent
            tabs={isAdmin ? adminTabs : customerTabs}
            onChange={(tabId) => changeTab(tabId)}
          /> */}
          {isTableLoading ? (
            <Box textAlign="center" py={4} px={10}>
              Loading <Spinner size="sm" ml={2} />
            </Box>
          ) : (
            <>
              {isAdmin && !loading && jobs?.jobs.data.length >= 0 && (
                <PaginationTable
                  columns={adminColumns}
                  // data={jobs?.jobs.data}
                  data={processJobData(jobs?.jobs.data)}
                  options={{
                    manualSortBy: true,
                    initialState: {
                      pageIndex: queryPageIndex,
                      pageSize: queryPageSize,
                      sortBy: [{ id: sorting?.id, desc: sorting?.direction }],
                    },
                    manualPagination: true,
                    pageCount: jobs?.jobs.paginatorInfo.lastPage,
                  }}
                  setQueryPageIndex={setQueryPageIndex}
                  setQueryPageSize={setQueryPageSize}
                  isServerSide
                  showPageSizeSelect
                  showRowSelection
                  setSelectedRow={setSelectedJobs}
                  isFilterRowSelected={isShowSelectedOnly}
                  isChecked={isChecked}
                  showManualPages
                  onSortingChange={handleSortingChange}
                  restyleTable
                  // getRowProps={getJobRowProps}
                  getRowProps={(row) => ({
                    style: {
                      cursor: "pointer",
                    },
                    bg:
                      row.original.job_status?.id === 1
                        ? "yellow.50"
                        : [6, 7].includes(Number(row.original.job_status?.id))
                        ? "green.50"
                        : "white",
                    _hover: { bg: "gray.100" },
                  })}
                />
              )}

              {isCompany &&
                !companyJobsLoading &&
                companyJobs?.jobs.data.length >= 0 && (
                  <PaginationTable
                    columns={companyColumns}
                    data={companyJobs?.jobs.data}
                    options={{
                      manualSortBy: true,
                      initialState: {
                        pageIndex: queryPageIndex,
                        pageSize: queryPageSize,
                        sortBy: [{ id: sorting?.id, desc: sorting?.direction }],
                      },
                      manualPagination: true,
                      pageCount: companyJobs?.jobs.paginatorInfo.lastPage,
                    }}
                    setQueryPageIndex={setQueryPageIndex}
                    setQueryPageSize={setQueryPageSize}
                    isServerSide
                    showPageSizeSelect
                    showRowSelection
                    setSelectedRow={setSelectedJobs}
                    isFilterRowSelected={isShowSelectedOnly}
                    isChecked={isChecked}
                    showManualPages
                    onSortingChange={handleSortingChange}
                    // getRowProps={getJobRowProps}
                    getRowProps={(row) => ({
                      style: {
                        cursor: "pointer",
                      },
                      bg:
                        row.original.job_status?.id == 1
                          ? "yellow.50"
                          : [6, 7].includes(Number(row.original.job_status?.id))
                          ? "green.50"
                          : "white",
                      _hover: { bg: "gray.100" },
                    })}
                  />
                )}
            </>
          )}
        </SimpleGrid>

        {/* Floating Action Bar */}
        {isAdmin && !loading && (
          <ActionBar
            selectedJobs={selectedJobs}
            onSwitch={setIsShowSelectedOnly}
            onClickBulkAssign={onOpenBulkAssign}
          />
        )}

        <FilterJobsModal
          isOpen={isOpenFilter}
          onClose={onCloseFilter}
          jobStatuses={jobStatuses}
          jobCategories={jobCategories}
          onFilterApply={(selectedFilters, filterDisplayName) => {
            // Update the tags
            updateTags(selectedFilters, jobFilter);

            setMainFilterDisplayNames(filterDisplayName);
            setCookie(null, "displayName", JSON.stringify(filterDisplayName), {
              maxAge: 30 * 24 * 60 * 60,
              path: "*",
            });
          }}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          jobFilter={jobFilter}
          setJobFilter={setJobFilter}
          filterDisplayNames={mainFilterDisplayNames}
        />

        <JobTableSettingsModal
          isOpen={isOpenSetting}
          onClose={() => {
            onCloseSetting();
            getDynamicTableUsers();
          }}
        />

        <JobBulkAssignModal
          isOpen={isOpenBulkAssign}
          onClose={onCloseBulkAssign}
          driverOptions={driverOptions}
          drivers={drivers}
          selectedJobs={selectedJobs}
          columns={bulkAssignColumns}
          setIsChecked={setIsChecked}
          setSelectedJobs={setSelectedJobs}
          refreshPage={() => {
            if (isAdmin) getJobs();
            if (isCompany) getCompanyJobs();
          }}
        />
      </Box>
    </AdminLayout>
  ); // Close JobIndex function
} // Close export default
