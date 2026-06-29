// @ts-nocheck
// PreJobPaginationTable.tsx — PERFORMANCE FIXED
// Key fixes:
//   1. DataRow extracted to React.memo — only clicked row re-renders (not all 100)
//   2. OptimisticCheckbox extracted to React.memo — instant visual feedback
//   3. DriverHeaderRow extracted to React.memo — never re-renders on checkbox click
//   4. Per-row version counter (rowVersions) replaces global forceUpdate
//   5. BUG FIX: row.id key (not index) — correct row highlight on click
//   6. BUG FIX: selectionOrderRef — correct order in bulk screen

import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Link,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { faTrashAlt } from "@fortawesome/pro-light-svg-icons";
import {
  faDownload,
  faEye,
  faMessageLines,
  faPen,
} from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import { SortAlt } from "components/icons/Icons";
import { formatCurrency, formatDate, formatToTimeDate } from "helpers/helper";
import { useRouter } from "next/router";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import {
  Column,
  PluginHook,
  TableOptions,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
} from "react-table";

import { getTimeslotBgColor } from "./JobPaginationTable";

// ─── Constants ────────────────────────────────────────────────────────────────
const EXCLUDED_IDS = new Set([
  "actions",
  "admin_notes",
  "timeslot",
  "job_destinations.address",
]);

const isInteractive = (el: HTMLElement | null): boolean =>
  !!el?.closest(
    'a,button,[role="button"],input,textarea,select,[contenteditable="true"],[data-no-row-toggle]',
  );

const getStatusStyle = (status: string) => {
  const st = status?.toLowerCase();
  if (st === "in transit") return { background: "#FFD580", color: "#8B4000" };
  if (st === "assigned") return { background: "#FFFACD", color: "#665c00" };
  if (["completed", "delivered"].includes(st)) return { background: "#d4edda", color: "#155724" };
  if (["rejected", "cancelled"].includes(st)) return { background: "#f8d7da", color: "#721c24" };
  return {};
};

// ─── DriverHeaderRow ──────────────────────────────────────────────────────────
// memo: never re-renders when checkboxes change
const DriverHeaderRow = memo(({
  driver,
  columnsLength,
  onAssignClick,
}: {
  driver: any;
  columnsLength: number;
  onAssignClick?: (driver: any) => void;
}) => (
  <Tr>
    <Td colSpan={columnsLength} p={0}>
      <Box
        bg={driver.bgcolor === "blue" ? "rgb(29, 45, 83)" : "rgb(250, 220, 82)"}
        color={driver.bgcolor === "yellow" ? "#000" : "#fff"}
        px={6} py={3}
        borderTop="4px solid" borderLeft="4px solid"
        borderColor="#2F80ED"
        borderRadius="md" w="100%"
      >
        <VStack align="start" spacing={3} w="full">
          <Flex direction="column" align="start" wrap="wrap" gap={3} w="full">
            <Flex wrap="wrap" align="start" gap={3}>
              <Badge colorScheme="Darkblue" variant="subtle" fontSize="md" style={{ marginRight: "10px" }}>
                #{driver.id} : {driver.full_name}
              </Badge>
              <Badge colorScheme="purple" variant="subtle" fontSize="md">
                First Collection: {formatToTimeDate(driver.first_job_start_at_today)}
              </Badge>
              <Badge colorScheme="purple" variant="subtle" fontSize="md">
                Last Delivery: {formatToTimeDate(driver.last_job_drop_at_today)}
              </Badge>
              {driver.bgcolor === "yellow" && (
                <Button
                  type="button" px={5} py={1} colorScheme="blue" fontSize="sm"
                  onClick={(e) => { e.stopPropagation(); onAssignClick?.(driver); }}
                >
                  Assign Jobs
                </Button>
              )}
              {driver.bgcolor === "blue" && (
                <>
                  <Badge colorScheme="red" variant="subtle" fontSize="sm">
                    Today Price: {driver.total_jobs_today_price ?? 0}
                  </Badge>
                  <Badge colorScheme="red" variant="subtle" fontSize="sm">
                    Weekly Price: {driver.total_jobs_weekly_price ?? 0}
                  </Badge>
                </>
              )}
            </Flex>
          </Flex>
          <Flex wrap="wrap" align="start" gap={3} w="full">
            <Badge colorScheme="red" variant="subtle" fontSize="sm">Current Suburb: {driver.current_suburb || "-"}</Badge>
            <Badge colorScheme="red" variant="subtle" fontSize="sm">Mobile Number: {driver.phone_no || "-"}</Badge>
            <Badge colorScheme="red" variant="subtle" fontSize="sm">Rego: {driver.registration_no ?? "-"}</Badge>
            <Badge colorScheme="red" variant="subtle" fontSize="sm">TAILGATE: {driver.is_tailgated ? "Yes" : "No"}</Badge>
            <Badge colorScheme="blue" variant="subtle" fontSize="sm">
              CBM: {driver.cbm_summary_today ?? 0} / {driver.no_max_volume ?? 0}
            </Badge>
            <Badge colorScheme="blue" variant="subtle" fontSize="sm">
              Weight: {driver.weight_summary_today ?? 0} / {driver.no_max_capacity ?? 0}
            </Badge>
            <Badge colorScheme="blue" variant="subtle" fontSize="sm">Pallets: {driver.no_max_pallets ?? 0}</Badge>
          </Flex>
        </VStack>
      </Box>
    </Td>
  </Tr>
));
DriverHeaderRow.displayName = "DriverHeaderRow";

