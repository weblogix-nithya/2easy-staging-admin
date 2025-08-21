import {
  Button,
  ButtonGroup,
  Flex,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Image,
  Link,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { faTrashAlt } from "@fortawesome/pro-light-svg-icons";
import { faDownload, faPen } from "@fortawesome/pro-regular-svg-icons";
import { faMessageLines } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import {
  Column,
  PluginHook,
  TableOptions,
  usePagination,
  useTable,
} from "react-table";

type PaginationTableProps<T extends object> = {
  columns: Column<T>[];
  data: T[];
  options?: Omit<TableOptions<T>, "data" | "columns">;
  plugins?: PluginHook<T>[];
  path?: string;
  onDelete?: (data: any) => void;
  onLinkEvent?: (id: number, status: number) => void;
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
);

const PaginationMultipleImageTable = <T extends object>({
  columns,
  data,
  isServerSide = false,
  options,
  plugins = [],
  setQueryPageIndex,
  setQueryPageSize,
  onDelete,
  onLinkEvent,
  path,
}: PaginationTableProps<T>) => {
  const textColorLink = useColorModeValue("blue.600", "blue");
  const router = useRouter();

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
    // setPageSize,
    state: { pageIndex, pageSize },
  } = useTable<T>({ ...options, columns, data }, usePagination, ...plugins);

  useEffect(() => {
    if (isServerSide && setQueryPageIndex && setQueryPageSize) {
      setQueryPageIndex(pageIndex);
      setQueryPageSize(pageSize);
    }
  }, [isServerSide, pageIndex, pageSize, setQueryPageIndex, setQueryPageSize]);

  return (
    <VStack w="full" align="start" spacing={4}>
      {/* <HStack minW="xs">
        <Select
          size="sm"
          maxW="70px"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </Select>
        <Text>entries per page</Text>
      </HStack> */}
      <Table colorScheme="white" {...getTableProps()}>
        <Thead>
          {headerGroups.map((headerGroup, index) => (
            <Tr
              {...headerGroup.getHeaderGroupProps()}
              key={`header-row-${index}`}
            >
              {headerGroup.headers.map((column) => (
                <Th
                  {...column.getHeaderProps()}
                  key={`row-header-${column.id}`}
                >
                  {column.render("Header")}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>

        <Tbody {...getTableBodyProps()}>
          {page?.map((row, index) => {
            prepareRow(row);
            return (
              <Tr {...row.getRowProps()} key={`row-${index}`}>
                {row?.cells?.map((cell, index) => {
                  let data;
                  if (cell.column.Header === "Actions") {
                    data = (
                      <Td key={`action-${index}`}>
                        {
                          //@ts-ignore
                          cell.column.isDelete && (
                            <Button
                              // bg={boxBg}
                              bg="white"
                              fontSize="sm"
                              // fontWeight="500"
                              className="!text-[var(--chakra-colors-black-400)]"
                              onClick={() => {
                                //@ts-ignore
                                onDelete(cell.row.original.id);
                              }}
                              // color={textColorSecondary}
                              // borderRadius="7px"
                            >
                              <FontAwesomeIcon
                                icon={faTrashAlt}
                                className="!text-[var(--chakra-colors-black-400)]"
                                size="lg"
                              />
                            </Button>
                          )
                        }
                        {
                          //@ts-ignore
                          cell.column.isLinkAction && (
                            <Link
                              bg="white"
                              color={textColorLink}
                              fontSize="sm"
                              onClick={() => {
                                //@ts-ignore
                                onLinkEvent(cell.row.original.id, cell.value);
                              }}
                            >
                              {cell.value == 1
                                ? "Mark as resolved"
                                : "Mark as open"}
                            </Link>
                          )
                        }
                        {
                          //@ts-ignore
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
                          //@ts-ignore
                          ((!cell.column.isLinkAction &&
                            //@ts-ignore
                            !cell.column.isDelete &&
                            //@ts-ignore
                            !cell.column.isDownload) ||
                            //@ts-ignore
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
                      </Td>
                    );
                  } else if (cell.column.Header === "Instructions") {
                    data = (
                      <Td
                        {...cell.getCellProps()}
                        key={`instructions-${index}`}
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
                    //@ts-ignore
                  } else if (cell.column.isMultipleImage) {
                    data = (
                      <Td {...cell.getCellProps()} key={`default-${index}`}>
                        <Grid
                          templateAreas={`"nav main"`}
                          gridTemplateColumns={"50% 1fr"}
                          h="auto"
                          gap="1"
                          color="blackAlpha.700"
                          fontWeight="bold"
                        >
                          {/* Left side */}
                          {cell.value &&
                            cell.value.map(
                              (
                                image: {
                                  downloadable_url: string;
                                  name: string;
                                },
                                index: React.Key,
                              ) => (
                                <GridItem key={index}>
                                  <Flex
                                    alignItems="center"
                                    justifyContent="center"
                                    width="100px"
                                    height="100px"
                                    marginTop={1}
                                    marginBottom={1}
                                    border="1px solid #E2E8F0"
                                    borderRadius="14px"
                                    mr="4"
                                  >
                                    <Link
                                      href={image.downloadable_url}
                                      target="_blank"
                                      fontWeight="700"
                                    >
                                      <Image
                                        src={image.downloadable_url}
                                        alt={image.name}
                                        borderRadius="14px"
                                        width="100%"
                                        height="100%"
                                        objectFit="cover"
                                      />
                                    </Link>
                                  </Flex>
                                </GridItem>
                              ),
                            )}
                        </Grid>
                        {(!cell.value || cell.value.length == 0) && (
                          <Flex
                            alignItems="center"
                            justifyContent="center"
                            width="130px"
                            height="130px"
                            border="1px solid #E2E8F0"
                            borderRadius="4px"
                            mr="4"
                          >
                            <Image
                              src="/images/no-image.png"
                              alt="No Image"
                              width="100%"
                              height="100%"
                              objectFit="cover"
                            />
                          </Flex>
                        )}
                      </Td>
                    );
                  } else {
                    data = (
                      <Td {...cell.getCellProps()} key={`default-${index}`}>
                        {cell.render("Cell")}
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
        <Text>
          Showing {pageIndex * pageSize + 1} to {(pageIndex + 1) * pageSize} of{" "}
          {data.length} entries
        </Text>
        <ButtonGroup isAttached variant="outline">
          <IconButton
            aria-label="Go to previous page"
            icon={<HiChevronLeft />}
            disabled={!canPreviousPage}
            onClick={() => previousPage()}
          />
          <IconButton
            aria-label="Go to next page"
            icon={<HiChevronRight />}
            disabled={!canNextPage}
            onClick={() => nextPage()}
          />
        </ButtonGroup>
      </HStack>
    </VStack>
  );
};

export default PaginationMultipleImageTable;
