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
  defaultPreSelectedFilter,
  filterPreDisplayNames,
  preDefaultJobFilter,
  PreSelectedFilter,
} from "components/preAllocation/Filters";
import {
  cleanupLegacyFilterCookies,
  clearPersistedFilterState,
  writeDisplayName,
  writeIsTicked,
  writeMainFilter,
  writeSelectedValues,
} from "components/preAllocation/jobFilterCookies";
import ActionBar from "components/preAllocation/PreActionBar";
import {
  getBulkAssignColumns,
  getColumnsPre,
} from "components/preAllocation/PreJobTableColumns";
import { RemoveDriverProvider } from "components/preAllocation/RemoveDriverContext";
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
} from "store/preJobFilterSlice";
import { RootState } from "store/store";

import JobHeader from "../../../components/preAllocation/JobHeader";
import { useSubscriptionService } from "../../../utils/subscriptionService";

const JobStatusDateFilter = dynamic(
  () => import("../../../components/preAllocation/JobStatusDateFilter"),
  { ssr: false },
);

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
    (state: RootState) => state.preJobFilter,
  );

  const dispatch = useDispatch();
  const [withMedia, setWithMedia] = useState(false);
  const [isMediaBusy, setIsMediaBusy] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverOptions, setDriverOptions] = useState([]);
  const [isShowSelectedOnly, setIsShowSelectedOnly] = useState(false);
  const [clearCount, setClearCount] = useState(0);
  const clearAllRows = () => setClearCount(c => c + 1);
  const [jobFilter, setJobFilter] = useState(preDefaultJobFilter);
  const [mainJobFilter, setMainJobFilter] = useState(null);
  const [mainFilters, setMainFilters] = useState<any>(defaultPreSelectedFilter);
  const [selectedFilters, setSelectedFilters] = useState<PreSelectedFilter>(defaultPreSelectedFilter);
  const [mainFilterDisplayNames, setMainFilterDisplayNames] =
    useState<typeof filterPreDisplayNames>(filterPreDisplayNames);
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
    const merged =
      is_filter_ticked === "1"
        ? { ...baseVars, ...(mainJobFilter ?? {}) }
        : baseVars;
    return merged;
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

  // ✅ FIX: debounced — prevents all users hitting server simultaneously
  const debouncedRefetch = useMemo(
    () => debounce(() => refetchJobs(), 3000 + Math.random() * 2000),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refetchJobs],
  );
  useEffect(() => () => debouncedRefetch.cancel(), [debouncedRefetch]);

  const subscriptionEvents = useMemo(() => ({
    jobUpdated: { channel: "jobs", event: ".job.updated", callback: () => debouncedRefetch() },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [debouncedRefetch]);
  useSubscriptionService(subscriptionEvents);

  // ─────────────────────────────────────────
  // FIX 1: stableRefetch via useCallback
  // BEFORE: refetchJobs was missing from useMemo deps → stale closure
  //   columns always called the OLD refetchJobs function
  // ─────────────────────────────────────────
  const stableRefetch = useCallback(() => refetchJobs(), [refetchJobs]);

  // ✅ FIX: stable reference — prevents adminColumns recalc on every checkbox click
  const stableSetSelectedJobs = useCallback((rows: any) => {
    setSelectedJobs(rows);
  }, []);

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

  // One-time best-effort cleanup of pre-"_v2" filter cookies left over from
  // before the `path: "*"` bug was fixed. See jobFilterCookies.ts for why
  // this matters — those old cookies could otherwise sit alongside the new
  // ones indefinitely and cause unpredictable read results.
  useEffect(() => {
    cleanupLegacyFilterCookies();
  }, []);

  const bulkAssignColumns = useMemo(
    () => getBulkAssignColumns(isAdmin, isCustomer, dynamicTableUsers),
    [isAdmin, isCustomer, dynamicTableUsers],
  );

  useEffect(() => {
    // FIX: only run when filter is turned ON ("1")
    // When turned OFF, onToggleFilterCheckbox handles state clear directly
    // Calling updateTags here on OFF would cause: dispatch → re-render → this effect → loop
    if (is_filter_ticked !== "1") return;
    // ✅ FIX: `jobMainFilters` falls back to `preDefaultJobFilter` (an
    // object of empty arrays) when the cookie is missing/empty — that
    // fallback is truthy, so `!jobMainFilters` alone can't tell "cookie
    // never saved anything" apart from "cookie genuinely has real filter
    // values". Without this check, is_filter_ticked could restore to "1"
    // (its own cookie is separate and fine) while jobMainFilters quietly
    // carried no actual filter — checkbox shows ON, but no tag renders and
    // no filter reaches the query.
    const hasPersistedFilterValue =
      jobMainFilters &&
      Object.values(jobMainFilters).some((v) =>
        Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== "",
      );
    if (!hasPersistedFilterValue) return;

    const updatedValues: any = {};
    for (const key in defaultPreSelectedFilter) {
      if (
        filters[key as keyof PreSelectedFilter] !== undefined &&
        filters[key as keyof PreSelectedFilter] !== "undefined" &&
        filters[key as keyof PreSelectedFilter] !== ""
      ) {
        updatedValues[key] = filters[key as keyof PreSelectedFilter];
      }
    }
    setJobFilter(jobMainFilters);
    if (displayName) setMainFilterDisplayNames(displayName);
    updateTags(updatedValues, jobMainFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleResetAll = () => {
    updateTags({ ...defaultPreSelectedFilter }, preDefaultJobFilter);
  };

  const updateTags = (
    updatedValues: PreSelectedFilter,
    jobFilter: any,
    displayNames?: any,
  ) => {
    const updatedJobFilter = { ...jobFilter };

    for (const key in defaultPreSelectedFilter) {
      if (
        updatedValues[key as keyof PreSelectedFilter] === undefined ||
        updatedValues[key as keyof PreSelectedFilter] === null ||
        (updatedValues[key as keyof PreSelectedFilter] as any)?.length === 0
      ) {
        delete updatedJobFilter[key as keyof PreSelectedFilter];
      }
    }
    writeSelectedValues(updatedValues);
    writeMainFilter(updatedJobFilter);

    dispatch(setPreJobMainFilters(updatedJobFilter));
    setMainJobFilter(updatedJobFilter);

    Object.keys(defaultPreSelectedFilter).forEach((key) => {
      dispatch(
        setPreJobFilters({
          key,
          value: updatedValues[key as keyof PreSelectedFilter],
        }),
      );
    });
    setJobFilter(updatedJobFilter);
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
      first: 5000,
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
                // FIX: direct state clear — avoids handleResetAll() loop
                // handleResetAll → updateTags → dispatch → is_filter_ticked useEffect → updateTags again
                // Persistence lives in components/preAllocation/jobFilterCookies.tsx —
                // Pre-Allocation-only, localStorage-based, fully separate
                // from whatever Bulk Allocation uses.
                clearPersistedFilterState();
                setMainJobFilter(null);
                setJobFilter(preDefaultJobFilter);
                setMainFilters({ ...defaultPreSelectedFilter });
                setSelectedFilters({ ...defaultPreSelectedFilter });
                setMainFilterDisplayNames(filterPreDisplayNames);
              }
              writeIsTicked(checked);
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
                      {mainFilterDisplayNames[filterKey as keyof PreSelectedFilter]
                        .label +
                        ":" +
                        mainFilterDisplayNames[filterKey as keyof PreSelectedFilter]
                          .value}
                    </TagLabel>
                    <TagCloseButton
                      onClick={() => {
                        const newSelectedFilters = { ...mainFilters };
                        delete newSelectedFilters[filterKey as keyof PreSelectedFilter];
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
            <RemoveDriverProvider refetch={stableRefetch}>
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
                setSelectedRow={stableSetSelectedJobs}
                isFilterRowSelected={isShowSelectedOnly}
                isChecked={clearCount}
                showManualPages
                onSortingChange={handleSortingChange}
                onAssignClick={openAssignModal}
                restyleTable
                refetchJobs={refetchJobs}
                onContextMenu={handleContextMenu}
              />
            </RemoveDriverProvider>
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
                writeDisplayName(filterDisplayName);
                // FIX: applying filters from the modal must also turn the
                // filter checkbox ON — otherwise is_filter_ticked stays "0"
                // and the mount-time restore effect above (gated on
                // is_filter_ticked === "1") has nothing to trigger it on
                // the next page load, so the filter wouldn't survive a
                // refresh even though it was just correctly applied.
                writeIsTicked(true);
                dispatch(setIsPreFilterTicked("1"));
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
              setIsChecked={clearAllRows}
              setSelectedJobs={setSelectedJobs}
              refreshPage={() => {
                setSelectedJobs([]);
                setSelectedDriver(null);
                clearAllRows();
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
              setSelectedJobs([]);
              clearAllRows();
            }}
            driver={assignDriver}
            columns={bulkAssignColumns}
            setSelectedJobs={setSelectedJobs}
            setIsChecked={clearAllRows}
            rangeDate={rangeDate}
          />
        )}
      </Box>
    </AdminLayout>
  );
}