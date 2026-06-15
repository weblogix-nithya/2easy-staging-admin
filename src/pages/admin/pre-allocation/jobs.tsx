import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Spinner,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import {
  defaultSelectedFilter,
  filterDisplayNames,
  preDefaultJobFilter,
  SelectedFilter,
} from "components/preAllocation/Filters";
import ActionBar from "components/preAllocation/PreActionBar";
import {
  getBulkAssignColumns,
  getColumnsPre,
} from "components/preAllocation/PreJobTableColumns";
import JobPaginationTable from "components/table/PreJobPaginationTable";
import { GET_AVAILABLE_DRIVERS_QUERY } from "graphql/driver";
import {
  DynamicTableUser,
  GET_DYNAMIC_TABLE_USERS_QUERY,
} from "graphql/dynamicTableUser";
import { PRE_ALLOCATION_JOBS_QUERY } from "graphql/job";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import dynamic from "next/dynamic";
import { destroyCookie, setCookie } from "nookies";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsPreFilterTicked,
  setPreJobFilters,
  setPreJobMainFilters,
} from "store/jobFilterSlice";
import { RootState } from "store/store";

import { useSubscriptionService } from "../../../utils/subscriptionService";
import JobHeader from "./job-components/JobHeader";

const JobStatusDateFilter = dynamic(
  () => import("./job-components/JobStatusDateFilter"),
  { ssr: false },
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
const JobTableSettingsModal = dynamic(
  () => import("components/preAllocation/JobTableSettingsModal"),
  {
    loading: () => <Text>Loading settings...</Text>,
    ssr: false,
  },
);

function formatDate(date: Date, isStart: boolean): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const time = isStart ? "00:00:00" : "23:59:59";
  return `${year}-${month}-${day} ${time}`;
}

