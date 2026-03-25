import { useQuery } from "@apollo/client";
import {
  Box,
  SimpleGrid,
} from "@chakra-ui/react";
import PaginationTable from "components/table/PaginationTable";
import { GET_JOB_LOGS_QUERY } from "graphql/job";
import { useRouter } from "next/router";
// import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
// import { useSelector } from "react-redux";
// import { RootState } from "store/store";

export default function InvoiceTab(props: {
  jobObjectId: any;
  activeTab: any;
}) {
  const { jobObjectId, activeTab } = props;
  console.log(jobObjectId, activeTab, "jobObjectId,t");
  // const toast = useToast();
  const router = useRouter();
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(100);

  const columns = useMemo(
    () => [
      {
        Header: "User",
        accessor: "user.name",
      },
      {
        Header: "Action",
        accessor: "action",
      },
      {
        Header: "Field",
        accessor: "field",
      },
      {
        Header: "Old Value",
        accessor: "old_value",
      },
      {
        Header: "New Value",
        accessor: "new_value",
      },
      {
        Header: "Mail Sent",
        accessor: "mail_sent",
        type: "boolean",
        trueLabel: "Yes",
        falseLabel: "No",
      },
      {
        Header: "Date",
        accessor: "created_at",
      },
    ],
    [],
  );
  // const isAdmin = useSelector((state: RootState) => state.user.isAdmin);

  // const textColor = useColorModeValue("navy.700", "white");

  const { loading: jobLogsLoading, data: jobLogsData } = useQuery(
    GET_JOB_LOGS_QUERY,
    {
      variables: {
        job_id: Number(jobObjectId),
        first: 50,
      },
      skip: !router.isReady || !jobObjectId || activeTab !== "audit", // ✅ ONLY runs for Invoice tab
      fetchPolicy: "network-only",
    },
  );

  // const logs = jobLogsData?.jobLogs?.data || [];
  return (
    <Box mt={5}>
      <SimpleGrid
        mb="20px"
        columns={{ sm: 1 }}
        spacing={{ base: "20px", xl: "20px" }}
      >
        {/* <Flex minWidth="max-content">
                            <SearchBar
                              background={menuBg}
                              onChangeSearchQuery={onChangeSearchQuery}
                              me="10px"
                              borderRadius="30px"
                            />
                          </Flex> */}

        {!jobLogsLoading && jobLogsData?.jobLogs?.data.length >= 0 && (
          <PaginationTable
            columns={columns}
            showDelete={true}
            data={jobLogsData?.jobLogs?.data}
            // options={{
            //   initialState: {
            //     pageIndex: queryPageIndex,
            //     pageSize: queryPageSize,
            //   },
            //   manualPagination: true,
            //   pageCount:
            //     jobLogsData?.jobLogs?.data.paginatorInfo.lastPage,
            // }}
            setQueryPageIndex={setQueryPageIndex}
            setQueryPageSize={setQueryPageSize}
            isServerSide
            path="/admin/jobs"
          />
        )}
      </SimpleGrid>
    </Box>
  );
}
