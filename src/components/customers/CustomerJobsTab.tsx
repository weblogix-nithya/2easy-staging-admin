import { useQuery } from "@apollo/client";
import {
  Box,
  Divider,
  Flex,
  SimpleGrid,
  useColorModeValue,
  // useDisclosure,
  // useToast,
} from "@chakra-ui/react";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { GET_JOBS_QUERY } from "graphql/job";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";

export default function CustomerJobsTab(props: any) {
  // const toast = useToast();
  const { customer } = props;
  // const textColor = useColorModeValue("navy.700", "white");
  let menuBg = useColorModeValue("white", "navy.800");

  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  // const { isOpen, onOpen, onClose } = useDisclosure();

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: "Delivery ID",
        accessor: "name" as const,
      },
      {
        Header: "Category",
        accessor: "driver.name" as const,
      },
      {
        Header: "Type",
        accessor: "job_type.name" as const,
      },
      {
        Header: "Status",
        accessor: "job_status.name" as const,
      },
      {
        Header: "Date",
        accessor: "start_at" as const,
      },
      {
        Header: "Pickup From",
        accessor: "job_pickup_cities" as const,
      },
      {
        Header: "Deliver To",
        accessor: "job_destination_cities" as const,
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
    data: customerJobs,
    // refetch: getJobs,
  } = useQuery(GET_JOBS_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderBy: [{ column: "id", order: "DESC" }],
      customer_id: parseInt(customer.id),
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
        <h2 className="mb-0">Deliveries</h2>
      </Flex>

      <Divider className="my-6" />

      <Box>
        <SimpleGrid columns={{ sm: 1 }} spacing={{ base: "20px", xl: "20px" }}>
          <Flex minWidth="max-content">
            <SearchBar
              background={menuBg}
              onChangeSearchQuery={onChangeSearchQuery}
            />
          </Flex>

          {!loading && customerJobs?.jobs.data.length >= 0 && (
            <div className="overflow-auto">
              <PaginationTable
                columns={columns}
                data={customerJobs?.jobs.data}
                options={{
                  initialState: {
                    pageIndex: queryPageIndex,
                    pageSize: queryPageSize,
                  },
                  manualPagination: true,
                  pageCount: customerJobs?.jobs.paginatorInfo.lastPage,
                }}
                setQueryPageIndex={setQueryPageIndex}
                setQueryPageSize={setQueryPageSize}
                isServerSide
                path="/admin/jobs"
              />
            </div>
          )}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
