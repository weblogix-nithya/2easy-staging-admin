import { useQuery } from "@apollo/client";
import {
  Box,
  Divider,
  Flex,
  SimpleGrid,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import PrivateAccessModal from "components/access/PrivateAccessModal";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { TabsComponent } from "components/tabs/TabsComponet";
import { GET_INVOICES_QUERY } from "graphql/invoice";
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
  const [tabs, setTabs] = useState([
    { id: 1, name: "Pending", tabName: "Pending", hash: "pending" },
    { id: 6, name: "Processed", tabName: "Processed", hash: "processed" },
  ]);
  const { companyId, customerId, isAdmin, isCompanyAdmin, isCustomer } =
    useSelector((state: RootState) => state.user);
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

  const columns = useMemo(
    () => [
      {
        Header: "ID",
        accessor: "name" as const,
      },
      {
        Header: "date",
        accessor: "issued_at" as const,
        type: "date",
      },
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
      is_rcti: false,
      orderByColumn: "id",
      orderByOrder: "DESC",
      invoice_status_id: tabId,
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

  useEffect(() => {
    onChangeSearchQuery.cancel();
  });

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
          <Flex minWidth="max-content">
            <h1 className="mb-0">Driver RCTIs</h1>
            {/* <SearchBar
              background={menuBg}
              onChangeSearchQuery={onChangeSearchQuery}
              me="10px"
              borderRadius="30px"
            /> */}
            {/* <Link href="/admin/invoices/create">
              <Button colorScheme="blue">Create New</Button>
            </Link> */}
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
              w="100%"
              maxW="max-content"
              p="10px 10px"
              h="max-content"
            >
              {/* @ts-ignore */}
              <DateRangePicker value={rangeDate} onChange={setRangeDate} />
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
        </SimpleGrid>
      </Box>
      <PrivateAccessModal isOpen={isOpen} onClose={onClose} />
    </AdminLayout>
  );
}
