// @ts-nocheck
import {
  Button,
  ButtonGroup,
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
import { faDownload, faEye, faPen } from "@fortawesome/pro-regular-svg-icons";
import { faMessageLines } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import { SortAlt } from "components/icons/Icons";
import { formatCurrency, formatDate } from "helpers/helper";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
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

type PaginationTableProps<T extends object> = {
  columns: Column<T>[];
  data: T[];
  options?: Omit<TableOptions<T>, "data" | "columns">;
  plugins?: PluginHook<T>[];
  path?: string;
  showDelete?: boolean;
  onDelete?: (data: any) => void;
  showPageSizeSelect?: boolean;
  showManualPages?: boolean;
  isChecked?: boolean;
  onSortingChange?: any;
  restyleTable?: boolean;
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
  isServerSide = false,
  options,
  plugins = [],
  // showDelete = false,
  setQueryPageIndex,
  setQueryPageSize,
  onDelete,
  path,
  showPageSizeSelect = false,
  showManualPages = false,
  showRowSelection = false,
  isFilterRowSelected = false,
  setSelectedRow,
  isChecked,
  onSortingChange,
  restyleTable = false,
}: PaginationTableProps<T>) => {
  const router = useRouter();
  const [pageRows, setPageRows] = useState([]);

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
    gotoPage,
    pageCount,
    toggleAllRowsSelected,
    // toggleSortBy,
  } = useTable<T>(
    {
      ...options,
      columns,
      data,
    },
    useSortBy,
    usePagination,
    ...plugins,
    useRowSelect,
  );

  useEffect(() => {
    if (isServerSide && setQueryPageIndex && setQueryPageSize) {
      setQueryPageIndex(pageIndex);
      setQueryPageSize(pageSize);
    }
  }, [isServerSide, pageIndex, pageSize, setQueryPageIndex, setQueryPageSize]);

  useEffect(() => {
    if (showRowSelection) {
      setSelectedRow(selectedFlatRows);
    }

    if (!isFilterRowSelected) {
      setPageRows(page);
    } else {
      setPageRows(page.filter((row) => row.isSelected == true));
    }
  }, [
    page,
    isFilterRowSelected,
    showRowSelection,
    setSelectedRow,
    selectedFlatRows,
  ]);

  const renderPageNumbers = () => {
    const pages = [];
    const endPage = Math.min(pageIndex + 9, pageCount);
    for (let i = pageIndex; i <= endPage; i++) {
      pages.push(
        <Button onClick={() => gotoPage(i)} key={`page-index-${i}`}>
          {i + 1}
        </Button>,
      );
    }
    return pages;
  };

  useEffect(() => {
    if (onSortingChange) onSortingChange(sortBy);
  }, [sortBy,onSortingChange]);

  useEffect(() => {
    if (!isChecked) toggleAllRowsSelected(isChecked);
  }, [isChecked, toggleAllRowsSelected]);

  return (
    <VStack w="full" align="start" spacing={4}>
      <Table colorScheme="white" {...getTableProps()}>
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
          {pageRows?.map((row, index) => {
            prepareRow(row);
            return (
              <Tr
                {...row.getRowProps()}
                key={`row-${index}`}
                onClick={isChecked ? () => row.toggleRowSelected() : undefined}
              >
                {row?.cells?.map((cell, index) => {
                  let data;
                  if (cell.column.Header === "Actions") {
                    data = (
                      <Td
                        key={`action-${index}`}
                        paddingLeft={restyleTable && 1}
                        paddingInlineStart={restyleTable && 1}
                        paddingRight={restyleTable && 2}
                        paddingInlineEnd={restyleTable && 2}
                      >
                        {
                          //@ts-expect-error
                          cell.column.isDownload && (
                            <Link
                              href={cell.value}
                              target="_blank"
                              fontWeight="700"
                            >
                              <Button
                                // bg={boxBg}
                                bg="white"
                                fontSize="sm"
                                // fontWeight="500"
                                className="!text-[var(--chakra-colors-black-400)]"
                                // color={textColorSecondary}
                                // borderRadius="7px"
                              >
                                <FontAwesomeIcon
                                  icon={faDownload}
                                  className="!text-[var(--chakra-colors-black-400)]"
                                  size="lg"
                                />
                              </Button>
                            </Link>
                          )
                        }
                        {
                          //@ts-expect-error
                          (cell.column.isEdit == undefined ||
                            //@ts-expect-error
                            cell.column.isEdit) && (
                            <Link
                              href={`${path || router.pathname}/${cell.value}`}
                              fontWeight="700"
                            >
                              <Button
                                // bg={boxBg}
                                bg="white"
                                fontSize="sm"
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
                              href={`${path || router.pathname}/${cell.value}`}
                              fontWeight="700"
                            >
                              <Button
                                // bg={boxBg}
                                bg="white"
                                fontSize="sm"
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
                              href={`${path || router.pathname}/tracking/${
                                cell.value
                              }`}
                              fontWeight="700"
                            >
                              <Button
                                // bg={boxBg}
                                bg="white"
                                fontSize="sm"
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
                        {
                          //@ts-expect-error
                          cell.column.isDelete && (
                            <Button
                              // bg={boxBg}
                              bg="white"
                              fontSize="sm"
                              // fontWeight="500"
                              className="!text-[var(--chakra-colors-black-400)]"
                              onClick={() => {
                                onDelete(cell.row.original.id);
                              }}
                              // color={textColorSecondary}
                              // borderRadius="7px"
                            >
                              <FontAwesomeIcon
                                icon={
                                  cell.column.deleteIcon != undefined
                                    ? cell.column.deleteIcon
                                    : faTrashAlt
                                }
                                className="!text-[var(--chakra-colors-black-400)]"
                                size="lg"
                              />
                            </Button>
                          )
                        }
                      </Td>
                    );
                  } else if (cell.column.Header === "Instructions") {
                    data = (
                      <Td
                        {...cell.getCellProps()}
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
                          />
                        </Tooltip>
                      </Td>
                    );
                  } else {
                    data = (
                      <Td
                        {...cell.getCellProps()}
                        key={`default-${index}`}
                        paddingLeft={restyleTable && 1}
                        paddingInlineStart={restyleTable && 1}
                        paddingRight={restyleTable && 2}
                        paddingInlineEnd={restyleTable && 2}
                        pr="20px"
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
            );
          })}
        </Tbody>
      </Table>

      <HStack w="full" justify="space-between">
        {!isFilterRowSelected && showPageSizeSelect && (
          <HStack minW="xs">
            <Select
              isSearchable={false}
              size="sm"
              maxW="70px"
              value={pageSizeOptions.find((option) => option.value == pageSize)}
              onChange={(e) => setPageSize(Number(e.value))}
              options={pageSizeOptions}
              classNamePrefix="chakra-react-select"
              menuPosition={"fixed"}
            />
          </HStack>
        )}

        {!isFilterRowSelected &&
          (showManualPages ? (
            <ButtonGroup isAttached variant="outline" flexWrap="wrap">
              <IconButton
                aria-label="Go to previous page"
                icon={<HiChevronLeft />}
                isDisabled={!canPreviousPage}
                onClick={() => previousPage()}
              />
              {renderPageNumbers()}
              <IconButton
                aria-label="Go to next page"
                icon={<HiChevronRight />}
                isDisabled={!canNextPage}
                onClick={() => nextPage()}
              />
            </ButtonGroup>
          ) : (
            <>
              <Text>
                Showing {pageIndex * pageSize + 1} to{" "}
                {(pageIndex + 1) * pageSize} of {data.length} entries
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
          ))}
      </HStack>
    </VStack>
  );
};

export default PaginationTable;
