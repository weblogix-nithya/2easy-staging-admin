import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  Link,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { GET_USERS_QUERY } from "graphql/user";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";

export default function UserIndex() {
  let menuBg = useColorModeValue("white", "navy.800");
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name" as const,
      },
      {
        Header: "Email",
        accessor: "email" as const,
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
    data: users,
    refetch: getUsers,
  } = useQuery(GET_USERS_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
  });

  useEffect(() => {
    onChangeSearchQuery.cancel();
  });

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "97px", xl: "97px" }}>
        <SimpleGrid mb="20px" pt="32px" px="24px" columns={{ sm: 1 }}>
          <Flex
            minWidth="max-content"
            alignItems="center"
            justifyContent="space-between"
            className="mb-4"
          >
            <h1 className="mb-0">Users</h1>

            <Link href="/admin/users/create">
              <Button variant="primary">Create New</Button>
            </Link>
          </Flex>

          <Flex minWidth="max-content" className="!flex-start">
            <SearchBar
              ms="0"
              placeholder="Search users"
              onChangeSearchQuery={onChangeSearchQuery}
              background={menuBg}
              borderRadius="8px"
            />
          </Flex>

          <Divider className="mt-6 mb-0" />

          {!loading && !error && users?.users.data.length > 0 && (
            <PaginationTable
              columns={columns}
              data={users?.users.data}
              options={{
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                },
                manualPagination: true,
                pageCount: users?.users.paginatorInfo.lastPage,
              }}
              setQueryPageIndex={setQueryPageIndex}
              setQueryPageSize={setQueryPageSize}
              isServerSide
            />
          )}
        </SimpleGrid>
      </Box>
    </AdminLayout>
  );
}