// ─── OptimisticCheckbox ───────────────────────────────────────────────────────
// memo: re-renders ONLY when isSelected changes for this specific row
const OptimisticCheckbox = memo(({ isSelected }: { isSelected: boolean }) => (
  <Box pointerEvents="none">
    <Box
      boxSize="16px"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="2px"
      bg={isSelected ? "blue.500" : "white"}
      position="relative"
    >
      {isSelected && (
        <Box
          position="absolute" inset="2px" bg="white"
          clipPath="polygon(14% 44%, 0 59%, 44% 100%, 100% 36%, 86% 22%, 44% 64%)"
        />
      )}
    </Box>
  </Box>
));
OptimisticCheckbox.displayName = "OptimisticCheckbox";

// ─── DataRow ──────────────────────────────────────────────────────────────────
// memo: ONLY re-renders when isSelected changes for THIS specific row
// Other rows stay frozen — this is the main performance fix
const DataRow = memo(({
  row,
  columns,
  isSelected,
  showRowSelection,
  restyleTable,
  path,
  onContextMenu,
  onToggle,
  onDelete,
}: {
  row: any;
  columns: any[];
  isSelected: boolean;
  showRowSelection: boolean;
  restyleTable: boolean;
  path?: string;
  onContextMenu?: (e: React.MouseEvent, job: any) => void;
  onToggle: (rowId: string) => void;
  onDelete?: (id: any) => void;
}) => {
  const router = useRouter();
  const status = row.original?.job?.job_status?.name;

  const handleRowClick = useCallback((e: React.MouseEvent) => {
    if (!showRowSelection) return;
    const target = e.target as HTMLElement;
    if (isInteractive(target)) return;
    const td = target.closest("td");
    const colId = td?.getAttribute("data-column-id") || "";
    if (EXCLUDED_IDS.has(colId)) return;
    onToggle(row.id);
  }, [showRowSelection, onToggle, row.id]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (onContextMenu) onContextMenu(e, row.original.job);
  }, [onContextMenu, row.original.job]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (showRowSelection) onToggle(row.id);
  }, [showRowSelection, onToggle, row.id]);

  return (
    <Tr
      {...row.getRowProps()}
      style={getStatusStyle(status)}
      cursor={showRowSelection ? "pointer" : "default"}
      onContextMenu={handleContextMenu}
      onClick={handleRowClick}
    >
      {row?.cells?.map((cell: any, cellIndex: number) => {
        // ── Selection checkbox ──
        if (cell.column.id === "selection") {
          return (
            <Td
              {...cell.getCellProps({ "data-column-id": "selection" })}
              key={`sel-${row.id}-${cellIndex}`}
              onClick={handleCheckboxClick}
              cursor="pointer"
              fontSize="xx-small"
            >
              <OptimisticCheckbox isSelected={isSelected} />
            </Td>
          );
        }

        // ── Actions column ──
        if (cell.column.Header === "Actions") {
          return (
            <Td key={`act-${row.id}-${cellIndex}`} data-column-id="actions">
              <Flex gap={2} wrap="wrap" align="center">
                {cell.column.isDownload && (
                  <Link href={cell.value} target="_blank" fontWeight="700"
                    data-no-row-toggle onClick={(e) => e.stopPropagation()}>
                    <Button bg="white" fontSize="sm" className="!text-[var(--chakra-colors-black-400)]">
                      <FontAwesomeIcon icon={faDownload} size="lg" className="!text-[var(--chakra-colors-black-400)]" />
                    </Button>
                  </Link>
                )}
                {(cell.column.isEdit == undefined || cell.column.isEdit) && (
                  <Link href={`${path || router.pathname}/${cell.row.original.job.id}`}
                    fontWeight="700" data-no-row-toggle onClick={(e) => e.stopPropagation()}>
                    <Button bg="white" fontSize="sm" className="!text-[var(--chakra-colors-black-400)]">
                      <FontAwesomeIcon icon={faPen} size="lg" className="!text-[var(--chakra-colors-black-400)]" />
                    </Button>
                  </Link>
                )}
                {cell.column.isView && (
                  <Link href={`${path || router.pathname}/${cell.row.original.job.id}`}
                    fontWeight="700" data-no-row-toggle onClick={(e) => e.stopPropagation()}>
                    <Button bg="white" fontSize="sm" className="!text-[var(--chakra-colors-black-400)]">
                      <FontAwesomeIcon icon={faEye} size="lg" className="!text-[var(--chakra-colors-black-400)]" />
                    </Button>
                  </Link>
                )}
                {cell.column.isTracking && (
                  <Link href={`${path || router.pathname}/tracking/${cell.row.original.job.id}`}
                    fontWeight="700" data-no-row-toggle onClick={(e) => e.stopPropagation()}>
                    <Button bg="white" fontSize="sm" className="!text-[#3B68DB]">Track</Button>
                  </Link>
                )}
                {cell.column.isDelete && (
                  <Button bg="white" fontSize="sm" className="!text-[var(--chakra-colors-black-400)]"
                    onClick={() => onDelete?.(cell.row.original.job.id)}>
                    <FontAwesomeIcon
                      icon={cell.column.deleteIcon != undefined ? cell.column.deleteIcon : faTrashAlt}
                      size="lg" className="!text-[var(--chakra-colors-black-400)]"
                    />
                  </Button>
                )}
              </Flex>
            </Td>
          );
        }

        // ── Instructions column ──
        if (cell.column.Header === "Instructions") {
          return (
            <Td
              {...cell.getCellProps({ "data-column-id": cell.column.id })}
              key={`ins-${row.id}-${cellIndex}`}
              paddingLeft={restyleTable && 1} paddingInlineStart={restyleTable && 1}
              paddingRight={restyleTable && 2} paddingInlineEnd={restyleTable && 2}
            >
              <Tooltip
                aria-label="A tooltip"
                label={
                  <div className="text-xs">
                    <p className="mb-2"><strong>Pick up Person: </strong>{row.original?.pick_up_name || "N/A"}</p>
                    <p><strong>Instructions: </strong>{row.original?.pick_up_notes || "N/A"}</p>
                  </div>
                }
              >
                <FontAwesomeIcon
                  icon={faMessageLines}
                  size="lg"
                  className="!text-[var(--chakra-colors-black-400)] hover:!text-[var(--chakra-colors-primary-400)]"
                  data-no-row-toggle
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Td>
          );
        }

        // ── Default column ──
        return (
          <Td
            {...cell.getCellProps({ "data-column-id": cell.column.id })}
            key={`def-${row.id}-${cellIndex}`}
            paddingLeft={restyleTable && 1} paddingInlineStart={restyleTable && 1}
            paddingRight={restyleTable && 2} paddingInlineEnd={restyleTable && 2}
            pr="20px"
            bg={
              cell.column.id === "timeslot" &&
                !["6", "7", "8", "9", "10"].includes(row?.original?.job?.job_status?.id)
                ? (getTimeslotBgColor(row?.original?.job?.timeslot) ?? "transparent")
                : cell.column.id === "total_weight"
                  ? (row.original?.job?.weight_color ?? "transparent")
                  : cell.column.id === "total_volume"
                    ? (row.original?.job?.volume_color ?? "transparent")
                    : undefined
            }
          >
            {cell.column.type === "date" ? (
              <Text>{cell.value ? formatDate(cell.value, "DD/MM/YYYY") : "-"}</Text>
            ) : cell.column.type === "money" ? (
              <Text>{cell.value ? formatCurrency(cell.value) : "$0"}</Text>
            ) : cell.column.type === "boolean" ? (
              <Text>
                {cell.value == true
                  ? cell.column.trueLabel || "Yes"
                  : cell.column.falseLabel || "No"}
              </Text>
            ) : (
              cell.render("Cell")
            )}
            {cell.column.showCompany == true && (
              <Text className="text-gray-400">{row.original.company?.name}</Text>
            )}
          </Td>
        );
      })}
    </Tr>
  );
});
DataRow.displayName = "DataRow";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaginationTableProps<T extends object> = {
  columns: Column<T>[];
  data: T[];
  total: number;
  options?: Omit<TableOptions<T>, "data" | "columns">;
  plugins?: PluginHook<T>[];
  path?: string;
  showDelete?: boolean;
  onDelete?: (data: any) => void;
  showPageSizeSelect?: boolean;
  showManualPages?: boolean;
  isChecked?: boolean | number;
  onSortingChange?: any;
  onAssignClick?: (driver: any) => void;
  restyleTable?: boolean;
  refetchJobs?: () => void;
  onContextMenu?: (e: React.MouseEvent, job: any) => void;
} & (
    | { isServerSide?: false; setQueryPageIndex?: never; setQueryPageSize?: never }
    | {
      isServerSide: true;
      setQueryPageIndex: React.Dispatch<React.SetStateAction<number>>;
      setQueryPageSize: React.Dispatch<React.SetStateAction<number>>;
    }
  ) & (
    | { showRowSelection?: false; setSelectedRow?: never; isFilterRowSelected?: never }
    | {
      showRowSelection: true;
      setSelectedRow: React.Dispatch<React.SetStateAction<any[]>>;
      isFilterRowSelected: boolean;
    }
  );

