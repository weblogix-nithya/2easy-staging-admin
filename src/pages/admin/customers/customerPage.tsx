import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Grid,
  Link,
  SimpleGrid,
  Toast,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import PrivateAccessModal from "components/access/PrivateAccessModal";
import ApprovalRequiredTab from "./components/approvalRequiredTab";
import CustomerTab from "./components/customerTab";

import { SearchBar } from "components/navbar/searchBar/SearchBar";
// import PaginationTable from "components/table/PaginationTable";
import { TabsComponent } from "components/tabs/TabsComponet";
import { GET_CUSTOMERS_QUERY } from "graphql/customer";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export default function CustomerIndex() {
  let menuBg = useColorModeValue("white", "navy.800");
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const { companyId, isCompany, isAdmin } = useSelector(
    (state: RootState) => state.user,
  );
  const [tabId, setActiveTab] = useState(1);
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isPrivateRoute =
    useSelector((state: RootState) => state.routes.routes).find(
      (route) => route.layout + route.path == router.pathname,
    )?.isPrivate || false;
  useEffect(() => {
    if (isPrivateRoute && isAdmin) onOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivateRoute]);

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const tabs = [
    {
      id: 1,
      tabName: "Customers",
      hash: "CustomersList",
      isVisible: true,
    },
    {
      id: 2,
      tabName: "Approval required",
      hash: "approvalRequired",
      isVisible: true,
    },
  ];

  const columns = useMemo(
    () => [
      {
        Header: "First Name",
        accessor: "first_name" as const,
      },
      {
        Header: "Last Name",
        accessor: "last_name" as const,
      },
      {
        Header: "Company Name",
        accessor: "company_name" as const,
      },
      {
        Header: "Actions",
        accessor: "id" as const,
      },
    ],
    [],
  );

    const approveColumns = useMemo(
    () => [
      {
        Header: "First Name",
        accessor: "first_name" as const,
      },
      {
        Header: "Last Name",
        accessor: "last_name" as const,
      },
      {
        Header: "Company Name",
        accessor: "company_name" as const,
      },
      {
        Header: "Actions",
        accessor: "id" as const,
        isApprove: isAdmin,
      },
    ],
    [],
  );
  const {
    loading,
    // error,
    data: customers,
    // refetch: getCustomers,
  } = useQuery(GET_CUSTOMERS_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    skip: !isAdmin,
  });

  const {
    loading: companyCustomerLoading,
    // error: companyCustomerError,
    data: companyCustomers,
    // refetch: getCompanyCustomers,
  } = useQuery(GET_CUSTOMERS_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "ASC",
      company_id: companyId,
    },
    skip: !isCompany,
  });

  useEffect(() => {
    onChangeSearchQuery.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const handleTabChange = useCallback(
    async (nextTabId: number) => {
      // A) If it’s the same tab, do nothing
      if (nextTabId === tabId) return;

      // B) Switch tab immediately to avoid re-firing from TabsComponent
      setActiveTab(nextTabId);

      // C) Only these tabs need a refresh
      const needsRefresh = nextTabId === 2;
      if (!needsRefresh) return;

      // D) Prevent concurrent / repeated refetches
      // if (refetchingRef.current) return;
      // refetchingRef.current = true;

      try {
        // const { data } = await getJob(); // Apollo refetch from useQuery
        // if (data?.job) {
        // wherever you store the fresh copy for reports
        // setReportJob((prev) => ({ ...prev, ...data.job }));
        // or if you kept defaultReportJob:
        // setReportJob({ ...defaultReportJob, ...data.job });
        // }
      } catch (e) {
        console.error("Refetch failed:", e);
        Toast({
          title: "Couldn’t refresh data",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        // refetchingRef.current = false;
      }
    },
    [tabId],
  );

  return (
    <AdminLayout>
      <Box
        pt={{ base: "130px", md: "97px", xl: "97px" }}
        className="mk-admin-customers"
      >
        <SimpleGrid
          mb="20px"
          pt="32px"
          px="24px"
          columns={{ sm: 1 }}
          spacing={{ base: "20px", xl: "20px" }}
        >
          <Flex minWidth="max-content">
            <h1 className="mb-0">{isAdmin ? "Customers" : "My Users"}</h1>
            <SearchBar
              onChangeSearchQuery={onChangeSearchQuery}
              placeholder="Search customers"
              me="10px"
              background={menuBg}
            />

            <Link href="/admin/customers/create">
              <Button variant="primary">Create New</Button>
            </Link>
          </Flex>
        </SimpleGrid>
      </Box>
      <Grid pl="6" backgroundColor="white">
        <TabsComponent tabs={tabs} onChange={handleTabChange} />
        {tabId == 1 && (
          <CustomerTab
            isAdmin={isAdmin}
            isCompany={isCompany}
            loading={loading}
            customers={customers}
            companyCustomerLoading={companyCustomerLoading}
            companyCustomers={companyCustomers}
            columns={columns}
            queryPageIndex={queryPageIndex}
            queryPageSize={queryPageSize}
            setQueryPageIndex={setQueryPageIndex}
            setQueryPageSize={setQueryPageSize}
          />
        )}
        {tabId == 2 && (
          <ApprovalRequiredTab
            approveColumns={approveColumns}
            queryPageIndex={queryPageIndex}
            queryPageSize={queryPageSize}
            setQueryPageIndex={setQueryPageIndex}
            setQueryPageSize={setQueryPageSize}
          />
        )}{" "}
      </Grid>

      <PrivateAccessModal isOpen={isOpen} onClose={onClose} />
    </AdminLayout>
  );
}
