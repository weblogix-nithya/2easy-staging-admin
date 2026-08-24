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
  // Link,
  SimpleGrid,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import AreYouSureAlert from "components/alert/AreYouSureAlert";
import CustomInputField from "components/fields/CustomInputField";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  defaultInvoice,
  DELETE_INVOICE_MUTATION,
  GENERATE_INVOICE_PDF_MUTATION,
  GET_INVOICE_QUERY,
  SEND_INVOICE_MUTATION,
  UPDATE_INVOICE_MUTATION,
} from "graphql/invoice";
import {
  CREATE_INVOICE_LINE_ITEM_MUTATION,
  DELETE_INVOICE_LINE_ITEM_MUTATION,
  GET_INVOICE_LINE_ITEMS_QUERY,
  UPDATE_INVOICE_LINE_ITEM_MUTATION,
} from "graphql/invoiceLineItem";
import { GET_INVOICE_STATUSES_QUERY } from "graphql/invoiceStatus";
import { GET_JOB_QUERY } from "graphql/job";
import { defaultJobDestination } from "graphql/jobDestination";
import { formatCurrency, formatFloat } from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

function toInputDate(date: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().slice(0, 10); // "yyyy-mm-dd"
}

function toAPIDate(date: Date | string | null) {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 10); // "yyyy-MM-dd"
}