// ─── Main Table Component ─────────────────────────────────────────────────────
const PaginationTable = <T extends object>({
  columns,
  data,
  total,
  isServerSide = false,
  options,
  plugins = [],
  _showDelete = false,
  setQueryPageIndex,
  setQueryPageSize,
  path,
  showPageSizeSelect = false,
  showRowSelection = false,
  isFilterRowSelected = false,
  setSelectedRow,
  isChecked,
  onSortingChange,
  onAssignClick,
  restyleTable = false,
  onContextMenu,
  onDelete,
}: PaginationTableProps<T>) => {

  const pageSizeOptions = [
    { value: 10, label: "10 / page" },
    { value: 30, label: "30 / page" },
    { value: 50, label: "50 / page" },
    { value: 100, label: "100 / page" },
    { value: 150, label: "150 / page" },
    { value: 200, label: "200 / page" },
  ];

  const {
    getTableProps, getTableBodyProps, headerGroups,
    prepareRow, page,
    canPreviousPage, canNextPage, nextPage, previousPage, setPageSize,
    state: { pageIndex, pageSize, sortBy },
    selectedFlatRows,
    toggleAllRowsSelected,
  } = useTable<T>(
    {
      ...options,
      columns,
      data,
      autoResetSelectedRows: false,
      autoResetSortBy: false,
      disableSortRemove: true,
      getRowId: (row: any, index: number) =>
        row?.job?.id ? row.job.id.toString() : `row-${index}`,
    },
    useSortBy,
    usePagination,
    ...plugins,
    useRowSelect,
  );

  // ─── Selection state ───────────────────────────────────────────────────────
  // ✅ FIX: optimisticSelRef in a ref (not state) — no re-renders when updated
  const optimisticSelRef = useRef<Map<string, boolean>>(new Map());

  // ✅ FIX: Per-row version counter — only the toggled row gets a new key
  // → React.memo on DataRow skips all other rows
  const [rowVersions, setRowVersions] = useState<Record<string, number>>({});

  // ✅ BUG FIX: track selection order for correct bulk modal order
  const selectionOrderRef = useRef<string[]>([]);

  const getOptimisticSelected = useCallback((rowId: string): boolean => {
    const v = optimisticSelRef.current.get(rowId);
    return typeof v === "boolean" ? v : false;
  }, []);

  // ✅ FIX: toggleRow only bumps ONE row's version → only that DataRow re-renders
  const toggleRow = useCallback((rowId: string) => {
    const next = !optimisticSelRef.current.get(rowId);
    optimisticSelRef.current.set(rowId, next);

    // Track click order
    if (next) {
      if (!selectionOrderRef.current.includes(rowId)) {
        selectionOrderRef.current.push(rowId);
      }
    } else {
      selectionOrderRef.current = selectionOrderRef.current.filter(
        (id) => id !== rowId,
      );
    }

    // Bump only this row's version
    setRowVersions((prev) => ({ ...prev, [rowId]: (prev[rowId] ?? 0) + 1 }));

    // Sync react-table internal state
    const tableRow = page.find((r: any) => r.id === rowId);
    if (tableRow) tableRow.toggleRowSelected(next);
  }, [page]);

  // Sync optimistic map when react-table resets rows
  useEffect(() => {
    const selectedIds = new Set(selectedFlatRows.map((r: any) => r.id));
    optimisticSelRef.current.forEach((val, key) => {
      if (val && !selectedIds.has(key)) {
        optimisticSelRef.current.delete(key);
      }
    });
  }, [selectedFlatRows]);

  // Pass sorted rows to parent
  useEffect(() => {
    if (!showRowSelection) return;
    const orderMap = new Map(
      selectionOrderRef.current.map((id, i) => [id, i]),
    );
    const sorted = [...selectedFlatRows].sort((a: any, b: any) => {
      const ai = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
      const bi = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
      return ai - bi;
    });
    setSelectedRow?.(sorted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFlatRows]);

  useEffect(() => {
    if (isServerSide && setQueryPageIndex && setQueryPageSize) {
      setQueryPageIndex(pageIndex);
      setQueryPageSize(pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isServerSide, pageIndex, pageSize]);

  useEffect(() => {
    if (onSortingChange) onSortingChange(sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // ✅ isChecked → clear all (useRef trick: no warning, no loop)
  const toggleAllRowsSelectedRef = useRef(toggleAllRowsSelected);
  useEffect(() => {
    toggleAllRowsSelectedRef.current = toggleAllRowsSelected;
  });

  useEffect(() => {
    toggleAllRowsSelectedRef.current(false);
    optimisticSelRef.current.clear();
    selectionOrderRef.current = [];
    setRowVersions({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecked]);

  // ─── Visible rows ──────────────────────────────────────────────────────────
  const pageRows = useMemo(() => {
    const rows = [...page];
    if (isFilterRowSelected) {
      return rows.filter((r: any) => optimisticSelRef.current.get(r.id) === true);
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isFilterRowSelected]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <VStack w="full" align="start" spacing={4}>
      <Table colorScheme="white" {...getTableProps()}>
        <Thead>
          {headerGroups.map((headerGroup: any, index: number) => (
            <Tr {...headerGroup.getHeaderGroupProps()} key={`header-row-${index}`}>
              {headerGroup.headers.map((column: any) => (
                <Th
                  {...column.getHeaderProps(
                    column.enableSorting ? column.getSortByToggleProps() : undefined,
                  )}
                  key={`row-header-${column.id}`}
                  paddingLeft={restyleTable && 1}
                  paddingInlineStart={restyleTable && 1}
                  paddingRight={restyleTable && 2}
                  paddingInlineEnd={restyleTable && 2}
                >
                  {column.render("Header")}
                  {column.enableSorting && (
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc ? "↓" : "↑"
                        : <SortAlt size={16} style={{ transform: "rotate(180deg)" }} />
                      }
                    </span>
                  )}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {pageRows.map((row: any, index: number) => {
            prepareRow(row);

            const driver = row.original?.driver;
            const prevDriver = pageRows[index - 1]?.original?.driver;

            // ✅ BUG FIX: correct shouldShowDriverHeader check
            const shouldShowDriverHeader =
              !!driver?.full_name &&
              (!prevDriver?.full_name ||
                driver?.id !== prevDriver?.id ||
                driver?.bgcolor !== prevDriver?.bgcolor);

            return (
              // ✅ BUG FIX: key uses row.id not index
              // When driver header rows insert, index shifts → wrong row gets highlighted
              // row.id is always the job id → always correct
              <React.Fragment key={`fragment-${row.id}`}>
                {shouldShowDriverHeader && (
                  <DriverHeaderRow
                    driver={driver}
                    columnsLength={columns.length}
                    onAssignClick={onAssignClick}
                  />
                )}
                {/*
                  ✅ KEY FIX: key includes rowVersions[row.id]
                  When checkbox clicked: only that row's version bumps
                  → only that DataRow re-renders
                  → all other 99 rows are skipped by React.memo
                */}
                <DataRow
                  key={`row-${row.id}-${rowVersions[row.id] ?? 0}`}
                  row={row}
                  columns={columns}
                  isSelected={getOptimisticSelected(row.id)}
                  showRowSelection={showRowSelection}
                  restyleTable={restyleTable}
                  path={path}
                  onContextMenu={onContextMenu}
                  onToggle={toggleRow}
                  onDelete={onDelete}
                />
              </React.Fragment>
            );
          })}
        </Tbody>
      </Table>

      {/* Pagination Controls */}
      <HStack w="full" justify="space-between">
        {!isFilterRowSelected && showPageSizeSelect && (
          <Select
            isSearchable={false}
            size="sm"
            maxW="70px"
            value={pageSizeOptions.find((o) => o.value == pageSize)}
            onChange={(e) => setPageSize(Number(e.value))}
            options={pageSizeOptions}
            classNamePrefix="chakra-react-select"
            menuPosition="fixed"
          />
        )}
        {!isFilterRowSelected && (
          <>
            <Text>
              Showing {pageIndex * pageSize + 1} to {(pageIndex + 1) * pageSize} of {total} entries
            </Text>
            <ButtonGroup isAttached variant="outline">
              <IconButton
                aria-label="Go to previous page"
                icon={<HiChevronLeft />}
                isDisabled={!canPreviousPage}
                onClick={() => previousPage()}
              />
              <IconButton
                aria-label="Go to next page"
                icon={<HiChevronRight />}
                isDisabled={!canNextPage}
                onClick={() => nextPage()}
              />
            </ButtonGroup>
          </>
        )}
      </HStack>
    </VStack>
  );
};

export default PaginationTable;