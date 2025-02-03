import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  SimpleGrid,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import { Select } from "chakra-react-select";
import PrivateAccessModal from "components/access/PrivateAccessModal";
import StatementGenerateModal from "components/invoices/StatementGenerateModal";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { TabsComponent } from "components/tabs/TabsComponet";
import { GET_COMPANYS_QUERY } from "graphql/company";
import { GET_CUSTOMERS_QUERY } from "graphql/customer";
import { GET_INVOICE_TOTALS_QUERY, GET_INVOICES_QUERY } from "graphql/invoice";
import { GET_INVOICE_STATUSES_QUERY } from "graphql/invoiceStatus";
import { GET_JOB_CATEGORIES_QUERY } from "graphql/jobCategories";
import { formatCurrency } from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export default function InvoiceIndex() {
  let menuBg = useColorModeValue("white", "navy.800");
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceStatuses, setInvoiceStatuses] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [jobCategoryFilter, setJobCategoryFilter] = useState(null);
  const [stateFilter, setStateFilter] = useState(null);
  const [companyFilter, setCompanyFilter] = useState(null);
  const [tabs, setTabs] = useState([]);
  const { companyId, customerId, isAdmin, isCompanyAdmin, isCustomer } =
    useSelector((state: RootState) => state.user);
  const [companiesOptions, setCompaniesOptions] = useState([]);
  const [debouncedCompanySearch, setDebouncedCompanySearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState([]);
  const onChangeSearchCompany = useMemo(() => {
    return debounce((e) => {
      setDebouncedCompanySearch(e);
    }, 300);
  }, []);

  const onChangeSearchCustomer = useMemo(() => {
    return debounce((e) => {
      setDebouncedCustomerSearch(e);
    }, 300);
  }, []);
  // const companyId = useSelector((state: RootState) => state.user.companyId);
  // const customerId = useSelector((state: RootState) => state.user.customerId);
  // const isAdmin = useSelector((state: RootState) => state.user.isAdmin);
  // const isCompanyAdmin = useSelector(
  //   (state: RootState) => state.user.isCompanyAdmin,
  // );
  // const isCustomer = useSelector((state: RootState) => state.user.isCustomer);
  const [date, setDate] = useState("");
  const [rangeDate, setRangeDate] = useState([null, null]);
  const [tabId, setActiveTab] = useState(isAdmin == true ? 1 : 2);

  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isPrivateRoute =
    useSelector((state: RootState) => state.routes.routes).find(
      (route) => route.layout + route.path == router.pathname,
    )?.isPrivate || false;
  useEffect(() => {
    if (isPrivateRoute && isAdmin) onOpen();
  }, [isPrivateRoute]);

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const {
    isOpen: isStatementModalOpen,
    onOpen: onOpenStatementModal,
    onClose: onCloseStatementModal,
  } = useDisclosure();

  const stateOptions = [
    { value: "QLD", label: "Queensland" },
    { value: "VIC", label: "Victoria" },
    { value: "New South Wales", label: "New South Wales" },
    { value: "Western Australia", label: "Western Australia" },
    { value: "South Australia", label: "South Australia" },
    { value: "Tasmania", label: "Tasmania" },
  ];

  useQuery(GET_JOB_CATEGORIES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setJobCategories([]);
      data.jobCategorys.data.map((driverStatus: any) => {
        setJobCategories((jobCategories) => [
          ...jobCategories,
          {
            value: parseInt(driverStatus.id),
            label: driverStatus.name,
          },
        ]);
      });
    },
  });

  useQuery(GET_COMPANYS_QUERY, {
    variables: {
      query: debouncedCompanySearch,
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setCompaniesOptions([]);
      data.companys.data.map((_entity: any) => {
        setCompaniesOptions((companys) => [
          ...companys,
          {
            value: parseInt(_entity.id),
            label: _entity.name,
          },
        ]);
      });
    },
  });

  useQuery(GET_CUSTOMERS_QUERY, {
    variables: {
      query: debouncedCustomerSearch,
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setCustomerOptions([]);
      data.customers.data.map((customer: any) => {
        setCustomerOptions((customers) => [
          ...customers,
          {
            value: parseInt(customer.id),
            label: customer.full_name,
          },
        ]);
      });
    },
  });

  useQuery(GET_INVOICE_STATUSES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 20,
      orderByColumn: "id",
      orderByOrder: "DESC",
    },
    onCompleted: (data) => {
      setInvoiceStatuses([]);
      data.invoiceStatuses.data.map((invoiceStatus: any) => {
        if (!isAdmin && invoiceStatus.id == 1) return;
        setInvoiceStatuses((invoiceStatuses) => [
          ...invoiceStatuses,
          { value: invoiceStatus.id, label: invoiceStatus.name },
        ]);
        setTabs((tabs) => [
          ...tabs,
          {
            id: invoiceStatus?.id,
            name: invoiceStatus?.name,
            tabName: invoiceStatus?.name,
            hash: invoiceStatus?.name?.replace(/\s+/g, "_").toLowerCase(),
          },
        ]);
      });
    },
  });

  const columns = useMemo(
    () => [
      {
        Header: "ID",
        accessor: "name" as const,
      },
      {
        Header: "job",
        accessor: "job.name" as const,
      },
      {
        Header: "customer",
        accessor: "customer.full_name" as const,
        showCompany: true,
      },
      {
        Header: "date",
        accessor: "issued_at" as const,
        type: "date",
      },
      //{
      //  Header: "category",
      //  accessor: "category" as const,
      //},
      {
        Header: "approval status",
        accessor: "invoice_status.name" as const,
      },
      {
        Header: "amount",
        accessor: "total" as const,
        type: "money",
      },
      {
        Header: "Actions",
        accessor: "id" as const,
      },
    ],
    [],
  );

  const {
    loading,
    error,
    data: invoices,
    refetch: getInvoices,
  } = useQuery(GET_INVOICES_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      is_rcti: true,
      orderByColumn: "id",
      orderByOrder: "DESC",
      invoice_status_id: tabId,
      job_category_id: jobCategoryFilter,
      state: stateFilter,
      company_filter_id: companyFilter,
      customer_filter_ids: customerFilter,
      between_at:
        rangeDate && rangeDate[0]
          ? {
              from_at:
                rangeDate && rangeDate[0]
                  ? moment(rangeDate[0]).format("YYYY-MM-DD HH:mm:ss")
                  : undefined,
              to_at:
                rangeDate && rangeDate[1]
                  ? moment(rangeDate[1]).format("YYYY-MM-DD HH:mm:ss")
                  : undefined,
            }
          : undefined,
    },
    skip: !isAdmin,
  });

  const { data: invoiceTotals, refetch: getInvoiceTotals } = useQuery(
    GET_INVOICE_TOTALS_QUERY,
    {
      variables: {
        query: searchQuery,
        page: 1,
        first: 10000,
        is_rcti: true,
        orderByColumn: "id",
        orderByOrder: "DESC",
        invoice_status_id: tabId,
        job_category_id: jobCategoryFilter,
        state: stateFilter,
        company_filter_id: companyFilter,
        customer_filter_ids: customerFilter,
        between_at:
          rangeDate && rangeDate[0]
            ? {
                from_at:
                  rangeDate && rangeDate[0]
                    ? moment(rangeDate[0]).format("YYYY-MM-DD HH:mm:ss")
                    : undefined,
                to_at:
                  rangeDate && rangeDate[1]
                    ? moment(rangeDate[1]).format("YYYY-MM-DD HH:mm:ss")
                    : undefined,
              }
            : undefined,
      },
      skip: !isAdmin,
    },
  );

  const {
    loading: companyInvoiceLoading,
    error: companyInvoiceError,
    data: companyInvoices,
    refetch: getCompanyInvoices,
  } = useQuery(GET_INVOICES_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      is_rcti: true,
      orderByColumn: "id",
      orderByOrder: "DESC",
      invoice_status_id: !isAdmin && tabId == 1 ? 2 : tabId,
      company_id: companyId,
      job_category_id: jobCategoryFilter,
      state: stateFilter,
      between_at:
        rangeDate && rangeDate[0]
          ? {
              from_at:
                rangeDate && rangeDate[0]
                  ? moment(rangeDate[0]).format("YYYY-MM-DD HH:mm:ss")
                  : undefined,
              to_at:
                rangeDate && rangeDate[1]
                  ? moment(rangeDate[1]).format("YYYY-MM-DD HH:mm:ss")
                  : undefined,
            }
          : undefined,
    },
    skip: !isCompanyAdmin,
  });

  const {
    loading: customerInvoiceLoading,
    error: customerInvoiceError,
    data: customerInvoices,
    refetch: getCustomerInvoices,
  } = useQuery(GET_INVOICES_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      is_rcti: true,
      orderByColumn: "id",
      orderByOrder: "DESC",
      invoice_status_id: !isAdmin && tabId == 1 ? 2 : tabId,
      customer_id: customerId,
      job_category_id: jobCategoryFilter,
      state: stateFilter,
      company_filter_id: companyFilter,
      customer_filter_ids: customerFilter,
      between_at:
        rangeDate && rangeDate[0]
          ? {
              from_at:
                rangeDate && rangeDate[0]
                  ? moment(rangeDate[0]).format("YYYY-MM-DD HH:mm:ss")
                  : undefined,
              to_at:
                rangeDate && rangeDate[1]
                  ? moment(rangeDate[1]).format("YYYY-MM-DD HH:mm:ss")
                  : undefined,
            }
          : undefined,
    },
    skip: !isCustomer || isCompanyAdmin,
  });

  useEffect(() => {
    onChangeSearchQuery.cancel();
  });

  useEffect(() => {
    if (isAdmin) {
      getInvoices();
      getInvoiceTotals();
    } else if (isCompanyAdmin) getCompanyInvoices();
    else if (!isCustomer || isCompanyAdmin) getCustomerInvoices();
    else return;
  }, [jobCategoryFilter]);

  useEffect(() => {
    if (isAdmin) {
      getInvoices();
      getInvoiceTotals();
    } else if (isCompanyAdmin) getCompanyInvoices();
    else if (!isCustomer || isCompanyAdmin) getCustomerInvoices();
    else return;
  }, [stateFilter]);

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        <SimpleGrid
          mb="20px"
          pt="32px"
          px="24px"
          columns={{ sm: 1 }}
          spacing={{ base: "20px", xl: "20px" }}
        >
          <Flex minWidth="max-content" justifyContent="space-between">
            <h1 className="mb-0">Customer Invoices</h1>
            {/* <SearchBar
              background={menuBg}
              onChangeSearchQuery={onChangeSearchQuery}
              me="10px"
              borderRadius="30px"
            /> */}
            {/* <Link href="/admin/invoices/create">
              <Button colorScheme="blue">Create New</Button>
            </Link> */}
            <Button
              fontSize="sm"
              lineHeight="19px"
              variant="brand"
              fontWeight="500"
              w="20%"
              h="50"
              mb="0"
              ms="10px"
              className="!h-[39px]"
              onClick={() => {
                onOpenStatementModal();
              }}
            >
              Generate Statement PDF
            </Button>
          </Flex>
        </SimpleGrid>
      </Box>

      {/* TODO: Should this be https://chakra-ui.com/docs/components/tabs instead? */}
      <SimpleGrid className="text-sm text-center font-bold border-b border-[var(--chakra-colors-gray-200)]">
        <Flex className="pl-5">
          <TabsComponent
            tabs={tabs}
            onChange={(tabId) => setActiveTab(tabId)}
          />
        </Flex>
      </SimpleGrid>
      {/* END Tabs */}

      <Box pt="0px">
        <SimpleGrid
          mb="20px"
          pt="16px"
          px="24px"
          columns={{ sm: 1 }}
          spacing={{ base: "20px", xl: "20px" }}
        >
          <Flex justifyContent="space-between" alignItems="center">
            <Box
              alignItems="center"
              flexDirection="column"
              w="30%"
              maxW="max-content"
              p="10px 10px"
              h="max-content"
            >
              {/* @ts-ignore */}
              <DateRangePicker value={rangeDate} onChange={setRangeDate} />
            </Box>
            <Box className="!max-w-md" p="10px 10px" h="max-content" w="20%">
              <Select
                placeholder="Company"
                options={companiesOptions}
                size="lg"
                className="select mb-0"
                classNamePrefix="two-easy-select"
                onInputChange={(e) => {
                  onChangeSearchCompany(e);
                }}
                onChange={(e) => setCompanyFilter(e?.value || null)}
                isClearable={true}
              ></Select>
            </Box>
            <Box className="!max-w-md" p="10px 10px" h="max-content" w="20%">
              <Select
                placeholder="User"
                isMulti
                options={customerOptions}
                size="lg"
                className="select mb-0"
                classNamePrefix="two-easy-select"
                onInputChange={(e) => {
                  onChangeSearchCustomer(e);
                }}
                onChange={(e) =>
                  setCustomerFilter(e ? e.map((item) => item.value) : null)
                }
                isClearable={true}
              ></Select>
            </Box>
            <Box className="!max-w-md" p="10px 10px" h="max-content" w="15%">
              <Select
                placeholder="State"
                options={stateOptions}
                size="lg"
                className="select mb-0"
                classNamePrefix="two-easy-select"
                onChange={(e) => setStateFilter(e?.value || null)}
                isClearable={true}
              ></Select>
            </Box>
            <Box className="!max-w-md" p="10px 10px" h="max-content" w="15%">
              <Select
                placeholder="Job Category"
                options={jobCategories}
                size="lg"
                className="select mb-0"
                classNamePrefix="two-easy-select"
                onChange={(e) => setJobCategoryFilter(e?.value || null)}
                isClearable={true}
              ></Select>
            </Box>
            <Box
              alignItems="center"
              flexDirection="column"
              w="100%"
              maxW="max-content"
              p="10px 10px"
              h="max-content"
            >
              {/* @ts-ignore */}
              Invoice Total:{" "}
              {invoiceTotals
                ? formatCurrency(
                    invoiceTotals?.invoices.data.reduce(
                      (a: any, b: any) => a + b.total,
                      0,
                    ),
                  )
                : "-"}
            </Box>

            {/* TODO: Search per tab search */}
            <SearchBar
              background={menuBg}
              onChangeSearchQuery={onChangeSearchQuery}
            />
          </Flex>
          <Divider className="!my-0 !py-0" />

          {isAdmin && !loading && invoices?.invoices.data.length >= 0 && (
            <PaginationTable
              columns={columns}
              data={invoices?.invoices.data}
              options={{
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                },
                manualPagination: true,
                pageCount: invoices?.invoices.paginatorInfo.lastPage,
              }}
              setQueryPageIndex={setQueryPageIndex}
              setQueryPageSize={setQueryPageSize}
              isServerSide
            />
          )}

          {isCompanyAdmin &&
            !companyInvoiceLoading &&
            companyInvoices?.invoices.data.length >= 0 && (
              <PaginationTable
                columns={columns}
                data={companyInvoices?.invoices.data}
                options={{
                  initialState: {
                    pageIndex: queryPageIndex,
                    pageSize: queryPageSize,
                  },
                  manualPagination: true,
                  pageCount: companyInvoices?.invoices.paginatorInfo.lastPage,
                }}
                setQueryPageIndex={setQueryPageIndex}
                setQueryPageSize={setQueryPageSize}
                isServerSide
              />
            )}

          {isCustomer &&
            !customerInvoiceLoading &&
            customerInvoices?.invoices.data.length >= 0 && (
              <PaginationTable
                columns={columns}
                data={customerInvoices?.invoices.data}
                options={{
                  initialState: {
                    pageIndex: queryPageIndex,
                    pageSize: queryPageSize,
                  },
                  manualPagination: true,
                  pageCount: customerInvoices?.invoices.paginatorInfo.lastPage,
                }}
                setQueryPageIndex={setQueryPageIndex}
                setQueryPageSize={setQueryPageSize}
                isServerSide
              />
            )}
        </SimpleGrid>
      </Box>
      <PrivateAccessModal isOpen={isOpen} onClose={onClose} />

      <StatementGenerateModal
        isOpen={isStatementModalOpen}
        onClose={onCloseStatementModal}
      />
    </AdminLayout>
  );
}