export default function JobIndex({ }: {}) {
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const today = new Date();
  const [rangeDate, setRangeDate] = useState<[Date, Date]>([today, today]);

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
  const [jobFilter, setJobFilter] = useState(preDefaultJobFilter);
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

  // ✅ FIX 3: useCallback —  new function 
  const handleToggleWithMedia = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsMediaBusy(true);
      setWithMedia(e.target.checked);
    },
    [],
  );

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
        setDynamicTableUsers(
          data.dynamicTableUsers.data.filter(
            (item: DynamicTableUser) => item.is_active == true,
          ),
        );
      },
    },
  );

  const [sorting, setSorting] = useState<any>(null);

  // ✅ FIX 3: useCallback — sorting  new function
  const handleSortingChange = useCallback((sortBy: string | any[]) => {
    if (sortBy.length === 0) {
      setSorting(null);
    } else {
      const [sort] = sortBy;
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
  }, []);

  const groupedVars = useMemo(() => {
    const baseVars = {
      page: queryPageIndex + 1,
      per_page: queryPageSize,
      query: searchQuery || "",
      between_at: rangeDate?.[0]
        ? {
          from_at: formatDate(rangeDate[0], true),
          to_at: formatDate(rangeDate[1], false),
        }
        : undefined,
      sort_by: sorting?.field || null,
      sort_order: sorting?.order || null,
    };
    return is_filter_ticked === "1"
      ? { ...baseVars, ...(mainJobFilter ?? {}) }
      : baseVars;
  }, [
    queryPageIndex,
    queryPageSize,
    searchQuery,
    rangeDate,
    sorting,
    is_filter_ticked,
    mainJobFilter,
  ]);

  const {
    data: groupedJobs,
    loading: loading,
    refetch: refetchJobs,
  } = useQuery(PRE_ALLOCATION_JOBS_QUERY, {
    variables: groupedVars,
    skip: !userId || (!isAdmin && !companyId && !customerId),
    fetchPolicy: "network-only",
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

  // ✅ FIX 1: Double refetch  — useQuery-  
  // auto-fetch , manual refetchJobs useEffect 

  const adminColumns = useMemo(() => {
    return getColumnsPre(
      isAdmin,
      withMedia,
      refetchJobs,
      dynamicTableData?.dynamicTableUsers?.data || [],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicTableData, isAdmin, withMedia]);

  useEffect(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setIsMediaBusy(false);
      hideTimerRef.current = null;
    }, 2000);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [adminColumns]);

  // ✅ FIX 2: useMemo — every render-ல் getBulkAssignColumns()  run 
  const bulkAssignColumns = useMemo(
    () => getBulkAssignColumns(isAdmin, isCustomer, dynamicTableUsers),
    [isAdmin, isCustomer, dynamicTableUsers],
  );

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
    updateTags({ ...defaultSelectedFilter }, preDefaultJobFilter);
  };

  const updateTags = (
    updatedValues: SelectedFilter,
    jobFilter: any,
    displayNames?: any,
  ) => {
    const updatedJobFilter = { ...jobFilter };

    for (const key in defaultSelectedFilter) {
      if (
        updatedValues[key as keyof SelectedFilter] === undefined ||
        updatedValues[key as keyof SelectedFilter] === null ||
        updatedValues[key as keyof SelectedFilter]?.length === 0
      ) {
        delete updatedJobFilter[key as keyof SelectedFilter];
      }

      setCookie(
        null,
        `jobFilters_${key}`,
        JSON.stringify(updatedValues[key as keyof SelectedFilter]),
        { maxAge: 30 * 24 * 60 * 60, path: "*" },
      );

      dispatch(
        setPreJobFilters({
          key: key,
          value: updatedValues[key as keyof SelectedFilter],
        }),
      );
    }

    setCookie(null, `jobMainFilters`, JSON.stringify(updatedJobFilter), {
      maxAge: 24 * 60 * 60,
      path: "*",
    });

    dispatch(setPreJobMainFilters(updatedJobFilter));
    setJobFilter(updatedJobFilter);
    setMainJobFilter(updatedJobFilter);
    setSelectedFilters(updatedValues);
    setMainFilters(updatedValues);

    if (displayNames) {
      setMainFilterDisplayNames(displayNames);
    }
  };

  const {
    isOpen: isOpenFilter,
    onOpen: onOpenFilter,
    onClose: onCloseFilter,
  } = useDisclosure();

  useEffect(() => {
    getAvailableDrivers();
    getDynamicTableUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const { refetch: getAvailableDrivers } = useQuery(GET_AVAILABLE_DRIVERS_QUERY, {
    skip: true,
    variables: {
      query: "",
      page: 1,
      first: 500,
      orderByColumn: "id",
      orderByOrder: "ASC",
      available: true,
    },
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      // ✅ FIX 4: Loop- setState  
      // : 500 drivers = 500 setState = 500 re-renders!
      const options = data.drivers.data.map((driver: any) => ({
        value: parseInt(driver.id),
        label: driver.full_name,
        data: driver,
      }));
      setDriverOptions(options);
    },
  });

  // ✅ FIX 3: useCallback — selectedDriver   new function
  const handleDriverChange = useCallback((selectedOption: any) => {
    setSelectedDriver(selectedOption);
  }, []);

  // ✅ FIX 5: _isTableLoading state  — எங்கயும் use,
  //  loading  re-render 

  const openAssignModal = useCallback((driver: any) => {
    if (!driver) return;
    setAssignDriver(driver);
    setIsAssignOpen(true);
  }, []);

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

  // ✅ FIX 3: useCallback — context menu handlers
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, job: any) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        job: job,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, job: null });
  }, []);

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
            onOpenSetting={onOpenSetting}
            onOpenFilter={onOpenFilter}
            isFilterTicked={is_filter_ticked}
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
              dispatch(setIsPreFilterTicked(checked ? "1" : "0"));
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
                        mainFilterDisplayNames[filterKey as keyof SelectedFilter]
                          .value}
                    </TagLabel>
                    <TagCloseButton
                      onClick={() => {
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
              return null;
            })}
            {Object.values(mainFilters).some(Boolean) && (
              <Button
                className="!h-[30px] ml-2"
                variant="smallGreySquare"
                bg={"none"}
                onClick={() => handleResetAll()}
              >
                Clear all
              </Button>
            )}
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
            <JobPaginationTable
              columns={adminColumns}
              data={_jobs?.data || []}
              total={_jobs?.total}
              options={{
                manualSortBy: true,
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
              onSortingChange={handleSortingChange}
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
              onSaveChanges: onOpenBulkAssign,
            } as any)}
          />
        )}

        <Suspense fallback={null}>
          {isOpenFilter && (
            <FilterJobsModal
              isOpen={isOpenFilter}
              onClose={onCloseFilter}
              onFilterApply={(selectedFilters, filterDisplayName) => {
                updateTags(selectedFilters, jobFilter, filterDisplayName);
                setCookie(
                  null,
                  "displayName",
                  JSON.stringify(filterDisplayName),
                  { maxAge: 30 * 24 * 60 * 60, path: "*" },
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
                getDynamicTableUsers();
                refetchJobs();
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
                setSelectedJobs([]);
                setSelectedDriver(null);
                setIsChecked(false);
                setTimeout(() => setIsChecked(true), 0);
              }}
            />
          )}
        </Suspense>

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
              rangeDate={rangeDate}
            />
          )}
        </Suspense>
      </Box>
    </AdminLayout>
  );
}