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
  startTransition,
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

// FIX: AssignJobsModal is now conditionally mounted (not always mounted)
// This saves Apollo hooks + modal DOM from loading at page start
const AssignJobsModal = dynamic(
  () => import("components/preAllocation/AssignJobsModal"),
  { ssr: false },
);

const JobTableSettingsModal = dynamic(
  () => import("components/preAllocation/JobTableSettingsModal"),
  {
    loading: () => <Text>Loading settings...</Text>,
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

function formatDate(date: Date, isStart: boolean): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const time = isStart ? "00:00:00" : "23:59:59";
  return `${year}-${month}-${day} ${time}`;
}

export default function JobIndex({ }: {}) {
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const today = new Date();
  const [rangeDate, setRangeDate] = useState<[Date, Date]>([today, today]);

  const { isAdmin, isCustomer, companyId, customerId, userId } = useSelector(
    (state: RootState) => state.user,
  );
  const { filters, displayName, jobMainFilters, is_filter_ticked } = useSelector(
    (state: RootState) => state.jobFilter,
  );

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
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilter>(defaultSelectedFilter);
  const [mainFilterDisplayNames, setMainFilterDisplayNames] =
    useState<typeof filterDisplayNames>(filterDisplayNames);
  const [dynamicTableUsers, setDynamicTableUsers] = useState<DynamicTableUser[]>([]);

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
      setSorting({ field, order: sort.desc ? "DESC" : "ASC" });
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
  }, [queryPageIndex, queryPageSize, searchQuery, rangeDate, sorting, is_filter_ticked, mainJobFilter]);

  const {
    data: groupedJobs,
    loading,
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

  // ─────────────────────────────────────────
  // FIX 1: stableRefetch via useCallback
  // BEFORE: refetchJobs was missing from useMemo deps → stale closure
  //   columns always called the OLD refetchJobs function
  // ─────────────────────────────────────────
  const stableRefetch = useCallback(() => refetchJobs(), [refetchJobs]);

  const adminColumns = useMemo(() => {
    return getColumnsPre(
      isAdmin,
      withMedia,
      stableRefetch, // ← stable reference
      dynamicTableData?.dynamicTableUsers?.data || [],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicTableData, isAdmin, withMedia, stableRefetch]); // ← stableRefetch added

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

  // ─────────────────────────────────────────
  // FIX 2: updateTags — cookie batching + startTransition
  // BEFORE: 13 setCookie calls in a loop → 13 re-renders per filter change
  // AFTER:  1 cookie for all filter values + startTransition for dispatches
  // ─────────────────────────────────────────
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
        (updatedValues[key as keyof SelectedFilter] as any)?.length === 0
      ) {
        delete updatedJobFilter[key as keyof SelectedFilter];
      }
    }

    // FIX: Single cookie instead of 13 individual cookies
    setCookie(null, "allJobFilters", JSON.stringify(updatedValues), {
      maxAge: 30 * 24 * 60 * 60,
      path: "*",
    });

    setCookie(null, "jobMainFilters", JSON.stringify(updatedJobFilter), {
      maxAge: 24 * 60 * 60,
      path: "*",
    });

    // FIX: startTransition — non-urgent state updates batched together
    // These don't need to block the UI
    startTransition(() => {
      Object.keys(defaultSelectedFilter).forEach((key) => {
        dispatch(
          setPreJobFilters({
            key,
            value: updatedValues[key as keyof SelectedFilter],
          }),
        );
      });
      dispatch(setPreJobMainFilters(updatedJobFilter));
      setJobFilter(updatedJobFilter);
      setMainJobFilter(updatedJobFilter);
      setSelectedFilters(updatedValues);
      setMainFilters(updatedValues);
      if (displayNames) {
        setMainFilterDisplayNames(displayNames);
      }
    });
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
      const options = data.drivers.data.map((driver: any) => ({
        value: parseInt(driver.id),
        label: driver.full_name,
        data: driver,
      }));
      setDriverOptions(options);
    },
  });

  const handleDriverChange = useCallback((selectedOption: any) => {
    setSelectedDriver(selectedOption);
  }, []);

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

  const handleContextMenu = useCallback((e: React.MouseEvent, job: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, job });
  }, []);

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
            handleExport={() => {
              // TODO: implement export
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
                        delete newSelectedFilters[filterKey as keyof SelectedFilter];
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

        {isAdmin && (
          <ActionBar
            {...({
              selectedDriver,
              selectedJobs,
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
              }}
            />
          )}
        </Suspense>

        {/* ─────────────────────────────────────────
            FIX 3: AssignJobsModal — mount only when isAssignOpen is true
            BEFORE: Always mounted from page load → Apollo hooks + DOM in memory always
            AFTER:  Mounts only on first driver assign click → faster initial load
            ───────────────────────────────────────── */}
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
            setSelectedJobs={setSelectedJobs}
            setIsChecked={setIsChecked}
            rangeDate={rangeDate}
          />
        )}
      </Box>
    </AdminLayout>
  );
}