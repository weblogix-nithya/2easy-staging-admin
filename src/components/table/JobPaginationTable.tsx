// @ts-nocheck
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
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { faEye, faPen } from "@fortawesome/pro-regular-svg-icons";
import { faMessageLines } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import { SortAlt } from "components/icons/Icons";
import {
  formatCurrency,
  formatDate,
  formatToTimeDate,
  getTimeDifferenceInMinutes,
} from "helpers/helper";
import { useRouter } from "next/router";
import React, { useEffect, useRef } from "react";
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
import { RootState } from "store/store";

// Non-toggle column ids
const EXCLUDED_IDS = new Set([
  "actions",
  "admin_notes",
  "timeslot",
  "job_destinations.address",
]);

// Click landed on a control? then don't toggle the row.
const isInteractive = (el: HTMLElement | null): boolean =>
  !!el?.closest(
    'a,button,[role="button"],input,textarea,select,[contenteditable="true"],[data-no-row-toggle]',
  );

export const isAdmin = (state: RootState) => state.user.isAdmin;
export const isCustomer = (state: RootState) => state.user.isCustomer;

const getStatusStyle = (status: string) => {
  const st = status?.toLowerCase();

  if (st === "in transit") {
    return { background: "#FFD580", color: "#8B4000" }; // brighter orange
  }

  if (st === "assigned") {
    return { background: "#FFFACD", color: "#665c00" }; // light lemon yellow
  }

  if (["completed", "delivered"].includes(st)) {
    return { background: "#d4edda", color: "#155724" }; // green
  }

  if (["rejected", "cancelled"].includes(st)) {
    return { background: "#f8d7da", color: "#721c24" }; // red
  }

  return {};
};

export const getTimeslotBgColor = (time: string | null | undefined) => {
  const diffMinutes = getTimeDifferenceInMinutes(time);

  if (diffMinutes === null) return "transparent";

  // const diffHours = diffMinutes / 60;

  if (diffMinutes <= 60) return "#e63a49"; //red
  if (diffMinutes <= 120) return "#ff7f00"; //orange
  return "#00ff00"; //green
};

type PaginationTableProps<T extends object> = {
  columns: Column<T>[];
  data: T[];
  total: number;
  options?: Omit<TableOptions<T>, "data" | "columns">;
  plugins?: PluginHook<T>[];
  path?: string;
  showDelete?: boolean;
  showPageSizeSelect?: boolean;
  showManualPages?: boolean;
  isChecked?: boolean;
  onSortingChange?: any;
  restyleTable?: boolean;
  editingDriverId: number | null;
  setEditingDriverId: React.Dispatch<React.SetStateAction<number | null>>;
  freeTextValue?: string;
  savingDriverId?: number | null;
  setSavingDriverId?: React.Dispatch<React.SetStateAction<number | null>>;
  setFreeTextValue?: React.Dispatch<React.SetStateAction<string>>;
  onContextMenu?: (event: React.MouseEvent, rowData: any) => void;
  onUpdateDriverFreeText?: (driver: any, value: string) => Promise<void>;
} & (
    | {
      isServerSide?: false;
      setQueryPageIndex?: never;
      setQueryPageSize?: never;
    }
    | {
      isServerSide: true;
      setQueryPageIndex: React.Dispatch<React.SetStateAction<number>>;
      setQueryPageSize: React.Dispatch<React.SetStateAction<number>>;
    }
  ) &
  (
    | {
      showRowSelection?: false;
      setSelectedRow?: never;
      isFilterRowSelected?: never;
    }
    | {
      showRowSelection: true;
      setSelectedRow: React.Dispatch<React.SetStateAction<array>>;
      isFilterRowSelected: boolean;
    }
  );
