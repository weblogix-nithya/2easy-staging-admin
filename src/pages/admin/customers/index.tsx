import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Link,
  SimpleGrid,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import PrivateAccessModal from "components/access/PrivateAccessModal";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { GET_CUSTOMERS_QUERY } from "graphql/customer";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
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

  const {
    loading,
    error,
    data: customers,
    refetch: getCustomers,
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
    error: companyCustomerError,
    data: companyCustomers,
    refetch: getCompanyCustomers,
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
  });

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

          {isAdmin && !loading && customers?.customers.data.length >= 0 && (
            <PaginationTable
              columns={columns}
              data={customers?.customers.data}
              options={{
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                },
                manualPagination: true,
                pageCount: customers?.customers.paginatorInfo.lastPage,
              }}
              setQueryPageIndex={setQueryPageIndex}
              setQueryPageSize={setQueryPageSize}
              isServerSide
            />
          )}

          {isCompany &&
            !companyCustomerLoading &&
            companyCustomers?.customers.data.length >= 0 && (
              <PaginationTable
                columns={columns}
                data={companyCustomers?.customers.data}
                options={{
                  initialState: {
                    pageIndex: queryPageIndex,
                    pageSize: queryPageSize,
                  },
                  manualPagination: true,
                  pageCount: companyCustomers?.customers.paginatorInfo.lastPage,
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