const getDaysFromTerm = (termValue) => {
  if (!termValue) return 0;

  // Match "14" from "14_days"
  const match = termValue.match(/^(\d+)_days/);
  return match ? parseInt(match[1], 10) : 0;
};

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function InvoiceEdit() {
  const generatingRef = useRef(false);
  const lastUrlRef = useRef<string | null>(null);

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  let menuBg = useColorModeValue("white", "navy.800");
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  //  const textColorSecondary = "gray.400";
  const [invoice, setInvoice] = useState({
    ...defaultInvoice,
    issued_at: new Date(),
    due_at: new Date(),
  });
  const [invoiceStatuses, setInvoiceStatuses] = useState([]);
  const [invoiceLineItems, setInvoiceLineItems] = useState([]);
  const [deleteInvoiceLineItemId, setDeleteInvoiceLineItemId] = useState(null);
  const [
    isHandleUpdateInvoiceLineItemsLoading,
    setIsHandleUpdateInvoiceLineItemsLoading,
  ] = useState(false);
  // const [job, setJob] = useState(defaultJob);
  const [jobDestinations, setJobDestinations] = useState([]);
  const [pickUpDestination, setPickUpDestination] = useState(
    defaultJobDestination,
  );
  const [_isInvoicePdfUpdating, setIsInvoicePdfUpdating] = useState(false);
  const isAdmin = useSelector((state: RootState) => state.user.isAdmin);
  // const isCompany = useSelector((state: RootState) => state.user.isCompany);
  const isCustomer = useSelector((state: RootState) => state.user.isCustomer);
  const customerId = useSelector((state: RootState) => state.user.customerId);
  const companyId = useSelector((state: RootState) => state.user.companyId);
  const [_invoiceStatusId, setInvoiceStatusId] = useState(null);
  const router = useRouter();
  const { id } = router.query;
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, _setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [_isInvoicePdfgenerate, setIsInvoicePdfgenerate] = useState(false);
  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState(null);
  const [originalLineItems, setOriginalLineItems] = useState([]);

  // const [paymentTerm, setPaymentTerm] = useState(null);

  const updateLineItems = (index, updates) => {
    setInvoiceLineItems((prev) => {
      const items = JSON.parse(JSON.stringify(prev)); // deep clone
      items[index] = { ...items[index], ...updates };
      return items;
    });
  };

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const {
    loading,
    // error,
    // data: invoiceLineItemsData,
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
    skip: !id,
    onCompleted: (data) => {
      setInvoiceLineItems(data.invoiceLineItems.data);
      setOriginalLineItems(
        data.invoiceLineItems.data.map((item) =>
          JSON.parse(JSON.stringify(item)),
        ),
      );
    },
  });

  const {
    // loading: jobLoading,
    data: jobData, // Renamed 'data' to 'jobData'
    // refetch: getJob,
  } = useQuery(GET_JOB_QUERY, {
    variables: {
      id: invoice.job_id,
    },
    skip: !invoice?.job_id,
    onCompleted: (data) => {
      // console.log(data,'d')
      // jobDestinations without is_pickup
      let _jobDestinations = data.job.job_destinations;

      setJobDestinations(_jobDestinations);
      // console.log(jobDestinations,'jd')

      setPickUpDestination(
        data.job.pick_up_destination
          ? data.job.pick_up_destination
          : { ...defaultJobDestination },
      );
      // console.log(pickUpDestination, 'pjd')
    },
    onError(_error) {
      // console.log("onError");
      // console.log(error);
    },
  });

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

  //   const {
  //     loading: invoiceLoading,
  //     data,
  //     refetch: getInvoice,
  //   } = useQuery(GET_INVOICE_QUERY, {
  //     variables: { id },
  //     skip: !id,
  //   });

  //   useEffect(() => {
  // console.log(data,'router useffect 1')

  //     if (!data?.invoice) return;
  // console.log(data,'router useffect 1.1')

  //     setInvoice((prev) => ({
  //       ...prev,
  //       ...data.invoice,
  //       issued_at: new Date(data.invoice.issued_at),
  //       due_at: new Date(data.invoice.due_at),
  //       invoice_status_id: String(data.invoice.invoice_status_id),
  //       manual_inv_url: data.invoice.manual_inv_url,
  //     }));
  // console.log(data,'router useffect 1.2')

  //     setSelectedPaymentTerm(data.invoice.company?.payment_term);
  //     setInvoiceStatusId(data.invoice.invoice_status_id);
  //   }, [data]);
  const {
    loading: invoiceLoading,
    // data: invoiceData,
    refetch: getInvoice,
  } = useQuery(GET_INVOICE_QUERY, {
    variables: {
      id: id,
    },
    skip: !id,
    onCompleted: (data) => {
      if (data?.invoice == null) {
        router.push("/admin/invoices");
      }
      setInvoice((prev) => ({
        ...prev,
        ...data.invoice,
        issued_at: new Date(data.invoice.issued_at),
        due_at: new Date(data.invoice.due_at),
        invoice_status_id: String(data.invoice.invoice_status_id),
        invoice_no: data.invoice.invoice_no,
        manual_inv_url: data.invoice.manual_inv_url,
        job: data.invoice.job,
      }));
      setSelectedPaymentTerm(data.invoice.company.payment_term);
      setInvoiceStatusId(data?.invoice.invoice_status_id);
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const handleUpdateLineItem = (lineItem: any) => {
    return new Promise((resolve, reject) => {
      updateLineItem({ variables: lineItem })
        .then(({ data }) => {
          toast({
            title: "Line Item updated",
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
  const [updateLineItem] = useMutation(UPDATE_INVOICE_LINE_ITEM_MUTATION);

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

  const [handleUpdateApproveInvoice, { }] = useMutation(
    UPDATE_INVOICE_MUTATION,
    {
      variables: {
        input: {
          id: id,
          invoice_status_id: 6,
        },
      },
      onCompleted: (_data) => {
        toast({
          title: "Invoice Approved",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // not great but it works
        setTimeout(() => {
          handleGenerateInvoicePdf();
        }, 5000);
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const [handleUpdateInvoice, { loading: isHandleUpdateInvoiceLoading }] =
    useMutation(UPDATE_INVOICE_MUTATION, {
      variables: {
        input: {
          id: id,
          invoice_status_id: invoice.invoice_status_id,
          name: invoice.name,
          sub_total: invoice.sub_total,
          total_tax: invoice.total_tax,
          total: invoice.total,
          issued_at: toAPIDate(invoice.issued_at),
          due_at: toAPIDate(invoice.due_at),
        },
      },
      onCompleted: async (_data) => {
        toast({
          title: "Invoice updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        toast({
          title: "Regenerating invoice PDF, please wait 10 seconds to update",
          status: "info",
          duration: 3000,
          isClosable: true,
          position: "top",
        });

        setIsInvoicePdfUpdating(true);
        setIsInvoicePdfgenerate(true);
        setIsHandleUpdateInvoiceLineItemsLoading(true);

        for (let item of invoiceLineItems) {
          const original = originalLineItems.find(
            (o) => Number(o.id) === Number(item.id),
          );

          // NEW ITEM
          if (!item.id) {
            await handleCreateLineItem({
              input: {
                name: item.name,
                invoice_id: item.invoice_id,
                is_surcharge: true,
                is_rate: false,
                tax_type: "OUTPUT",
                unit_amount: formatFloat(item.unit_amount),
                quantity: formatFloat(item.quantity),
                line_amount: formatFloat(item.line_amount),
              },
            });
            continue;
          }

          // EXISTING ITEM — only update when changed
          if (hasLineItemChanged(original, item)) {
            await handleUpdateLineItem({
              input: {
                id: item.id,
                name: item.name,
                invoice_id: item.invoice_id,
                unit_amount: formatFloat(item.unit_amount),
                quantity: formatFloat(item.quantity),
                line_amount: formatFloat(item.line_amount),
              },
            });
          }
        }

        // not great but it works
        setTimeout(async () => {
          const { data } = await getInvoice();

          if (data?.invoice) {
            setInvoice((prev) => ({
              ...prev,
              ...data.invoice,
            }));
          }

          getInvoiceLineItems();

          setIsHandleUpdateInvoiceLineItemsLoading(false);
          handleGenerateInvoicePdf();
          setIsInvoicePdfgenerate(false);
        }, 5000);
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    });

  const [_handleDeleteInvoice, { }] = useMutation(DELETE_INVOICE_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (_data) => {
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

  const [handleSendInvoice, { }] = useMutation(SEND_INVOICE_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (_data) => {
      toast({
        title: "Invoice sent",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleGenerateInvoicePdf, { }] = useMutation(
    GENERATE_INVOICE_PDF_MUTATION,
    {
      variables: {
        id: id,
      },
      onCompleted: (_data) => {
        toast({
          title: "Invoice generating. Please wait 10 seconds to update",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // let shouldSendInvoice = invoiceStatusId == "6" ? false : true;
        // shouldSendInvoice = invoiceStatusId == "2" ? false : shouldSendInvoice;
        setTimeout(() => {
          getInvoice();
          if (
            // shouldSendInvoice &&
            invoice.invoice_status_id != undefined &&
            (invoice.invoice_status_id == "6" ||
              invoice.invoice_status_id == "2")
          ) {
            handleSendInvoice();
          }
        }, 10000);
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const [handleDeleteInvoiceLineItem, { }] = useMutation(
    DELETE_INVOICE_LINE_ITEM_MUTATION,
    {
      variables: {
        id: deleteInvoiceLineItemId,
      },
      onCompleted: (_data) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceLineItems]);

  useEffect(() => {
    if (invoice.invoice_status_id == 1 && !isAdmin) {
      router.push("/admin/invoices");
    }
    if (
      !(invoice.customer_id == customerId || invoice.company_id == companyId) &&
      !isAdmin &&
      invoice.id != null
    ) {
      router.push("/admin/invoices");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  function hasLineItemChanged(original, updated) {
    if (!original) return true; // new item

    return (
      Number(original.unit_amount) !== Number(updated.unit_amount) ||
      Number(original.quantity) !== Number(updated.quantity) ||
      Number(original.line_amount) !== Number(updated.line_amount) ||
      original.name !== updated.name
    );
  }
  const hasPdf = !!invoice?.job?.invoice_url || !!invoice?.manual_inv_url;

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
                {invoice?.is_rcti && (
                  <Box>
                    <h4 className="mb-0" style={{ fontSize: "12px", color: "#718096" }} >
                      Job{" "}#
                      {invoice?.job_id !== null || invoice?.job?.id !== null
                        ? invoice.job?.name || invoice.vehicle_hire?.name
                        : ""}
                    </h4>
                    <h1 className="mb-0">
                      Invoice #{invoice.invoice_no}
                    </h1>
                  </Box>
                )}
                {invoice?.job_id !== null && (
                  <Box pl={6}>
                    <Box pl={6}>
                      Collection : {pickUpDestination.address_city}
                    </Box>
                    <Box pl={6}>
                      Delivery :
                      {jobDestinations
                        .filter(
                          (destination) => destination.is_pickup === false,
                        )
                        .map((destination) => destination.address_city)
                        .join(", ")}
                    </Box>
                  </Box>
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
                      onClick={async () => {
                        lastUrlRef.current = invoice?.job?.invoice_url ?? null; // remember previous URL
                        generatingRef.current = true; // mark we triggered a generation
                        await handleGenerateInvoicePdf(); // your existing mutation/call
                        setIsInvoicePdfUpdating(true);
                        setIsInvoicePdfgenerate(true);
                      }}
                      isLoading={invoiceLoading}
                      hidden={isCustomer}
                    >
                      Generate PDF
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
                    isLoading={
                      invoiceLoading ||
                      isHandleUpdateInvoiceLoading ||
                      isHandleUpdateInvoiceLineItemsLoading
                    }
                    hidden={isCustomer}
                  >
                    Save Changes
                  </Button>
                </Flex>
              </Flex>

              <Flex alignItems="center" mb="16px">
                <Box width="50%">
                  <Flex alignItems="center" gap={3}>
                    <FormLabel
                      mb="0"
                      width="190px"
                      fontSize="sm"
                      fontWeight="500"
                      color={textColor}
                      whiteSpace="nowrap"
                    >
                      <Skeleton isLoaded={!invoiceLoading}>Name / Reference No.</Skeleton>
                    </FormLabel>

                    <Input
                      isRequired
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
                      mb="0"
                      fontWeight="500"
                      size="lg"
                      isDisabled={isCustomer}
                      hidden={isCustomer}
                      flex="1"
                    />
                  </Flex>

                  <Skeleton
                    hidden={!isCustomer}
                    isLoaded={!invoiceLoading}
                    w="75%"
                  >
                    {invoice.name}
                  </Skeleton>
                </Box>
                {(invoice?.job_id === null || invoice?.job?.id === null) && (
                  <Box width="50%">
                    <CustomInputField
                      label="Issued At:"
                      type="date"
                      name="issued_at"
                      value={toInputDate(invoice.issued_at)}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);

                        const days = getDaysFromTerm(selectedPaymentTerm);
                        const newDueDate = addDays(newDate, days);

                        setInvoice((prev) => ({
                          ...prev,
                          issued_at: newDate,
                          due_at: newDueDate,
                        }));
                      }}
                    />
                  </Box>
                )}
              </Flex>
              <Flex alignItems="center" mb="16px">
                {/* Left side – Invoice Status */}
                <Box width="50%" display="flex" alignItems="center" gap="16px">
                  <FormLabel
                    mb="0"
                    width="185px"
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
                        value={invoiceStatuses.find(
                          (invoiceStatus) =>
                            String(invoiceStatus.value) ===
                            String(invoice.invoice_status_id),
                        )}
                        options={invoiceStatuses}
                        onChange={(e) => {
                          setInvoice({
                            ...invoice,
                            invoice_status_id: e.value,
                          });
                          setTimeout(() => {
                            handleUpdateInvoice();
                          }, 500);
                        }}
                        size="lg"
                        className="select mb-0"
                        classNamePrefix="two-easy-select"
                        isDisabled={isCustomer}
                      />
                    </Box>
                  ) : (
                    <Skeleton isLoaded={!invoiceLoading} w="75%">
                      {invoice.invoice_status?.name}
                    </Skeleton>
                  )}
                </Box>

                {(invoice?.job_id === null || invoice?.job?.id === null) && (
                  <Box width="50%">
                    <CustomInputField
                      label="Due At:"
                      type="date"
                      placeholder=""
                      name="due_at"
                      value={toInputDate(invoice.due_at)}
                      onChange={(e) => {
                        setInvoice({
                          ...invoice,
                          [e.target.name]: e.target.value,
                        });
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
                          Selected Company&apos;s Payment Term:{" "}
                          {selectedPaymentTerm}
                        </span>
                      </Flex>
                    )}
                  </Box>
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
                                  updateLineItems(index, {
                                    name: e.target.value,
                                  });
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
                                value={invoiceLineItem.unit_amount ?? 0}
                                // onChange={(e) => {
                                //   let items = [...invoiceLineItems];
                                //   let item = { ...invoiceLineItems[index] };
                                //   item[e.target.name] = e.target.value || 0;
                                //   item.unit_amount =
                                //     parseFloat(e.target.value) || 0; // Ensure numeric value or default to 0
                                //   item.line_amount = (
                                //     (item.quantity || 0) * item.unit_amount
                                //   ).toFixed(2);
                                //   items[index] = item;
                                //   setInvoiceLineItems(items);
                                // }}
                                onChange={(e) => {
                                  const unit = parseFloat(e.target.value) || 0;
                                  const qty = invoiceLineItem.quantity || 0;

                                  updateLineItems(index, {
                                    unit_amount: unit,
                                    line_amount: (unit * qty).toFixed(2),
                                  });
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
                                  invoiceLineItem.unit_amount ?? 0,
                                  invoiceLineItem.currency,
                                )}
                              </Skeleton>
                            </Td>

                            <Td maxWidth="120px">
                              <Input
                                variant="main"
                                value={invoiceLineItem.quantity}
                                onChange={(e) => {
                                  const qty = parseFloat(e.target.value) || 0;
                                  const unit = invoiceLineItem.unit_amount || 0;

                                  updateLineItems(index, {
                                    quantity: qty,
                                    line_amount: (unit * qty).toFixed(2),
                                  });
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
                                value={invoiceLineItem.line_amount ?? 0}
                                onChange={(e) => {
                                  updateLineItems(index, {
                                    line_amount: e.target.value,
                                  });
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
                                  invoiceLineItem.line_amount ?? 0,
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
                                  isLoading={
                                    isHandleUpdateInvoiceLineItemsLoading ||
                                    isHandleUpdateInvoiceLoading
                                  }
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
                unit_amount: invoice.company?.lcl_rate
                  ? invoice.company.lcl_rate
                  : 0,
                quantity: 0,
                line_amount: 0,
              },
            ])
          }
          isLoading={invoiceLoading}
          hidden={isCustomer}
          isDisabled={
            isHandleUpdateInvoiceLineItemsLoading ||
            isHandleUpdateInvoiceLoading
          }
        >
          Add Item
        </Button>

        {/* Wrap the two columns in a parent Flex and close it properly */}
        <Flex className="w-full mt-4 gap-6" justifyContent="space-between">
          {/* Left Column: Total Weight and CBM */}
          <Box className="w-1/2 max-w-[400px]">
            <Flex flexDirection="column">
              <Flex justifyContent="space-between" className="py-2">
                <p className="text-sm ">
                  <span className="text-sm !font-bold px-1">
                    Total Weight:{" "}
                  </span>
                  {jobData?.job?.job_items
                    ?.reduce(
                      (total: number, item: { weight: number }) =>
                        total + (item.weight || 0),
                      0,
                    )
                    .toFixed(2)}
                </p>
              </Flex>
              <Flex justifyContent="space-between" className="py-2">
                <p className="text-sm text-left">
                  <span className="text-sm !font-bold px-1">CBM: </span>
                  {jobData?.job?.job_items
                    ?.reduce(
                      (total: number, item: { volume: number }) =>
                        total + (item.volume || 0),
                      0,
                    )
                    .toFixed(2)}
                </p>
              </Flex>
            </Flex>
          </Box>

          {/* Right Column: Invoice Info */}
          <Box className="w-1/2 max-w-[500px] ml-auto">
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
                    className="w-[59%] mr-2"
                    onClick={() => handleUpdateApproveInvoice()}
                    isLoading={invoiceLoading}
                  >
                    {invoice.customer_id != customerId
                      ? "Manually Approve Invoice"
                      : "Approve Invoice"}
                  </Button>
                )}

              {hasPdf && (
                <Tooltip
                  label={
                    invoice?.job?.invoice_url ? "Job Invoice" : "Manual Invoice"
                  }
                  hasArrow
                  placement="top"
                >
                  <Button
                    mx="5px"
                    variant="secondary"
                    isDisabled={invoiceLoading}
                    onClick={async () => {
                      try {
                        if (generatingRef.current) {
                          await sleep(3500);
                        }

                        const { data } = await getInvoice();
                        if (data?.invoice) {
                          setInvoice((prev) => ({
                            ...prev,
                            ...data.invoice,
                          }));
                        }
                        // Prefer job invoice
                        const freshJobUrl = data?.invoice?.job?.invoice_url;
                        const freshManualUrl = data?.invoice?.manual_inv_url;

                        const urlToOpen =
                          freshJobUrl ||
                          freshManualUrl ||
                          invoice?.job?.invoice_url ||
                          invoice?.manual_inv_url ||
                          lastUrlRef.current ||
                          null;

                        if (urlToOpen) {
                          window.open(
                            urlToOpen,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }
                      } finally {
                        generatingRef.current = false;
                      }
                    }}
                  >
                    Download PDF
                  </Button>
                </Tooltip>
              )}

              {invoice.invoice_status_id != undefined &&
                invoice.invoice_status_id != "1" && (
                  <Button
                    variant="primary"
                    className="w-[49%] ml-2"
                    onClick={() => handleSendInvoice()}
                    isLoading={invoiceLoading}
                  >
                    Send Invoice
                  </Button>
                )}
            </Flex>
          </Box>
        </Flex>
        <Divider className="my-10" />
      </Box>
    </AdminLayout >
  );
}

export default InvoiceEdit;