const PaginationTable = <T extends object>({
  columns,
  data,
  total,
  isServerSide = false,
  options,
  plugins = [],
  setQueryPageIndex,
  setQueryPageSize,
  path,
  showPageSizeSelect = false,
  // showManualPages = false,
  showRowSelection = false,
  isFilterRowSelected = false,
  setSelectedRow,
  isChecked,
  onSortingChange,
  restyleTable = false,
  onContextMenu,
  editingDriverId,
  setEditingDriverId,
  setFreeTextValue,
  savingDriverId,
  setSavingDriverId,
  onUpdateDriverFreeText,
}: // restyleTable = false,
  // autoResetSelectedRows= false,
  PaginationTableProps<T>) => {
  const router = useRouter();
  // const [pageRows, setPageRows] = useState([]);

  const pageSizeOptions = [
    { value: 10, label: "10 / page" },
    { value: 30, label: "30 / page" },
    { value: 50, label: "50 / page" },
    { value: 100, label: "100 / page" },
    { value: 150, label: "150 / page" },
    { value: 200, label: "200 / page" },
  ];

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, sortBy },
    selectedFlatRows,
    // gotoPage,
    // pageCount,
    toggleAllRowsSelected,
    // autoResetSelectedRows
  } = useTable<T>(
    {
      ...options,
      columns,
      data,
      autoResetSelectedRows: false,
    },
    useSortBy,
    usePagination,
    ...plugins,
    useRowSelect,
  );
  const freeTextRef = useRef<HTMLTextAreaElement>(null);

  const optimisticSelRef = React.useRef<Map<string, boolean>>(new Map());
  const [, force] = React.useState(0);
  const forceUpdate = () => force((x) => x + 1);

  useEffect(() => {
    if (optimisticSelRef.current.size) {
      optimisticSelRef.current.clear();
      // no need to force here; next render will show real state anyway
    }
  }, [selectedFlatRows]);
  function getOptimisticSelected(row: any) {
    const v = optimisticSelRef.current.get(row.id);
    return typeof v === "boolean" ? v : row.isSelected;
  }

  function toggleOptimisticRow(row: any) {
    const next = !getOptimisticSelected(row);
    optimisticSelRef.current.set(row.id, next); // flip instantly
    forceUpdate(); // paint now
    row.toggleRowSelected(next); // real react-table state
  }

  // useEffect(() => {
  //   console.log("Page rows changed:", pageRows.map((r) => r.original?.job?.name));
  // }, [pageRows]);

  useEffect(() => {
    if (isServerSide && setQueryPageIndex && setQueryPageSize) {
      setQueryPageIndex(pageIndex);
      setQueryPageSize(pageSize);
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isServerSide, pageIndex, pageSize, setQueryPageIndex, setQueryPageSize]);

  useEffect(() => {
    if (showRowSelection) {
      setSelectedRow(selectedFlatRows);
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, showRowSelection, setSelectedRow, selectedFlatRows]);

  // const pageRows = useMemo(() => {
  //   return isFilterRowSelected ? page.filter((row) => row.isSelected) : page;
  //   //eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [page, isFilterRowSelected]);

  const pageRows = React.useMemo(
    () => (isFilterRowSelected ? page.filter((row) => row.isSelected) : page),
    [page, isFilterRowSelected]
  );

  useEffect(() => {
    if (onSortingChange) onSortingChange(sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  useEffect(() => {
    if (!isChecked) toggleAllRowsSelected(isChecked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecked]);

  return (
    <VStack w="full" align="start" spacing={4}>
      <Table colorScheme="simple" {...getTableProps()}>
        <Thead>
          {headerGroups.map((headerGroup, index) => (
            <Tr
              {...headerGroup.getHeaderGroupProps()}
              key={`header-row-${index}`}
            >
              {headerGroup.headers.map((column) => (
                <Th
                  {...column.getHeaderProps(
                    column.enableSorting
                      ? column.getSortByToggleProps()
                      : undefined,
                  )}
                  {...column.getHeaderProps()}
                  key={`row-header-${column.id}`}
                  paddingLeft={restyleTable && 1}
                  paddingInlineStart={restyleTable && 1}
                  paddingRight={restyleTable && 2}
                  paddingInlineEnd={restyleTable && 2}
                >
                  {restyleTable}
                  {column.render("Header")}
                  {column.enableSorting && (
                    <span>
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          "↓"
                        ) : (
                          "↑"
                        )
                      ) : (
                        <SortAlt
                          size={16}
                          style={{ transform: "rotate(180deg)" }}
                        />
                      )}
                    </span>
                  )}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {pageRows.map((row, index) => {
            // console.log(row, "row one");
            prepareRow(row);
            const status = row.original?.job?.job_status?.name;

            const driver = row.original.driver;
            const prevDriver = pageRows[index - 1]?.original?.driver;

            const shouldShowDriverHeader =
              !!driver?.full_name &&
              (!prevDriver?.full_name || driver?.id !== prevDriver?.id);

            return (
              <React.Fragment key={`driver-header-${index}`}>
                {shouldShowDriverHeader && (
                  <Tr>
                    <Td fontSize="md" colSpan={columns.length} p={0}>
                      <Box
                        bg="#1d2d53"
                        color="#fff"
                        px={6}
                        py={3}
                        borderTop="4px solid"
                        borderLeft="4px solid"
                        borderColor="#2F80ED"
                        borderRadius="md"
                        w="100%"
                      >
                        <VStack align="start" spacing={3} w="full">
                          {/* --- DRIVER HEADER --- */}
                          {/* === ROW 1 === */}
                          <Flex
                            w="100%"
                            align="center"
                            justify="space-between"
                            gap={4}
                          >
                            {/* LEFT SIDE */}
                            <Flex align="center" gap={3} wrap="wrap">
                              <Badge
                                colorScheme="darkblue"
                                variant="subtle"
                                fontSize="md"
                              >
                                Driver: {driver.full_name} — {driver.driver_no}
                              </Badge>
                              <Badge
                                colorScheme="purple"
                                variant="subtle"
                                fontSize="md"
                              >
                                First Collection:{" "}
                                {formatToTimeDate(
                                  driver.first_job_start_at_today,
                                )}
                              </Badge>

                              <Badge
                                colorScheme="purple"
                                variant="subtle"
                                fontSize="md"
                              >
                                Last Delivery:{" "}
                                {formatToTimeDate(
                                  driver.last_job_drop_at_today,
                                )}
                              </Badge>
                            </Flex>

                            {/* CENTER (FREETEXT) */}
                            <Flex mx="auto" minW="0">
                              {editingDriverId === driver.id ? (
                                <Box w="460px">
                                  {" "}
                                  {/* slightly wider */}
                                  <Textarea
                                    size="sm"
                                    // value={freeTextValue}
                                    // onChange={(e) =>
                                    //   setFreeTextValue(e.target.value)
                                    // }
                                    defaultValue={
                                      driver.today_free_text?.text || ""
                                    }
                                    ref={freeTextRef}
                                    placeholder="Enter driver notes"
                                    resize="none"
                                    fontSize="md"
                                    h="70px"
                                    minH="70px"
                                    w="460px"
                                    bg="gray.100" // light grey background
                                    color="red.600" // red text
                                    border="1px solid"
                                    borderColor="gray.300"
                                    _focus={{
                                      borderColor: "red.400",
                                      boxShadow: "none",
                                    }}
                                    _hover={{
                                      borderColor: "gray.400",
                                    }}
                                  />
                                  <HStack mt={1} justify="flex-end">
                                    <IconButton
                                      aria-label="Save"
                                      size="sm"
                                      colorScheme="green"
                                      icon={<span>✔</span>}
                                      isLoading={savingDriverId === driver.id}
                                      onClick={async () => {
                                        if (!onUpdateDriverFreeText) return;
                                        try {
                                          const value =
                                            freeTextRef.current?.value || "";
                                          setSavingDriverId(driver.id);
                                          await onUpdateDriverFreeText(
                                            driver,
                                            value.trim(),
                                          );
                                          setEditingDriverId(null);
                                        } finally {
                                          setSavingDriverId(null);
                                        }
                                      }}
                                    />

                                    <IconButton
                                      aria-label="Cancel"
                                      size="sm"
                                      colorScheme="red"
                                      icon={<span>✖</span>}
                                      onClick={() => setEditingDriverId(null)}
                                    />
                                  </HStack>
                                </Box>
                              ) : (
                                <>
                                  <Box
                                    w="460px"
                                    minH="70px"
                                    px={3}
                                    py={2}
                                    bg="gray.100" // light grey background
                                    color="red.600" // red text
                                    border="1px solid"
                                    borderColor="gray.300"
                                    borderRadius="md"
                                    size="md"
                                    fontSize="md"
                                    cursor="pointer"
                                    overflow="hidden"
                                    display="flex"
                                    alignItems="center"
                                    onClick={() => {
                                      setEditingDriverId(driver.id);
                                      setFreeTextValue(
                                        driver.today_free_text?.text || "",
                                      );
                                    }}
                                  >
                                    {driver?.today_free_text?.text?.trim()
                                      ? driver.today_free_text.text
                                      : "Click to add driver notes"}
                                  </Box>
                                </>
                              )}
                              {/* </Flex> */}
                            </Flex>

                            {/* RIGHT SIDE (ACTIONS) */}

                            {/* RIGHT SIDE */}
                            <Badge
                              colorScheme="red"
                              variant="subtle"
                              fontSize="md"
                            >
                              Driver Price:{" "}
                              {driver.total_jobs_today_price ?? "-"}
                            </Badge>
                          </Flex>

                          {/* --- DRIVER DETAILS --- */}
                          <Flex wrap="wrap" align="start" gap={3} w="full">
                            <Badge
                              colorScheme="red"
                              variant="subtle"
                              fontSize="md"
                            >
                              Current Suburb: {driver.current_suburb ?? "-"}
                            </Badge>

                            <Badge
                              colorScheme="red"
                              variant="subtle"
                              fontSize="md"
                            >
                              Mobile Number: {driver.phone_no ?? "-"}
                            </Badge>

                            <Badge
                              colorScheme="red"
                              variant="subtle"
                              fontSize="md"
                            >
                              Rego: {driver.registration_no ?? "-"}
                            </Badge>

                            <Badge
                              colorScheme="red"
                              variant="subtle"
                              fontSize="md"
                            >
                              TAILGATE: {driver.is_tailgated ? "Yes" : "No"}
                            </Badge>
                            <Badge
                              colorScheme="blue"
                              variant="subtle"
                              fontSize="md"
                            >
                              CBM: {driver.cbm_summary_today ?? 0} /{" "}
                              {driver.no_max_volume ?? 0}
                            </Badge>

                            <Badge
                              colorScheme="blue"
                              variant="subtle"
                              fontSize="md"
                            >
                              Weight: {driver.weight_summary_today ?? 0} /{" "}
                              {driver.no_max_capacity ?? 0}
                            </Badge>

                            <Badge
                              colorScheme="blue"
                              variant="subtle"
                              fontSize="md"
                            >
                              Pallets: {driver.no_max_pallets ?? 0}
                            </Badge>
                          </Flex>
                        </VStack>
                      </Box>
                    </Td>
                  </Tr>
                )}
                <Tr
                  {...row.getRowProps()}
                  key={`data-row-${row.id || index}`}
                  style={getStatusStyle(status)}
                  cursor={showRowSelection ? "pointer" : "default"}
                  onContextMenu={(e) => {
                    if (onContextMenu) {
                      // ✅ Check if handler exists
                      onContextMenu(e, row.original.job);
                    }
                  }}
                  onClick={(e) => {
                    if (!showRowSelection) return;
                    const target = e.target as HTMLElement;
                    if (isInteractive(target)) return;
                    const td = target.closest("td");
                    const colId = td?.getAttribute("data-column-id") || "";
                    if (EXCLUDED_IDS.has(colId)) return;
                    toggleOptimisticRow(row); // instant
                  }}
                // className="css-en-xlrwr4"
                // onClick={
                //   isChecked ? () => row.toggleRowSelected() : undefined
                // }
                >
                  {row?.cells?.map((cell, index) => {
                    let data;
                    if (cell.column.id === "selection") {
                      return (
                        <Td
                          {...cell.getCellProps({
                            "data-column-id": "selection",
                          })}
                          key={`selection-${index}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!showRowSelection) return;
                            toggleOptimisticRow(row);
                          }}
                          cursor="pointer"
                        >
                          <Box pointerEvents="none">
                            {/* Render a visual checkbox using optimistic selected state */}
                            <HStack>
                              <Box
                                boxSize="16px"
                                border="1px solid"
                                borderColor="gray.300"
                                borderRadius="2px"
                                bg={
                                  getOptimisticSelected(row)
                                    ? "blue.500"
                                    : "white"
                                }
                                position="relative"
                              >
                                {getOptimisticSelected(row) && (
                                  <Box
                                    position="absolute"
                                    inset="2px"
                                    bg="white"
                                    clipPath="polygon(14% 44%, 0 59%, 44% 100%, 100% 36%, 86% 22%, 44% 64%)"
                                  />
                                )}
                              </Box>
                              {/* Optional: label */}
                            </HStack>
                          </Box>
                        </Td>
                      );
                    }

                    if (cell.column.Header === "Actions") {
                      data = (
                        <Td
                          fontSize="md"
                          key={`action-${index}`}
                          data-column-id="actions"
                        // paddingLeft={restyleTable && 1}
                        // paddingInlineStart={restyleTable && 1}
                        // paddingRight={restyleTable && 2}
                        // paddingInlineEnd={restyleTable && 2}
                        >
                          <Flex gap={2} wrap="wrap" align="center">
                            {
                              //@ts-expect-error
                              (cell.column.isEdit == undefined ||
                                //@ts-expect-error
                                cell.column.isEdit) && (
                                <Link
                                  href={`${path || router.pathname}/${cell.row.original.job.id
                                    }`}
                                  fontWeight="700"
                                  data-no-row-toggle
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    bg="white"
                                    fontSize="md"
                                    // fontWeight="500"
                                    className="!text-[var(--chakra-colors-black-400)]"
                                  // color={textColorSecondary}
                                  // borderRadius="7px"
                                  >
                                    <FontAwesomeIcon
                                      icon={faPen}
                                      className="!text-[var(--chakra-colors-black-400)]"
                                      size="lg"
                                    />
                                  </Button>
                                </Link>
                              )
                            }
                            {
                              //@ts-expect-error
                              cell.column.isView && (
                                <Link
                                  href={`${path || router.pathname}/${cell.row.original.job.id
                                    }`}
                                  fontWeight="700"
                                  data-no-row-toggle
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    // bg={boxBg}
                                    bg="white"
                                    fontSize="md"
                                    // fontWeight="500"
                                    className="!text-[var(--chakra-colors-black-400)]"
                                  // color={textColorSecondary}
                                  // borderRadius="7px"
                                  >
                                    <FontAwesomeIcon
                                      icon={faEye}
                                      className="!text-[var(--chakra-colors-black-400)]"
                                      size="lg"
                                    />
                                  </Button>
                                </Link>
                              )
                            }
                            {
                              //@ts-expect-error
                              cell.column.isTracking && (
                                <Link
                                  href={`${path || router.pathname}/tracking/${cell.row.original.job.id
                                    }`}
                                  fontWeight="700"
                                  data-no-row-toggle
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    // bg={boxBg}
                                    bg="white"
                                    fontSize="md"
                                    // fontWeight="500"
                                    className="!text-[#3B68DB]"
                                  // color={textColorSecondary}
                                  // borderRadius="7px"
                                  >
                                    Track
                                  </Button>
                                </Link>
                              )
                            }
                          </Flex>
                        </Td>
                      );
                    } else if (cell.column.Header === "Instructions") {
                      data = (
                        <Td
                          fontSize="md"
                          {...cell.getCellProps({
                            "data-column-id": cell.column.id,
                          })}
                          key={`instructions-${index}`}
                          paddingLeft={restyleTable && 1}
                          paddingInlineStart={restyleTable && 1}
                          paddingRight={restyleTable && 2}
                          paddingInlineEnd={restyleTable && 2}
                        >
                          <Tooltip
                            label={
                              <React.Fragment>
                                <div className="text-xs">
                                  <p className="mb-2">
                                    <strong>Pick up Person: </strong>
                                    {
                                      // @ts-expect-error
                                      row.original?.pick_up_name || "N/A"
                                    }
                                  </p>
                                  <p>
                                    <strong>Instructions: </strong>
                                    {
                                      // @ts-expect-error
                                      row.original?.pick_up_notes || "N/A"
                                    }
                                  </p>
                                </div>
                              </React.Fragment>
                            }
                            aria-label="A tooltip"
                          >
                            <FontAwesomeIcon
                              icon={faMessageLines}
                              className="!text-[var(--chakra-colors-black-400)] hover:!text-[var(--chakra-colors-primary-400)]"
                              size="lg"
                              data-no-row-toggle
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Tooltip>
                        </Td>
                      );
                    } else {
                      data = (
                        <Td
                          {...cell.getCellProps({
                            "data-column-id": cell.column.id,
                          })}
                          key={`default-${index}`}
                          paddingLeft={restyleTable && 1}
                          paddingInlineStart={restyleTable && 1}
                          paddingRight={restyleTable && 2}
                          paddingInlineEnd={restyleTable && 2}
                          pr="20px"
                          bg={
                            cell.column.id === "timeslot" &&
                              !["6", "7", "8", "9", "10"].includes(
                                row?.original?.job?.job_status?.id,
                              )
                              ? (getTimeslotBgColor(
                                row?.original?.job?.timeslot,
                              ) ?? "transparent")
                              : "transparent"
                          }
                        >
                          {
                            // @ts-expect-error
                            cell.column.type === "date" ? (
                              <Text>
                                {cell.value
                                  ? formatDate(cell.value, "DD/MM/YYYY")
                                  : "-"}
                              </Text>
                            ) : cell.column.type === "money" ? (
                              <Text>
                                {cell.value ? formatCurrency(cell.value) : "$0"}
                              </Text>
                            ) : cell.column.type === "boolean" ? (
                              <Text>
                                {cell.value == true
                                  ? cell.column.trueLabel || "Yes"
                                  : cell.column.falseLabel || "No"}
                              </Text>
                            ) : (
                              cell.render("Cell")
                            )
                          }
                          {cell.column.showCompany == true && (
                            <Text className="text-gray-400">
                              {row.original.company?.name}
                            </Text>
                          )}
                        </Td>
                      );
                    }
                    return data;
                  })}
                </Tr>
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
            value={pageSizeOptions.find((option) => option.value == pageSize)}
            onChange={(e) => setPageSize(Number(e.value))}
            options={pageSizeOptions}
            classNamePrefix="chakra-react-select"
            menuPosition="fixed"
          />
        )}

        {!isFilterRowSelected && (
          <>
            <Text>
              Showing {pageIndex * pageSize + 1} to {(pageIndex + 1) * pageSize}{" "}
              of {total} entries
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
