import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Image,
  Link,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { TabsComponent } from "components/tabs/TabsComponet";
import { GET_DRIVERS_QUERY } from "graphql/driver";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";

export default function DriverIndex() {
  let menuBg = useColorModeValue("white", "navy.800");
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [driverStatusId, setDriverStatusId] = useState(1); // 1 = pending, 2 = active, 4 = inactive
  const [tabId, setActiveTab] = useState(1); // 1 = pending, 2 = active, 4 = inactive

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const tabs = [
    {
      id: 1,
      tabName: "Pending",
      hash: "pending",
    },
    {
      id: 2,
      tabName: "Active",
      hash: "active",
    },
    {
      id: 4,
      tabName: "Inactive",
      hash: "inactive",
    },
  ];

  const changeTab = useMemo(() => {
    return debounce((tab) => {
      setActiveTab(tab);
      setDriverStatusId(tab);
      setQueryPageIndex(0);
    }, 300);
  }, [setActiveTab]);

  const columns = useMemo(
    () => [
      {
        Header: "photo",
        accessor: "media_url" as const,
        Cell: (tableProps: any) => (
          <Image
            src={tableProps.row.original.media_url}
            alt="image"
            fit="cover"
            style={{ borderRadius: "50%" }}
            width="48px"
            height="48px"
          ></Image>
        ),
      },
      {
        Header: "Name",
        accessor: "full_name" as const,
      },
      {
        Header: "Vehicle Type",
        accessor: "vehicle_type.name" as const,
      },
      {
        Header: "Vehicle Details",
        accessor: "vehicle_class.name" as const,
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
    data: drivers,
    refetch: getDrivers,
  } = useQuery(GET_DRIVERS_QUERY, {
    variables: {
      query: searchQuery,
      driverStatusId: driverStatusId,
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
            <h1 className="mb-0">Drivers</h1>
            <SearchBar
              onChangeSearchQuery={onChangeSearchQuery}
              placeholder="Search drivers"
              me="10px"
              background={menuBg}
            />

            <Link href="/admin/drivers/create">
              <Button variant="primary">Create New</Button>
            </Link>
          </Flex>

          <TabsComponent tabs={tabs} onChange={(tabId) => changeTab(tabId)} />

          {!loading && drivers?.drivers.data.length >= 0 && (
            <PaginationTable
              columns={columns}
              data={drivers?.drivers.data}
              options={{
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                },
                manualPagination: true,
                pageCount: drivers?.drivers.paginatorInfo.lastPage,
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
