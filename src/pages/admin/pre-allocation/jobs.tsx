import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Spinner,
  //Spinner,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import {
  defaultJobFilter,
  defaultSelectedFilter,
  filterDisplayNames,
  SelectedFilter,
} from "components/jobs/Filters";
// import { getCompanyColumns } from "components/jobs/JobTableColumnsCustomer";
import ActionBar from "components/preAllocation/PreActionBar";
import {
  getBulkAssignColumns,
  getColumnsPre,
  // tableColumn,
} from "components/preAllocation/PreJobTableColumns";
// import { SearchBar } from "components/navbar/searchBar/SearchBar";
import JobPaginationTable from "components/table/PreJobPaginationTable";
import { GET_AVAILABLE_DRIVERS_QUERY } from "graphql/driver";
import {
  DynamicTableUser,
  GET_DYNAMIC_TABLE_USERS_QUERY,
} from "graphql/dynamicTableUser";
import { PRE_ALLOCATION_JOBS_QUERY } from "graphql/job";
// import { GET_JOB_CATEGORIES_QUERY } from "graphql/jobCategories";
// import { GET_JOB_STATUSES_QUERY } from "graphql/jobStatus";
// import { JoinOnClause } from "graphql/types/types";
// import {
//   outputDynamicTableBody,
//   outputDynamicTableHeader,
// } from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import dynamic from "next/dynamic";
import { destroyCookie, setCookie } from "nookies";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
// import { downloadExcel } from "react-export-table-to-excel";
// import { FaFileExcel } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsFilterTicked,
  setJobFilters,
  setJobMainFilters,
} from "store/jobFilterSlice";
import { RootState } from "store/store";

import { useSubscriptionService } from "../../../utils/subscriptionService";
// import JobFiltersTagRow from "./job-components/JobFiltersTagRow";
import JobHeader from "./job-components/JobHeader";

const JobStatusDateFilter = dynamic(
  () => import("./job-components/JobStatusDateFilter"),
  {
    ssr: false,
  },
);
const JobContextMenu = React.lazy(
  () => import("components/preAllocation/JobContextMenu"),
);
const FilterJobsModal = React.lazy(
  () => import("components/preAllocation/FilterJobsModal"),
);
const PreAllocateModal = React.lazy(
  () => import("components/preAllocation/PreAllocateModal"),
);
const AssignJobsModal = React.lazy(
  () => import("components/preAllocation/AssignJobsModal"),
);
// const JobBulkSortModal = React.lazy(
//   () => import("components/preAllocation/PreJobBulkSortModal"),
// );
// Inside Job Index
const JobTableSettingsModal = dynamic(
  () => import("components/preAllocation/JobTableSettingsModal"),
  {
    loading: () => <Text>Loading settings...</Text>,
    ssr: false,
  },
);

// const driverListOptions = [
//   {
//     value: "all",
//     label: "All",
//     statusIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
//   },
//   {
//     value: "D1",
//     label: "driver 1",
//     statusIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
//   },
//   {
//     value: "D2",
//     label: "Driver 2",
//     statusIds: [1, 2, 3],
//   },
//   {
//     value: "D3",
//     label: "Driver 3",
//     statusIds: [6, 7],
//   },
// ];

function formatDate(date: Date, isStart: boolean): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const time = isStart ? "00:00:00" : "23:59:59";
  return `${year}-${month}-${day} ${time}`;
}


