// Chakra imports
import { useMutation, useQuery } from "@apollo/client";
import { InfoOutlineIcon } from "@chakra-ui/icons";
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
  // Skeleton,
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
import CustomInputField from "components/fields/CustomInputField";
// import { Select } from "chakra-react-select";
// import AreYouSureAlert from "components/alert/AreYouSureAlert";
// import { SearchBar } from "components/navbar/searchBar/SearchBar";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { GET_COMPANYS_QUERY } from "graphql/company";
import { GET_CUSTOMERS_QUERY } from "graphql/customer";
import {
  CREATE_INVOICE_MUTATION,
  defaultInvoice,
  GENERATE_INVOICE_PDF_MUTATION,
} from "graphql/invoice";
import { CREATE_INVOICE_LINE_ITEM_MUTATION } from "graphql/invoiceLineItem";
import { GET_INVOICE_STATUSES_QUERY } from "graphql/invoiceStatus";
import { formatCurrency, formatFloat, formatToSelect } from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

function InvoiceCreate() {
  const toast = useToast();
  // const today = new Date().toISOString();
  const today = new Date().toISOString().split("T")[0];

  const textColor = useColorModeValue("navy.700", "white");
  //  const textColorSecondary = "gray.400";
  const [invoice, setInvoice] = useState({
    ...defaultInvoice,
    issued_at: today,
    due_at: today,
  });

  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState(null);
  const [invoiceLineItems, setInvoiceLineItems] = useState([]);
  const [invoiceStatuses, setInvoiceStatuses] = useState([]);
  const [companiesOptions, setCompaniesOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [jobDateAt, _setJobDateAt] = useState(today);

  const getDaysFromTerm = (termValue) => {
    if (!termValue) return 0;

    // Match "14" from "14_days"
    const match = termValue.match(/^(\d+)_days/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const addDays = (dateString, days) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0]; // yyyy-MM-dd
  };

  const {
    isAdmin,
    isCompany,
    isCompanyAdmin,
    companyId,
    customerId,
    isCustomer,
  } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  const defaultVariables = {
    query: "",
    page: 1,
    first: 100,
    orderByColumn: "id",
    orderByOrder: "ASC",
  };

  useQuery(GET_INVOICE_STATUSES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setInvoiceStatuses([]);
      data.invoiceStatuses.data.map((invoiceStatus: any) => {
        setInvoiceStatuses((invoiceStatuses) => [
          ...invoiceStatuses,
          { value: invoiceStatus.id, label: invoiceStatus.name },
        ]);
      });
    },
  });
  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setDebouncedSearch(e);
    }, 300);
  }, []);
  useQuery(GET_COMPANYS_QUERY, {
    variables: {
      query: debouncedSearch,
      page: 1,
      first: 10000,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      const newCompaniesOptions = data.companys.data.map((_entity: any) => ({
        value: parseInt(_entity.id),
        label: _entity.name,
        term: _entity.payment_term,
      }));
      console.log(newCompaniesOptions, "newcomp");
      setCompaniesOptions(newCompaniesOptions);
    },
  });
  const { refetch: getCustomersByCompanyId } = useQuery(GET_CUSTOMERS_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
      company_id: invoice.company_id, // Ensure this is provided if needed
    },
    skip: !isCompany,
    onCompleted: (data) => {
      setCustomerOptions([]);
      let _customerOptions = formatToSelect(
        data.customers.data,
        "id",
        "full_name",
      );
      setCustomerOptions(_customerOptions);
      if (isCustomer) {
        setInvoice({ ...invoice, ...{ customer_id: customerId } });
      }
    },
  });
  useEffect(() => {
    if ((!isCompany && !isCompanyAdmin) || !companyId) return;

    const timeout = setTimeout(() => {
      if (invoice.company_id !== companyId) {
        setInvoice((prev) => ({ ...prev, company_id: companyId }));

        getCustomersByCompanyId({ ...defaultVariables, company_id: companyId });
      }
    }, 100);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const [handleGenerateInvoicePdf] = useMutation(
    GENERATE_INVOICE_PDF_MUTATION,
    {
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const handleInvoiceCreation = () => {
    // if (!validateAddresses()) return;
    // if (!validateTimeslotDepot()) return;

    // const selectedJobTypeName = filteredJobTypeOptions.find(
    //   (opt) => opt.value === job.job_type_id,
    // )?.label;

    console.log(invoice, "create");
    console.log(
      {
        invoice_status_id: invoice.invoice_status_id,
        name: invoice.name,
        company_id: invoice.company_id,
        customer_id: invoice.customer_id,
        sub_total: invoice.sub_total,
        total_tax: invoice.total_tax,
        total: invoice.total,
        issued_at: invoice.issued_at,
        due_at: invoice.due_at,
      },
      "ln",
    );

    if (isAdmin && !invoice.company_id) {
      toast({
        title: "Company Required",
        description: "Please select a company and customer again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    // setIsSaving(true);

    handleCreateInvoice();
  };

  const [handleCreateInvoice, {}] = useMutation(CREATE_INVOICE_MUTATION, {
    variables: {
      input: {
        invoice_status_id: 1,
        name: invoice.name,
        company_id: invoice.company_id,
        customer_id: invoice.customer_id,
        sub_total: invoice.sub_total,
        total_tax: invoice.total_tax,
        total: invoice.total,
        issued_at: invoice.issued_at,
        due_at: invoice.due_at,
        is_rcti: true,
      },
    },
    onCompleted: async (data) => {
      console.log(data, "res");
      for (let invoiceLineItem of invoiceLineItems) {
        await handleCreateLineItem({
          input: {
            name: invoiceLineItem.name,
            invoice_id: data.createInvoice.id,
            is_surcharge: true,
            // is_rate: false,
            tax_type: "OUTPUT",
            unit_amount: formatFloat(invoiceLineItem.unit_amount),
            quantity: formatFloat(invoiceLineItem.quantity),
            line_amount: formatFloat(invoiceLineItem.line_amount),
          },
        });
      }
      await handleGenerateInvoicePdf({
        variables: {
          id: data.createInvoice.id,
        },
      });
      toast({
        title: "Invoice created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      router.push(`/admin/invoices/${data.createInvoice.id}`);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const handleCreateLineItem = (lineItem: any) => {
    return new Promise((resolve, reject) => {
      createLineItem({ variables: lineItem })
        .then(({ data }) => {
          toast({
            title: "Line Item created",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };
  const [createLineItem] = useMutation(CREATE_INVOICE_LINE_ITEM_MUTATION);

  useEffect(() => {
    if (!invoiceLineItems || invoiceLineItems.length === 0) return;

    const invoiceTotal = invoiceLineItems.reduce((acc, item) => {
      const amount = parseFloat(item.line_amount) || 0;
      return acc + amount;
    }, 0);

    const taxRate = 0.1;
    const subTotal = parseFloat(invoiceTotal.toFixed(2));
    const totalTax = parseFloat((invoiceTotal * taxRate).toFixed(2));
    const total = parseFloat((invoiceTotal + totalTax).toFixed(2));

    setInvoice((prev) => ({
      ...prev,
      sub_total: subTotal,
      total_tax: totalTax,
      total: total,
    }));
  }, [invoiceLineItems]);

  const handleDeleteItem = (index) => {
    setInvoiceLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout>
      <Box
        className="mk-invoices-id"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
        px={{ base: "20px" }}
      >
        {/* Main Fields */}
        <Grid>
          <FormControl>
            <Flex
              justifyContent="space-between"
              alignItems="center"
              mb="24px"
              className="mt-8"
            >
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
                onClick={() => handleInvoiceCreation()}
                // hidden={isCustomer}
              >
                Save Changes
              </Button>
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
                Name
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
                // isDisabled={isCustomer}
                // hidden={isCustomer}
              />
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
                Invoice Status
              </FormLabel>

              <Box width="450px">
                {" "}
                {/* change width as needed */}
                <Select
                  placeholder="Select Status"
                  defaultValue={invoiceStatuses.find(
                    (invoiceStatus) =>
                      invoiceStatus.value == invoice.invoice_status_id,
                  )}
                  options={invoiceStatuses}
                  onChange={(e) => {
                    setInvoice({ ...invoice, invoice_status_id: e.value });
                  }}
                  size="lg"
                  className="select mb-0"
                  classNamePrefix="two-easy-select"
                  isDisabled={isCustomer}
                />
              </Box>
            </Flex>

            <Flex
              alignItems="center"
              mb="16px"
              justifyContent="space-between"
              width="100%"
              gap="16px"
            >
              {/* Company */}
              <Flex alignItems="center" width="40%">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="40px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Company
                </FormLabel>

                {!isCompany && (
                  <CustomInputField
                    isSelect={true}
                    maxWidth={"500px"}
                    minWidth={"400px"}
                    optionsArray={companiesOptions}
                    value={companiesOptions.find(
                      (entity) => entity.value === invoice.company_id,
                    )}
                    placeholder=""
                    onInputChange={(e) => {
                      onChangeSearchQuery(e);
                    }}
                    onChange={(e) => {
                      getCustomersByCompanyId({
                        ...defaultVariables,
                        company_id: e.value,
                      });
                      setInvoice({
                        ...invoice,
                        company_id: e.value || null,
                        customer_id: null,
                      });
                      console.log(e, "e");
                      setSelectedPaymentTerm(e.term);
                      setInvoice((prev) => ({
                        ...prev,
                        issued_at:jobDateAt,
                        due_at: addDays(
                          prev.issued_at,
                          getDaysFromTerm(e.term),
                        ),                        
                      }));
                    }}
                  />
                )}
              </Flex>

              <Box width="50%">
                <CustomInputField
                  label="Issued At:"
                  type="date"
                  name="issued_at"
                  value={invoice.issued_at}
                  onChange={(e) => {
                    const newDate = e.target.value;

                    const days = getDaysFromTerm(selectedPaymentTerm);
                    const newDueDate = addDays(newDate, days);

                    setInvoice((prev) => ({
                      ...prev,
                      issued_at: newDate,
                      due_at: newDueDate,
                    }));
                  }}
                />
                {invoice.company_id && (
                  <Flex
                    alignItems="center"
                    mt={1}
                    color="gray.500"
                    fontSize="sm"
                  >
                    <InfoOutlineIcon mr={2} />
                    <span>
                      Selected Company&apos;s Payment Term: {selectedPaymentTerm}
                    </span>
                  </Flex>
                )}
              </Box>
            </Flex>

            <Flex
              alignItems="center"
              mb="16px"
              justifyContent="space-between"
              width="100%"
              gap="16px"
            >
              {/* Customer Select */}
              <Flex alignItems="center" width="50%">
                <FormLabel
                  display="flex"
                  mb="0"
                  width="40px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Customer
                </FormLabel>

                <CustomInputField
                  isSelect={true}
                  maxWidth={"500px"}
                  minWidth={"400px"}
                  optionsArray={customerOptions}
                  value={
                    customerOptions.find(
                      (entity) => entity.value === invoice.customer_id,
                    ) || { value: 0, label: "" }
                  }
                  placeholder=""
                  isDisabled={isCompany || isCompanyAdmin}
                  onChange={(e) => {
                    if (isCompany && isCompanyAdmin) return;

                    setInvoice({
                      ...invoice,
                      customer_id: e.value || null,
                    });
                  }}
                />
              </Flex>

              {/* Last Free Day */}
              <Box width="50%">
                <CustomInputField
                  label="Due At:"
                  type="date"
                  placeholder=""
                  name="due_at"
                  value={invoice.due_at}
                  onChange={(e) => {
                    setInvoice({
                      ...invoice,
                      [e.target.name]: e.target.value,
                    });
                  }}
                />
              </Box>
            </Flex>
          </FormControl>
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
            </Flex>
            <>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th pl="0">Description</Th>
                      <Th>Rate</Th>
                      <Th>QTY</Th>
                      <Th>Amount</Th>
                      <Th>Action</Th>
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
                              // isDisabled={isCustomer}
                              // hidden={isCustomer}
                            />
                            {/* <Skeleton w="75%">{invoiceLineItem.name}</Skeleton> */}
                          </Td>

                          <Td maxWidth="160px">
                            <Input
                              variant="main"
                              value={invoiceLineItem.unit_amount ?? 0}
                              onChange={(e) => {
                                let items = [...invoiceLineItems];
                                let item = { ...invoiceLineItems[index] };
                                item[e.target.name] = e.target.value || 0;
                                item.unit_amount =
                                  parseFloat(e.target.value) || 0; // Ensure numeric value or default to 0
                                item.line_amount = (
                                  (item.quantity || 0) * item.unit_amount
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
                              // isDisabled={isCustomer}
                              // hidden={isCustomer}
                            />
                            {/* <Skeleton w="75%">
                              {formatCurrency(
                                invoiceLineItem.unit_amount ?? 0,
                                invoiceLineItem.currency,
                              )}
                            </Skeleton> */}
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
                                  item.unit_amount * parseFloat(e.target.value)
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
                              // isDisabled={isCustomer}
                              // hidden={isCustomer}
                            />
                            {/* <Skeleton w="75%">
                              {invoiceLineItem.quantity}
                            </Skeleton> */}
                          </Td>

                          <Td maxWidth="120px">
                            <Input
                              disabled={true}
                              variant="main"
                              value={invoiceLineItem.line_amount ?? 0}
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
                              // isDisabled={isCustomer}
                              // hidden={isCustomer}
                            />
                            {/* <Skeleton w="75%">
                              {formatCurrency(
                                invoiceLineItem.line_amount ?? 0,
                                invoiceLineItem.currency,
                              )}
                            </Skeleton> */}
                          </Td>
                          {/* {!isCustomer && ( */}
                          <Td
                            sx={{
                              color: "red",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                            onClick={() => handleDeleteItem(index)}
                          >
                            X
                          </Td>
                          {/* )} */}
                        </Tr>
                      ),
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </>
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
                unit_amount: 0,
                quantity: 0,
                line_amount: 0,
              },
            ])
          }

          // isLoading={invoiceLoading}
          // hidden={isCustomer}
          // isDisabled={
          //   isHandleUpdateInvoiceLineItemsLoading ||
          //   isHandleUpdateInvoiceLoading
          // }
        >
          Add Item
        </Button>

        {/* Wrap the two columns in a parent Flex and close it properly */}
        <Flex className="w-full mt-4 gap-6" justifyContent="space-between">
          {/* Left Column: Total Weight and CBM */}
          {/* Left Column: Total Weight and CBM */}
          <Box className="w-1/2 max-w-[400px]"></Box>

          {/* Right Column: Invoice Info */}
          {/* Right Column: Invoice Info (clean version, no Skeletons) */}
          <Box className="w-1/2 max-w-[400px] ml-auto">
            <Flex flexDirection="column" className="ml-auto">
              <Flex
                justifyContent="space-between"
                className="py-4 border-b border-[#e3e3e3]"
              >
                <p className="text-sm !font-bold">SubTotal</p>
                <p className="text-sm text-right">
                  {formatCurrency(invoice.sub_total, invoice.currency)}
                </p>
              </Flex>

              <Flex
                justifyContent="space-between"
                className="py-4 border-b border-[#e3e3e3]"
              >
                <p className="text-sm !font-bold">GST</p>
                <p className="text-sm text-right">
                  {formatCurrency(invoice.total_tax, invoice.currency)}
                </p>
              </Flex>

              <Flex
                justifyContent="space-between"
                className="py-4 border-b border-[#e3e3e3]"
              >
                <p className="text-sm !font-bold">Total</p>
                <p className="text-sm text-right">
                  {formatCurrency(invoice.total, invoice.currency)}
                </p>
              </Flex>

              <Flex
                justifyContent="space-between"
                className="py-4 border-b border-[#e3e3e3]"
              >
                <p className="text-base !font-bold">Balance Due</p>
                <p className="text-base !font-bold text-right">
                  {formatCurrency(invoice.total, invoice.currency)}
                </p>
              </Flex>
            </Flex>
          </Box>
        </Flex>
        <Divider className="my-10" />
      </Box>
    </AdminLayout>
  );
}

export default InvoiceCreate;
