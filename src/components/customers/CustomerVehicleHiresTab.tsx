import { useQuery } from "@apollo/client";
import {
  Box,
  Divider,
  Flex,
  SimpleGrid,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { GET_VEHICLE_HIRES_QUERY } from "graphql/vehicleHire";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";

export default function CustomerVehicleHiresTab(props: any) {
  const toast = useToast();
  const { customer } = props;
  const textColor = useColorModeValue("navy.700", "white");
  let menuBg = useColorModeValue("white", "navy.800");

  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: "Hire ID",
        accessor: "name" as const,
      },
      {
        Header: "Vehicle Type",
        accessor: "vehicle_type.name" as const,
      },
      {
        Header: "Status",
        accessor: "vehicle_hire_status.name" as const,
      },
      {
        Header: "Date",
        accessor: "hire_from_at" as const,
      },
      {
        Header: "Pickup From",
        accessor: "address_city" as const,
      },
      {
        Header: "Time",
        accessor: "hire_to_at" as const, // TODO:: Fix this later
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
    data: customerVehicleHires,
    refetch: getVehicleHires,
  } = useQuery(GET_VEHICLE_HIRES_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "DESC",
      customer_id: customer.id,
    },
  });

  useEffect(() => {
    // onChangeSearchQuery.cancel();
  }, []);

  return (
    <Box
      h={{
        base: "calc(100vh - 130px)",
        md: "calc(100vh - 97px)",
        xl: "calc(100vh - 97px)",
      }}
      backgroundColor="white"
      sx={{ overflow: "scroll" }}
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
        className="mt-8"
        width="100%"
      >
        <h2 className="mb-0">Vehicle Hire</h2>
      </Flex>

      <Divider className="my-6" />

      <Box>
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
          </Flex>

          {!loading && customerVehicleHires?.vehicleHires.data.length >= 0 && (
            <PaginationTable
              columns={columns}
              data={customerVehicleHires?.vehicleHires.data}
              options={{
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                },
                manualPagination: true,
                pageCount:
                  customerVehicleHires?.vehicleHires.paginatorInfo.lastPage,
              }}
              setQueryPageIndex={setQueryPageIndex}
              setQueryPageSize={setQueryPageSize}
              isServerSide
              path="/admin/vehicle-hires"
            />
          )}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