export default function JobIndex({ }: // initialLoadOnly = false,
  {
    // initialLoadOnly?: boolean;
  }) {
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(100);

  const [searchQuery, setSearchQuery] = useState("");
  // const [sorting, setSorting] = useState<any>({ id: "id", direction: true });
  const today = new Date();
  const [rangeDate, setRangeDate] = useState<[Date, Date]>([today, today]);
  const [_isTableLoading, setIsTableLoading] = useState(false);
  const { isAdmin, isCustomer, companyId, customerId, userId } = useSelector(
    (state: RootState) => state.user,
  );
  const { filters, displayName, jobMainFilters, is_filter_ticked } =
    useSelector((state: RootState) => state.jobFilter);
  const dispatch = useDispatch();
  const [withMedia, setWithMedia] = useState(false);
  const [isMediaBusy, setIsMediaBusy] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverOptions, setDriverOptions] = useState([]);
  const [isShowSelectedOnly, setIsShowSelectedOnly] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [jobFilter, setJobFilter] = useState(defaultJobFilter);
  const [mainJobFilter, setMainJobFilter] = useState(null);
  const [mainFilters, setMainFilters] = useState<any>(defaultSelectedFilter);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilter>(
    defaultSelectedFilter,
  );
  const [mainFilterDisplayNames, setMainFilterDisplayNames] =
    useState<typeof filterDisplayNames>(filterDisplayNames);
  const [dynamicTableUsers, setDynamicTableUsers] = useState<
    DynamicTableUser[]
  >([]);
  // const [companyColumns, setCompanyColumns] = useState([]); // State for company columns
  const handleToggleWithMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsMediaBusy(true);
    setWithMedia(e.target.checked);
  };
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignDriver, setAssignDriver] = useState(null);
  const { refetch: getDynamicTableUsers, data: dynamicTableData } = useQuery(
    GET_DYNAMIC_TABLE_USERS_QUERY,
    {
      variables: {
        query: "",
        page: 1,
        first: 100,
        orderByColumn: "sort_id",
        orderByOrder: "ASC",
        user_id: userId,
        table_name: "pre-allocation-jobs",
      },
      skip: !userId,
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        //console.log("dynamicTableData =>", data.dynamicTableUsers.data);
        setDynamicTableUsers(
          data.dynamicTableUsers.data.filter(
            (item: DynamicTableUser) => item.is_active == true,
          ),
        );
      },
    },
  );

  const [sorting, setSorting] = useState<any>(null);

  // Update handleSortingChange
  const handleSortingChange = (sortBy: string | any[]) => {
    if (sortBy.length === 0) {
      setSorting(null);
    } else {
      const [sort] = sortBy;

      // Map column id to backend field name
      let field = sort.id;
      if (sort.id === "name") {
        field = "delivery_id";
      } else if (sort.id === "suburb_area,area_color") {
        field = "suburb_area";
      }

      setSorting({
        field: field,
        order: sort.desc ? "DESC" : "ASC",
      });
    }
  };

  const baseGroupedVars = React.useCallback(
    () => ({
      page: queryPageIndex + 1,
      per_page: queryPageSize,
      query: searchQuery || "",
      // job_status_ids: mainJobFilter?.job_status_ids || [
      //   1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      // ],
      // company_id: isCompany ? parseInt(companyId) : undefined,
      // customer_id: isCustomer && !isCompanyAdmin ? parseInt(customerId) : undefined,
      between_at: rangeDate?.[0]
        ? {
          from_at: formatDate(rangeDate[0], true),
          to_at: formatDate(rangeDate[1], false),
        }
        : undefined,
    }),
    // eslint-disable-line react-hooks/exhaustive-deps
    [queryPageIndex, queryPageSize, searchQuery, rangeDate], //, mainJobFilter?.job_status_ids
  );
  const groupedVars = React.useMemo(() => {
    const baseVars = {
      ...baseGroupedVars(),
      // Add sorting parameters
      sort_by: sorting?.field || null,
      sort_order: sorting?.order || null,
    };

    return is_filter_ticked === "1"
      ? { ...baseVars, ...(mainJobFilter ?? {}) }
      : baseVars;
  }, [is_filter_ticked, mainJobFilter, baseGroupedVars, sorting]);

  const {
    data: groupedJobs,
    loading: loading,
    refetch: refetchJobs,
  } = useQuery(PRE_ALLOCATION_JOBS_QUERY, {
    variables: groupedVars,
    skip: !userId || (!isAdmin && !companyId && !customerId),
    fetchPolicy: "network-only",
    onCompleted: (_data) => {
      // console.log("groupedJobs =>", data.groupedPaginatedJobs.data);
    },
  });
  const _jobs = groupedJobs?.preAllocationJobs;
  const hasData = _jobs?.data?.length > 0;

  useSubscriptionService({
    jobUpdated: {
      channel: "jobs",
      event: ".job.updated",
      callback: () => refetchJobs(),
    },
  });

  // useEffect(() => {
  //   const handleVisibility = () => {
  //     if (document.visibilityState !== "visible") return;

  //     const today = new Date();
  //     const startOfToday = new Date(
  //       today.getFullYear(),
  //       today.getMonth(),
  //       today.getDate(),
  //     );
  //     const currentStartDate = rangeDate?.[0]
  //       ? new Date(
  //         rangeDate[0].getFullYear(),
  //         rangeDate[0].getMonth(),
  //         rangeDate[0].getDate(),
  //       )
  //       : null;

  //     // 🔒 Already today → stop
  //     if (
  //       currentStartDate &&
  //       currentStartDate.getTime() === startOfToday.getTime()
  //     ) {
  //       return;
  //     }
  //     setRangeDate([today, today]);
  //     refetchJobs();
  //     getAvailableDrivers();
  //   };

  //   document.addEventListener("visibilitychange", handleVisibility);

  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibility);
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [rangeDate, groupedVars]);

  const adminColumns = useMemo(() => {
    return getColumnsPre(
      isAdmin,
      withMedia,
      refetchJobs,
      dynamicTableData?.dynamicTableUsers?.data || [],
    );
  }, [dynamicTableData, isAdmin, withMedia, refetchJobs]);

  useEffect(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setIsMediaBusy(false);
      hideTimerRef.current = null;
    }, 2000); // keep spinner visible ~300ms
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [adminColumns]);

  // useEffect(() => {
  //   const columns = getCompanyColumns(isAdmin, isCustomer, withMedia);
  //   setCompanyColumns(columns);
  // }, [withMedia, isAdmin]);

  const bulkAssignColumns = getBulkAssignColumns(
    isAdmin,
    isCustomer,
    dynamicTableUsers,
  );

  useEffect(() => {
    const hasGroupedJobs = groupedJobs?.preAllocationJobs?.data?.length > 0;

    if (isAdmin && hasGroupedJobs) {
      // getJobStatuses();
      // getJobCategories();
      getAvailableDrivers();
      getDynamicTableUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, groupedJobs?.preAllocationJobs?.data?.length]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      maxAge: 24 * 60 * 60,
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
    // getJobStatuses();
    // getJobCategories();
    getAvailableDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    isOpen: isOpenSetting,
    onOpen: onOpenSetting,
    onClose: onCloseSetting,
  } = useDisclosure();
  // const {
  //   isOpen: isOpenBulkSort,
  //   onOpen: onOpenBulkSort,
  //   onClose: onCloseBulkSort,
  // } = useDisclosure();

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
    if (isAdmin) {
      refetchJobs(); // GROUPED_PAGINATED_JOBS_QUERY
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    queryPageIndex,
    queryPageSize,
    searchQuery,
    mainFilters,
    rangeDate,
    withMedia,
    isAdmin,
    groupedVars,
    refetchJobs,
  ]);

  const debouncedSearch = useMemo(
    () =>
      debounce((query) => {
        setSearchQuery(query);
        setQueryPageIndex(0);
      }, 300),
    [],
  );

  useEffect(
    () => debouncedSearch.cancel(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { refetch: getAvailableDrivers } = useQuery(
    GET_AVAILABLE_DRIVERS_QUERY,
    {
      skip: true,
      variables: {
        query: "",
        page: 1,
        first: 500,
        orderByColumn: "id",
        orderByOrder: "ASC",
        available: true,
        // need to add in available drivers
      },
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        setDriverOptions([]);
        // setDrivers([]);
        data.drivers.data.map((driver: any) => {
          setDriverOptions((driverOptions) => [
            ...driverOptions,
            {
              value: parseInt(driver.id),
              label: driver.full_name,
              data: driver,
            },
          ]);
          // setDrivers(data.drivers.data);
        });
      },
    },
  );

  // const handleSortingChange = (sortBy: string | any[]) => {
  //   if (sortBy.length === 0) {
  //     setSorting({
  //       id: "id",
  //       direction: true,
  //     });
  //   } else {
  //     const [sort] = sortBy;
  //     const _newDirection = sort.desc ? "DESC" : "ASC";
  //     const newSorting = {
  //       id: sort.id,
  //       direction: sort.desc,
  //     };
  //     setSorting(newSorting);
  //   }
  // };

  // 🟩 Simple handler – no filtering logic
  const handleDriverChange = (selectedOption: any) => {
    setSelectedDriver(selectedOption);
  };

  useEffect(() => {
    setIsTableLoading(loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (isAdmin) {
      refetchJobs(groupedVars);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedVars, isAdmin]);

  const openAssignModal = (driver) => {
    if (!driver) return;

    setAssignDriver(driver);
    _jobs?.data?.forEach((j) => {
      console.log({
        preallocation: j?.job?.preallocation_driver_id,
        actualDriver: j?.job?.driver,
        currentDriver: driver.id,
      });
    });

    const driverJobs =
      _jobs?.data
        ?.filter((j) => {
          const preallocId = Number(j?.job?.preallocation_driver_id);
          const driverId = Number(driver?.id);

          return (
            preallocId === driverId &&
            j?.job?.driver === null
          );
        })
        .map((item) => ({
          id: item.job.id,
          original: { job: item.job },
        })) || [];

    console.log('Filtered driverJobs:', driverJobs);

    setSelectedJobs(driverJobs);
    setIsAssignOpen(true);
  };


  // ✅ ADD: Context menu state
  const [contextMenu, setContextMenu] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
    job: any;
  }>({
    visible: false,
    x: 0,
    y: 0,
    job: null,
  });

  // ✅ ADD: Handle right click
  // ✅ Handle context menu open
  const handleContextMenu = (e: React.MouseEvent, job: any) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      job: job,
    });
  };

  // ✅ ADD: Close context menu
  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      job: null,
    });
  };

  // // ✅ ADD: Handle save (will connect API later)
  // const handleSaveTagsLabels = (jobId: string, data: any) => {
  //   console.log('Tags/Labels data:', {
  //     jobId,
  //     tags: data.tags,
  //     labels: data.labels,
  //     driver_id: data.driver_id,
  //     job_status_id: data.job_status_id
  //   });
  //   closeContextMenu();
  // };

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
          <JobHeader
            isAdmin={isAdmin}
            // isCompany={isCompany}
            onOpenSetting={onOpenSetting}
            onOpenFilter={onOpenFilter}
            isFilterTicked={is_filter_ticked}
            // handleExport={handleExport}
            debouncedSearch={debouncedSearch}
            onToggleFilterCheckbox={(checked) => {
              if (!checked) {
                destroyCookie(null, "jobMainFilters", { path: "*" });
                destroyCookie(null, "displayName", { path: "*" });
                handleResetAll();
              }
              setCookie(null, "is_filter_ticked", checked ? "1" : "0", {
                maxAge: 30 * 24 * 60 * 60,
                path: "*",
              });
              dispatch(setIsFilterTicked(checked ? "1" : "0"));
            }}
            handleExport={function (): void {
              throw new Error("Function not implemented.");
            }}
          />

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
              <Button
                // onClick={clearJobFilters}
                className="!h-[30px] ml-2"
                variant="smallGreySquare"
                bg={"none"}
                onClick={() => handleResetAll()}
              >
                Clear all
              </Button>;
            })}
          </Flex>

          <JobStatusDateFilter
            columns={bulkAssignColumns}
            driverOptions={driverOptions}
            onDriverChange={handleDriverChange}
            selectedDriver={selectedDriver}
            selectedJobs={selectedJobs}
            rangeDate={rangeDate}
            setRangeDate={setRangeDate}
            withMedia={withMedia}
            handleToggleWithMedia={handleToggleWithMedia}
            isMediaBusy={isMediaBusy}
          />
          {loading ? (
            <Box textAlign="center" py={4} px={10}>
              Loading <Spinner size="sm" ml={2} />
            </Box>
          ) : hasData ? (
            // <JobPaginationTable
            //   columns={adminColumns}
            //   data={_jobs?.data}
            //   total={_jobs?.total}
            //   options={{
            //     manualSortBy: true,
            //     manualPagination: true,
            //     initialState: {
            //       pageIndex: queryPageIndex,
            //       pageSize: queryPageSize,
            //       sortBy: [],
            //     },
            //     pageCount: _jobs?.last_page,
            //   }}
            //   onReorder={(reordered) => {
            //     console.log("New reordered list:", reordered);
            //     // handleBulkAssignJobs({ variables: { input: reordered } });
            //   }}
            //   onReorderChange={(changed) => setHasChanges(changed)} // ✅ handled here
            //   autoSaveOnReorder={false} // ✅ manual save
            //   setQueryPageIndex={setQueryPageIndex}
            //   setQueryPageSize={setQueryPageSize}
            //   isServerSide
            //   showPageSizeSelect
            //   showRowSelection
            //   setSelectedRow={setSelectedJobs}
            //   isFilterRowSelected={isShowSelectedOnly}
            //   isChecked={isChecked}
            //   onSortingChange={handleSortingChange}
            //   restyleTable
            // />
            <JobPaginationTable
              columns={adminColumns}
              data={_jobs?.data || []} // Use data directly from backend
              total={_jobs?.total}
              options={{
                manualSortBy: true, // Keep as true - backend handles it
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                  sortBy: sorting
                    ? [{ id: sorting.field, desc: sorting.order === "DESC" }]
                    : [],
                },
                manualPagination: true,
                pageCount: _jobs?.last_page,
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
              onSortingChange={handleSortingChange} // Enable sorting
              onAssignClick={openAssignModal}
              restyleTable
              refetchJobs={refetchJobs}
              onContextMenu={handleContextMenu}
            />
          ) : (
            <Box textAlign="center" py={4} px={10} color="gray.600">
              No records found.
            </Box>
          )}

          <Suspense fallback={null}>
            {contextMenu.visible && contextMenu.job && (
              <JobContextMenu
                job={contextMenu.job}
                position={{ x: contextMenu.x, y: contextMenu.y }}
                onClose={closeContextMenu}
                // onSave={handleSaveTagsLabels}
                drivers={driverOptions}
              />
            )}
          </Suspense>
        </SimpleGrid>

        {/* Floating Action Bar */}
        {isAdmin && (
          <ActionBar
            {...({
              selectedDriver: selectedDriver,
              selectedJobs: selectedJobs,
              onSwitch: setIsShowSelectedOnly,
              // hasChanges: hasChanges, // enable Save button
              onSaveChanges: onOpenBulkAssign,
              // onClickBulkSort: onOpenBulkSort,
            } as any)}
          />
        )}

        <Suspense fallback={null}>
          {isOpenFilter && (
            <FilterJobsModal
              isOpen={isOpenFilter}
              onClose={onCloseFilter}
              // jobStatuses={jobStatuses}
              // jobCategories={jobCategories}
              onFilterApply={(selectedFilters, filterDisplayName) => {
                // Update the tags
                updateTags(selectedFilters, jobFilter);
                console.log(selectedFilters, "selectedFilters");
                setMainFilterDisplayNames(filterDisplayName);
                setCookie(
                  null,
                  "displayName",
                  JSON.stringify(filterDisplayName),
                  {
                    maxAge: 30 * 24 * 60 * 60,
                    path: "*",
                  },
                );
              }}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              jobFilter={jobFilter}
              setJobFilter={setJobFilter}
              filterDisplayNames={mainFilterDisplayNames}
            />
          )}
        </Suspense>
        <Suspense fallback={null}>
          {isOpenSetting && (
            <JobTableSettingsModal
              isOpen={isOpenSetting}
              onClose={() => {
                onCloseSetting();
                // setSettingOpen(false);
                getDynamicTableUsers();
                refetchJobs(); // Optional: Refresh job data
              }}
            />
          )}
        </Suspense>
        <Suspense fallback={null}>
          {isOpenBulkAssign && (
            <PreAllocateModal
              isOpen={isOpenBulkAssign}
              onClose={() => {
                onCloseBulkAssign();
              }}
              selectedDriver={selectedDriver}
              selectedJobs={selectedJobs}
              columns={bulkAssignColumns}
              setIsChecked={setIsChecked}
              setSelectedJobs={setSelectedJobs}
              refreshPage={() => {
                // refetchJobs();
                setSelectedJobs([]);
                setSelectedDriver(null);
                setIsChecked(false);
                setTimeout(() => setIsChecked(true), 0);
              }}
            />
          )}
        </Suspense>
        {/* <Suspense fallback={null}>
          {isOpenBulkSort && (
            <JobBulkSortModal
              isOpen={isOpenBulkSort}
              onClose={onCloseBulkSort}
              selectedJobs={selectedJobs}
              columns={bulkAssignColumns}
              setIsChecked={setIsChecked}
              setSelectedJobs={setSelectedJobs}
            // refreshPage={() => refetchJobs()}
            />
          )}
        </Suspense> */}
        <Suspense fallback={null}>
          {isAssignOpen && (
            <AssignJobsModal
              isOpen={isAssignOpen}
              onClose={() => {
                setAssignDriver(null);
                setIsAssignOpen(false);
                setIsChecked(false);
                setSelectedJobs([]);
              }}
              driver={assignDriver}
              columns={bulkAssignColumns}
              selectedJobs={selectedJobs}
              setSelectedJobs={setSelectedJobs}
              setIsChecked={setIsChecked}
            // refreshPage={refetchJobs}
            />
          )}
        </Suspense>
      </Box>
    </AdminLayout>
  );
}
