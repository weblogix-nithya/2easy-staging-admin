import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Link,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { TabsComponent } from "components/tabs/TabsComponet";
import { GET_VEHICLE_HIRES_QUERY } from "graphql/vehicleHire";
import { formatTimeUTCtoInput } from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export default function VehicleHireIndex() {
  let menuBg = useColorModeValue("white", "navy.800");
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyVehicleHires, setCompanyVehicleHires] = useState(null);
  const [vehicleHires, setVehicleHires] = useState(null);
  const isAdmin = useSelector((state: RootState) => state.user.isAdmin);
  const customerId = useSelector((state: RootState) => state.user.customerId);
  const companyId = useSelector((state: RootState) => state.user.companyId);
  const isCompany = useSelector((state: RootState) => state.user.isCompany);
  const isCustomer = useSelector((state: RootState) => state.user.isCustomer);
  const [isCompleted, setIsCompleted] = useState(false); // 1 = pending, 2 = active, 4 = inactive

  const tabs = [
    {
      id: 1,
      tabName: "Open",
      hash: "open",
    },
    {
      id: 2,
      tabName: "Complete",
      hash: "complete",
    },
  ];
  const changeTab = useMemo(() => {
    return debounce((tab) => {
      setIsCompleted(tab == 2 ? true : false);
      setQueryPageIndex(0);
    }, 300);
  }, []);
  useEffect(() => {
    if (isAdmin) {
      getVehicleHires();
    }
    if (isCompany) {
      getCompanyVehicleHires();
    }
  }, [queryPageIndex, queryPageSize, searchQuery, isCompleted]);

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: "Hire Id",
        accessor: "name" as const,
      },
      {
        Header: "Booked By",
        accessor: "customer.full_name" as const,
      },
      {
        Header: "Vechicle hire",
        accessor: "vehicle_type.name" as const,
      },
      {
        Header: "Status",
        accessor: "vehicle_hire_status.name" as const,
      },
      {
        Header: "Date",
        accessor: "hire_from_at" as const,
        type: "date",
      },
      {
        Header: "Pickup From",
        accessor: "address" as const,
      },
      {
        Header: "Time",
        accessor: "time_range" as const,
        type: "time",
      },
      {
        Header: "Actions",
        accessor: "id" as const,
        isView: isCustomer,
        isEdit: isAdmin,
      },
    ],
    [isCustomer, isAdmin],
  );

  const {
    loading,
    error,
    data: vehicle_hire_data,
    refetch: getVehicleHires,
  } = useQuery(GET_VEHICLE_HIRES_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "DESC",
      vehicle_hire_status_id: isCompleted ? [7, 8, 9] : [1, 2, 3, 4, 5, 6],
    },
    onCompleted: (data) => {
      //add time range
      let _newData = getNewData(data.vehicleHires.data);
      setVehicleHires({
        ...data,
        vehicleHires: { ...data.vehicleHires, data: _newData },
      });
    },
    skip: !isAdmin,
  });
  function getNewData(data: any) {
    let newData = data.map((item: any) => {
      let timeRange =
        formatTimeUTCtoInput(item.hire_from_at) +
        " - " +
        formatTimeUTCtoInput(item.hire_to_at);
      return { ...item, time_range: timeRange };
    });
    return newData;
  }

  const {
    loading: companyVehicleHiresLoading,
    error: companyVehicleHiresError,
    data: cvehicleHires,
    refetch: getCompanyVehicleHires,
  } = useQuery(GET_VEHICLE_HIRES_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "DESC",
      customer_id: parseInt(customerId),
      vehicle_hire_status_id: isCompleted ? [7, 8, 9] : undefined,
    },
    onCompleted: (data) => {
      //add time range
      let _newData = getNewData(data.vehicleHires.data);
      setCompanyVehicleHires({
        ...data,
        vehicleHires: { ...data.vehicleHires, data: _newData },
      });
    },
    skip: !isCompany,
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
          <Flex minWidth="max-content" alignItems="center">
            <h1>Hourly Hire</h1>
            <SearchBar
              onChangeSearchQuery={onChangeSearchQuery}
              placeholder="Search delivery vehicle_hires"
              background={menuBg}
              me="10px"
            />

            <Link href="/admin/vehicle-hires/create">
              <Button colorScheme="blue">
                {isCompany ? "New booking" : "Create"}
              </Button>
            </Link>
          </Flex>
          <TabsComponent tabs={tabs} onChange={(tabId) => changeTab(tabId)} />
          {isAdmin && !loading && vehicleHires?.vehicleHires.data.length >= 0 && (
            <PaginationTable
              columns={columns}
              data={vehicleHires?.vehicleHires.data}
              options={{
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                },
                manualPagination: true,
                pageCount: vehicleHires?.vehicleHires.paginatorInfo.lastPage,
              }}
              setQueryPageIndex={setQueryPageIndex}
              setQueryPageSize={setQueryPageSize}
              isServerSide
            />
          )}

          {isCompany &&
            !companyVehicleHiresLoading &&
            companyVehicleHires?.vehicleHires.data.length >= 0 && (
              <PaginationTable
                columns={columns}
                data={companyVehicleHires?.vehicleHires.data}
                options={{
                  initialState: {
                    pageIndex: queryPageIndex,
                    pageSize: queryPageSize,
                  },
                  manualPagination: true,
                  pageCount:
                    companyVehicleHires?.vehicleHires.paginatorInfo.lastPage,
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
