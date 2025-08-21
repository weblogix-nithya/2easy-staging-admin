import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Link,
  SimpleGrid,
  Spacer,
  useColorModeValue,
} from "@chakra-ui/react";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { GET_CUSTOMER_ADDRESSES_QUERY } from "graphql/customerAddress";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";

export default function CustomerAddressIndex() {
  let menuBg = useColorModeValue("white", "navy.800");
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(10);
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
        Header: "Actions",
        accessor: "id" as const,
      },
    ],
    [],
  );

  const {
    loading,
    // error,
    data: customerAddresses,
    // refetch: getCustomerAddresses,
  } = useQuery(GET_CUSTOMER_ADDRESSES_QUERY, {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        <SimpleGrid
          mb="20px"
          columns={{ sm: 1 }}
          spacing={{ base: "20px", xl: "20px" }}
        >
          <Flex minWidth="max-content">
            <SearchBar
              background={menuBg}
              onChangeSearchQuery={onChangeSearchQuery}
              me="10px"
              borderRadius="30px"
            />
            <Spacer />
            <Link href="/admin/customer-addresses/create">
              <Button colorScheme="blue">Create</Button>
            </Link>
          </Flex>

          {!loading && customerAddresses?.customerAddresses.data.length >= 0 && (
            <PaginationTable
              columns={columns}
              data={customerAddresses?.customerAddresses.data}
              options={{
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                },
                manualPagination: true,
                pageCount:
                  customerAddresses?.customerAddresses.paginatorInfo.lastPage,
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
