import { useQuery } from "@apollo/client";
import { Box, SimpleGrid } from "@chakra-ui/react";
import PaginationTable from "components/table/PaginationTable";
import { TabsComponent } from "components/tabs/TabsComponet";
import { GET_QUOTES_QUERY } from "graphql/quote";
import { GET_QUOTE_STATUSES_QUERY } from "graphql/quoteStatus";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export default function QuoteTabPanel(props: {
  categoryId: Number;
  searchQuery: String;
  queryPageIndex: number;
}) {
  const { categoryId, searchQuery, queryPageIndex } = props;
  const [queryPageIndexChild, setQueryPageIndexChild] =
    useState(queryPageIndex);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const { isAdmin, isCustomer, customerId } = useSelector(
    (state: RootState) => state.user,
  );

  const [tabs, setTabs] = useState([]);
  const [tabId, setActiveTab] = useState(1);

  const columns = useMemo(
    () => [
      {
        Header: "Quote Number",
        accessor: "name" as const,
      },
      {
        Header: "Client Name",
        accessor: "customer_name" as const,
      },
      {
        Header: "Service Type",
        accessor: "quote_service.name" as const,
      },
      {
        Header: "Urgency",
        accessor: "quote_type.name" as const,
      },
      {
        Header: "Date Required",
        accessor: "date_required" as const,
        type: "date",
      },
      {
        Header: "Quote Submission Time / Date",
        accessor: "created_at" as const,
        type: "date",
      },
      {
        Header: "Actions",
        accessor: "id" as const,
      },
    ],
    [],
  );

  useQuery(GET_QUOTE_STATUSES_QUERY, {
    onCompleted: (data) => {
      data.quoteStatuses.map((status: any) => {
        setTabs((tabs) => [
          ...tabs,
          {
            id: status?.id,
            name: status?.name,
            tabName: status?.name,
            hash: status?.name?.replace(/\s+/g, "_").toLowerCase(),
          },
        ]);
      });
    },
  });

  const {
    loading,
    error,
    data: quotes,
    refetch: getQuotes,
  } = useQuery(GET_QUOTES_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndexChild + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "DESC",
      quote_category_id: categoryId,
      quote_status_id: tabId,
      customer_id: isCustomer ? customerId : undefined,
    },
  });

  useEffect(() => {
    getQuotes();
  }, [categoryId, tabId, searchQuery]);

  return (
    <>
      {/* STATUS TABS */}
      <TabsComponent tabs={tabs} onChange={(tabId) => setActiveTab(tabId)} />
      {/* END TABS */}

      <Box pt="0px">
        <SimpleGrid
          mt="20px"
          columns={{ sm: 1 }}
          spacing={{ base: "20px", xl: "20px" }}
        >
          {!loading && quotes?.quotes.data.length >= 0 && (
            <PaginationTable
              columns={columns}
              data={quotes?.quotes.data}
              options={{
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                },
                manualPagination: true,
                pageCount: quotes?.quotes.paginatorInfo.lastPage,
              }}
              setQueryPageIndex={setQueryPageIndexChild}
              setQueryPageSize={setQueryPageSize}
              isServerSide
            />
          )}
        </SimpleGrid>
      </Box>
    </>
  );
}
