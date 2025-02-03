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
import { GET_COMPANYS_QUERY } from "graphql/company";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export default function CompanyIndex() {
  let menuBg = useColorModeValue("white", "navy.800");
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const isAdmin = useSelector((state: RootState) => state.user.isAdmin);
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
    error,
    data: companys,
    refetch: getCompanys,
  } = useQuery(GET_COMPANYS_QUERY, {
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
        <SimpleGrid
          mb="20px"
          pt="32px"
          px="24px"
          columns={{ sm: 1 }}
          spacing={{ base: "20px", xl: "20px" }}
        >
          <Flex minWidth="max-content">
            <h1 className="mb-0">Companies</h1>
            <SearchBar
              onChangeSearchQuery={onChangeSearchQuery}
              placeholder="Search companies"
              me="10px"
              background={menuBg}
            />
            <Link href="/admin/companies/create">
              <Button variant="primary">Create New</Button>
            </Link>
          </Flex>

          {!loading && companys?.companys.data.length >= 0 && (
            <PaginationTable
              columns={columns}
              data={companys?.companys.data}
              options={{
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                },
                manualPagination: true,
                pageCount: companys?.companys.paginatorInfo.lastPage,
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
