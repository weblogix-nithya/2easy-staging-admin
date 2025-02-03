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
  Input,
  SimpleGrid,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import AreYouSureAlert from "components/alert/AreYouSureAlert";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  defaultInvoice,
  DELETE_INVOICE_MUTATION,
  GET_INVOICE_QUERY,
  UPDATE_INVOICE_MUTATION,
} from "graphql/invoice";
import {
  CREATE_INVOICE_LINE_ITEM_MUTATION,
  DELETE_INVOICE_LINE_ITEM_MUTATION,
  GET_INVOICE_LINE_ITEMS_QUERY,
  UPDATE_INVOICE_LINE_ITEM_MUTATION,
} from "graphql/invoiceLineItem";
import { formatCurrency, formatFloat } from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

function InvoiceEdit() {
  let menuBg = useColorModeValue("white", "navy.800");
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const [invoice, setInvoice] = useState(defaultInvoice);
  const [invoiceStatuses, setInvoiceStatuses] = useState([
    { id: 1, value: "1", name: "Pending/Draft", label: "Pending/Draft" },
    {
      id: 6,
      value: "6",
      name: "Processed/Approved",
      label: "Processed/Approved",
    },
  ]);
  const [invoiceLineItems, setInvoiceLineItems] = useState([]);
  const [deleteInvoiceLineItemId, setDeleteInvoiceLineItemId] = useState(null);
  const isAdmin = useSelector((state: RootState) => state.user.isAdmin);
  const isCompany = useSelector((state: RootState) => state.user.isCompany);
  const isCustomer = useSelector((state: RootState) => state.user.isCustomer);
  const customerId = useSelector((state: RootState) => state.user.customerId);
  const router = useRouter();
  const { id } = router.query;

  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const {
    loading,
    error,
    data: invoiceLineItemsData,
    refetch: getInvoiceLineItems,
  } = useQuery(GET_INVOICE_LINE_ITEMS_QUERY, {
    variables: {
      invoice_id: id,
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setInvoiceLineItems(data.invoiceLineItems.data);
    },
  });

  const {
    loading: invoiceLoading,
    data: invoiceData,
    refetch: getInvoice,
  } = useQuery(GET_INVOICE_QUERY, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      if (data?.invoice == null) {
        router.push("/admin/invoices");
      }
      setInvoice({ ...invoice, ...data?.invoice });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [handleUpdateLineItem, {}] = useMutation(
    UPDATE_INVOICE_LINE_ITEM_MUTATION,
    {
      onCompleted: (data: any) => {
        toast({
          title: "Line Item updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error: any) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const [handleCreateLineItem, {}] = useMutation(
    CREATE_INVOICE_LINE_ITEM_MUTATION,
    {
      onCompleted: (data: any) => {
        toast({
          title: "Line Item created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error: any) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const [handleUpdateApproveInvoice, {}] = useMutation(
    UPDATE_INVOICE_MUTATION,
    {
      variables: {
        input: {
          id: id,
          invoice_status_id: 6,
        },
      },
      onCompleted: (data) => {
        toast({
          title: "Invoice Approved",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // not great but it works
        setTimeout(() => {
          getInvoice();
        }, 10000);
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const [handleUpdateInvoice, {}] = useMutation(UPDATE_INVOICE_MUTATION, {
    variables: {
      input: {
        id: id,
        invoice_status_id: invoice.invoice_status_id,
        name: invoice.name,
        sub_total: invoice.sub_total,
        total_tax: invoice.total_tax,
        total: invoice.total,
      },
    },
    onCompleted: (data) => {
      toast({
        title: "Invoice updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      invoiceLineItems.map((invoiceLineItem) => {
        if (invoiceLineItem.id == null) {
          handleCreateLineItem({
            variables: {
              input: {
                name: invoiceLineItem.name,
                invoice_id: invoiceLineItem.invoice_id,
                is_surcharge: true,
                is_rate: false,
                tax_type: "OUTPUT",
                unit_amount: formatFloat(invoiceLineItem.unit_amount),
                quantity: formatFloat(invoiceLineItem.quantity),
                line_amount: formatFloat(invoiceLineItem.line_amount),
              },
            },
          });
        } else {
          handleUpdateLineItem({
            variables: {
              input: {
                id: invoiceLineItem.id,
                name: invoiceLineItem.name,
                invoice_id: invoiceLineItem.invoice_id,
                unit_amount: formatFloat(invoiceLineItem.unit_amount),
                quantity: formatFloat(invoiceLineItem.quantity),
                line_amount: formatFloat(invoiceLineItem.line_amount),
              },
            },
          });
        }
      });
      // not great but it works
      setTimeout(() => {
        getInvoice();
        getInvoiceLineItems();
      }, 10000);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteInvoice, {}] = useMutation(DELETE_INVOICE_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      toast({
        title: "Invoice deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/invoices");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteInvoiceLineItem, {}] = useMutation(
    DELETE_INVOICE_LINE_ITEM_MUTATION,
    {
      variables: {
        id: deleteInvoiceLineItemId,
      },
      onCompleted: (data) => {
        toast({
          title: "Line Item deleted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setInvoiceLineItems(
          invoiceLineItems.filter((invoiceLineItem) => {
            return invoiceLineItem.id != deleteInvoiceLineItemId;
          }),
        );
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  useEffect(() => {
    let invoiceTotal = invoiceLineItems.reduce((acc, invoiceLineItem) => {
      return acc + parseFloat(invoiceLineItem.line_amount);
    }, 0);
    setInvoice({
      ...invoice,
      total_tax: invoiceTotal * 0.1,
      sub_total: invoiceTotal,
      total: invoiceTotal * 1.1,
    });
  }, [invoiceLineItems]);

  return (
    <AdminLayout>
      <Box
        className="mk-invoices-id"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
        px={{ base: "20px" }}
      >
        {/* Main Fields */}
        <Grid>
          {!invoiceLoading && (
            <FormControl>
              <Flex
                justifyContent="space-between"
                alignItems="center"
                mb="24px"
                className="mt-8"
              >
                {invoice.is_rcti && (
                  <h1 className="mb-0">
                    Invoice #
                    {invoice.job
                      ? invoice.job.name
                      : invoice.vehicle_hire?.name}
                  </h1>
                )}

                {!invoice.is_rcti && (
                  <h1 className="mb-0">RCTI {invoice.name}</h1>
                )}
                <Flex>
                  {invoice.job_id && (
                    <Button
                      fontSize="sm"
                      lineHeight="19px"
                      variant="brand"
                      fontWeight="500"
                      w="100%"
                      h="50"
                      mb="0"
                      ms="10px"
                      className="!h-[39px]"
                      onClick={() => {
                        router.push("/admin/jobs/" + invoice.job_id);
                      }}
                      isLoading={invoiceLoading}
                      hidden={isCustomer}
                    >
                      Job
                    </Button>
                  )}
                  <Button
                    fontSize="sm"
                    lineHeight="19px"
                    variant="brand"
                    fontWeight="500"
                    w="100%"
                    pl={10}
                    pr={10}
                    h="50"
                    mb="0"
                    ms="10px"
                    className="!h-[39px]"
                    onClick={() => handleUpdateInvoice()}
                    isLoading={invoiceLoading}
                    hidden={isCustomer}
                  >
                    Save Changes
                  </Button>
                </Flex>
              </Flex>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  <Skeleton isLoaded={!invoiceLoading} w="75%">
                    Name
                  </Skeleton>
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={invoice.name}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      [e.target.name]: e.target.value,
                    })
                  }
                  type="text"
                  name="name"
                  className="max-w-md"
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontWeight="500"
                  size="lg"
                  isDisabled={isCustomer}
                  hidden={isCustomer}
                />
                <Skeleton
                  hidden={!isCustomer}
                  isLoaded={!invoiceLoading}
                  w="75%"
                >
                  {invoice.name}
                </Skeleton>
              </Flex>

              <Flex alignItems="center" mb="16px">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  <Skeleton isLoaded={!invoiceLoading} w="75%">
                    Invoice Status
                  </Skeleton>
                </FormLabel>
                {!isCustomer ? (
                  <Box className="!max-w-md w-full">
                    <Select
                      placeholder="Select Status"
                      defaultValue={invoiceStatuses.find(
                        (invoiceStatus) =>
                          invoiceStatus.value === invoice.invoice_status_id,
                      )}
                      options={invoiceStatuses}
                      onChange={(e) => {
                        setInvoice({ ...invoice, invoice_status_id: e.value });
                      }}
                      size="lg"
                      className="select mb-0"
                      classNamePrefix="two-easy-select"
                      isDisabled={isCustomer}
                    ></Select>
                  </Box>
                ) : (
                  <Skeleton isLoaded={!invoiceLoading} w="75%">
                    {invoice.invoice_status?.name}
                  </Skeleton>
                )}
              </Flex>

              {invoice.is_rcti && (
                <>
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      color={textColor}
                    >
                      <Skeleton isLoaded={!invoiceLoading} w="75%">
                        Company
                      </Skeleton>
                    </FormLabel>
                    <Input
                      disabled={true}
                      variant="main"
                      value={invoice.company?.name}
                      type="text"
                      name="name"
                      className="max-w-md"
                      fontSize="sm"
                      ms={{ base: "0px", md: "0px" }}
                      mb="0"
                      fontWeight="500"
                      size="lg"
                      isDisabled={isCustomer}
                      hidden={isCustomer}
                    />
                    <Skeleton
                      hidden={!isCustomer}
                      isLoaded={!invoiceLoading}
                      w="75%"
                    >
                      {invoice.company?.name}
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      color={textColor}
                    >
                      <Skeleton isLoaded={!invoiceLoading} w="75%">
                        Customer
                      </Skeleton>
                    </FormLabel>
                    <Input
                      disabled={true}
                      variant="main"
                      value={invoice.customer?.full_name}
                      type="text"
                      name="name"
                      className="max-w-md"
                      fontSize="sm"
                      ms={{ base: "0px", md: "0px" }}
                      mb="0"
                      fontWeight="500"
                      size="lg"
                      isDisabled={isCustomer}
                      hidden={isCustomer}
                    />
                    <Skeleton
                      hidden={!isCustomer}
                      isLoaded={!invoiceLoading}
                      w="75%"
                    >
                      {invoice.customer?.full_name}
                    </Skeleton>
                  </Flex>
                </>
              )}

              {!invoice.is_rcti && (
                <>
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      color={textColor}
                    >
                      Driver
                    </FormLabel>
                    <Input
                      disabled={true}
                      variant="main"
                      value={invoice.driver?.full_name}
                      type="text"
                      name="name"
                      className="max-w-md"
                      fontSize="sm"
                      ms={{ base: "0px", md: "0px" }}
                      mb="0"
                      fontWeight="500"
                      size="lg"
                    />
                  </Flex>
                </>
              )}
            </FormControl>
          )}
        </Grid>

        <Divider className="mt-4" />

        <Box pt={{ base: "40px", md: "40px", xl: "40px" }}>
          <SimpleGrid
            mb="16px"
            columns={{ sm: 1 }}
            spacing={{ base: "20px", xl: "20px" }}
          >
            <Flex minWidth="max-content" alignItems="center">
              <h3>Line Items</h3>
              <SearchBar
                hidden={isCustomer}
                background={menuBg}
                onChangeSearchQuery={onChangeSearchQuery}
                me="10px"
                borderRadius="30px"
              />
            </Flex>

            {!loading && (
              <>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th pl="0">Description</Th>
                        <Th>Rate</Th>
                        <Th>QTY</Th>
                        <Th>Amount</Th>
                        {!isCustomer && <Th>Action</Th>}
                      </Tr>
                    </Thead>

                    <Tbody>
                      {invoiceLineItems.map(
                        (invoiceLineItem: any, index: number) => (
                          <Tr key={index}>
                            <Td pl="0">
                              <Input
                                variant="main"
                                value={invoiceLineItem.name}
                                onChange={(e) => {
                                  let items = [...invoiceLineItems];
                                  let item = { ...invoiceLineItems[index] };
                                  item[e.target.name] = e.target.value;
                                  items[index] = item;
                                  setInvoiceLineItems(items);
                                }}
                                type="text"
                                name="name"
                                className="max-w-md"
                                fontSize="sm"
                                ms={{ base: "0px", md: "0px" }}
                                mb="0"
                                fontWeight="500"
                                size="lg"
                                isDisabled={isCustomer}
                                hidden={isCustomer}
                              />
                              <Skeleton
                                hidden={!isCustomer}
                                isLoaded={!invoiceLoading}
                                w="75%"
                              >
                                {invoiceLineItem.name}
                              </Skeleton>
                            </Td>

                            <Td maxWidth="160px">
                              <Input
                                variant="main"
                                value={invoiceLineItem.unit_amount}
                                onChange={(e) => {
                                  let items = [...invoiceLineItems];
                                  let item = { ...invoiceLineItems[index] };
                                  item[e.target.name] = e.target.value;
                                  item.line_amount = (
                                    item.quantity * parseFloat(e.target.value)
                                  ).toFixed(2);
                                  items[index] = item;
                                  setInvoiceLineItems(items);
                                }}
                                type="number"
                                name="unit_amount"
                                className="max-w-md"
                                fontSize="sm"
                                ms={{ base: "0px", md: "0px" }}
                                mb="0"
                                fontWeight="500"
                                size="lg"
                                isDisabled={isCustomer}
                                hidden={isCustomer}
                              />
                              <Skeleton
                                hidden={!isCustomer}
                                isLoaded={!invoiceLoading}
                                w="75%"
                              >
                                {formatCurrency(
                                  invoiceLineItem.unit_amount,
                                  invoiceLineItem.currency,
                                )}
                              </Skeleton>
                            </Td>

                            <Td maxWidth="120px">
                              <Input
                                variant="main"
                                value={invoiceLineItem.quantity}
                                onChange={(e) => {
                                  let items = [...invoiceLineItems];
                                  let item = { ...invoiceLineItems[index] };
                                  item[e.target.name] = e.target.value;
                                  item.line_amount = (
                                    item.unit_amount *
                                    parseFloat(e.target.value)
                                  ).toFixed(2);
                                  items[index] = item;
                                  setInvoiceLineItems(items);
                                }}
                                type="text"
                                name="quantity"
                                className="max-w-md"
                                fontSize="sm"
                                ms={{ base: "0px", md: "0px" }}
                                mb="0"
                                fontWeight="500"
                                size="lg"
                                isDisabled={isCustomer}
                                hidden={isCustomer}
                              />
                              <Skeleton
                                hidden={!isCustomer}
                                isLoaded={!invoiceLoading}
                                w="75%"
                              >
                                {invoiceLineItem.quantity}
                              </Skeleton>
                            </Td>

                            <Td maxWidth="120px">
                              <Input
                                disabled={true}
                                variant="main"
                                value={invoiceLineItem.line_amount}
                                onChange={(e) => {
                                  let items = [...invoiceLineItems];
                                  let item = { ...invoiceLineItems[index] };
                                  item[e.target.name] = e.target.value;
                                  items[index] = item;
                                  setInvoiceLineItems(items);
                                }}
                                type="text"
                                name="line_amount"
                                className="max-w-md"
                                fontSize="sm"
                                ms={{ base: "0px", md: "0px" }}
                                mb="0"
                                fontWeight="500"
                                size="lg"
                                isDisabled={isCustomer}
                                hidden={isCustomer}
                              />
                              <Skeleton
                                hidden={!isCustomer}
                                isLoaded={!invoiceLoading}
                                w="75%"
                              >
                                {formatCurrency(
                                  invoiceLineItem.line_amount,
                                  invoiceLineItem.currency,
                                )}
                              </Skeleton>
                            </Td>
                            {!isCustomer && (
                              <Td>
                                <AreYouSureAlert
                                  onDelete={() => {
                                    if (invoiceLineItem.id === null) {
                                      setInvoiceLineItems([
                                        ...invoiceLineItems.slice(0, index),
                                        ...invoiceLineItems.slice(index + 1),
                                      ]);
                                      return;
                                    }
                                    setDeleteInvoiceLineItemId(
                                      invoiceLineItem.id,
                                    );
                                    setTimeout(() => {
                                      handleDeleteInvoiceLineItem();
                                    }, 500);
                                  }}
                                ></AreYouSureAlert>
                              </Td>
                            )}
                          </Tr>
                        ),
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </>
            )}
          </SimpleGrid>
        </Box>

        <Button
          fontSize="sm"
          lineHeight="19px"
          variant="secondary"
          className=""
          onClick={() =>
            setInvoiceLineItems([
              ...invoiceLineItems,
              {
                id: null,
                name: "",
                invoice_id: invoice.id,
                unit_amount: 0,
                quantity: 0,
                line_amount: 0,
              },
            ])
          }
          isLoading={invoiceLoading}
          hidden={isCustomer}
        >
          Add Item
        </Button>

        <Box className="w-full mt-4">
          <Box className="max-w-[400px] ml-auto">
            <Flex flexDirection="column" className="ml-auto">
              <Flex
                justifyContent="space-between"
                className="py-4 border-b border-[#e3e3e3]"
              >
                <Skeleton isLoaded={!invoiceLoading} w="50%">
                  <p className="text-sm !font-bold">SubTotal </p>
                </Skeleton>
                <Skeleton isLoaded={!invoiceLoading} w="50%">
                  <p className="text-sm text-right">
                    {formatCurrency(invoice.sub_total, invoice.currency)}
                  </p>
                </Skeleton>
              </Flex>
              <Flex
                justifyContent="space-between"
                className="py-4 border-b border-[#e3e3e3]"
              >
                <Skeleton isLoaded={!invoiceLoading} w="50%">
                  <p className="text-sm !font-bold">GST </p>
                </Skeleton>
                <Skeleton isLoaded={!invoiceLoading} w="50%">
                  <p className="text-sm text-right">
                    {formatCurrency(invoice.total_tax, invoice.currency)}
                  </p>
                </Skeleton>
              </Flex>
              <Flex
                justifyContent="space-between"
                className="py-4 border-b border-[#e3e3e3]"
              >
                <Skeleton isLoaded={!invoiceLoading} w="50%">
                  <p className="text-sm !font-bold">Total </p>
                </Skeleton>
                <Skeleton isLoaded={!invoiceLoading} w="50%">
                  <p className="text-sm text-right">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </p>
                </Skeleton>
              </Flex>
              <Flex
                justifyContent="space-between"
                className="py-4 border-b border-[#e3e3e3]"
              >
                <Skeleton isLoaded={!invoiceLoading} w="50%">
                  <p className="text-base !font-bold">Balance Due </p>
                </Skeleton>
                <Skeleton isLoaded={!invoiceLoading} w="50%">
                  <p className="text-base !font-bold text-right">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </p>
                </Skeleton>
              </Flex>
            </Flex>

            <Flex justifyContent="space-between" className="mt-8">
              {invoice.invoice_status_id != undefined &&
                invoice.invoice_status_id == "2" && (
                  <Button
                    variant="primary"
                    className="w-[49%]"
                    onClick={() => handleUpdateApproveInvoice()}
                    isLoading={invoiceLoading}
                    hidden={!isCustomer}
                  >
                    {invoice.customer_id != customerId
                      ? "Manually Approve Invoice"
                      : "Approve Invoice"}
                  </Button>
                )}
            </Flex>
          </Box>
        </Box>

        <Divider className="my-10" />
      </Box>
    </AdminLayout>
  );
}

export default InvoiceEdit;
