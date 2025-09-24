import { useMutation, useQuery } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  GET_CUSTOMERS_QUERY,
  MUTATION_APPROVE_CUSTOMER,
} from "graphql/customer";
import React from "react";

interface ApprovalRequiredTabProps {
  approveColumns: any;
  queryPageIndex: number;
  queryPageSize: number;
  setQueryPageIndex: React.Dispatch<React.SetStateAction<number>>;
  setQueryPageSize: React.Dispatch<React.SetStateAction<number>>;
}

function ApprovalRequiredTab({
  approveColumns,
  queryPageIndex,
  queryPageSize,
  setQueryPageIndex,
  setQueryPageSize,
}: ApprovalRequiredTabProps) {
  const toast = useToast();

  const [handleApproveCustomer, {}] = useMutation(MUTATION_APPROVE_CUSTOMER, {
    onCompleted: () => {
      // console.log("APP", _data);
      // Toast()
      toast({
        title: "Customer is Approved manually",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      refetch();
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const {
    refetch,
    loading,
    data: approvalCustomers,
  } = useQuery(GET_CUSTOMERS_QUERY, {
    variables: {
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "ASC",
      is_approved: false, // 👈 filter for approval required
    },
    fetchPolicy: "network-only", // ensures always fresh data
  });

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  const handleApprove = (id: any) => {
    handleApproveCustomer({
      variables: {
        customerId: parseInt(id),
      },
    });
  };
  return (
    <>
      {approvalCustomers?.customers?.data?.length > 0 ? (
        <PaginationTable
          columns={approveColumns}
          data={approvalCustomers?.customers.data}
          options={{
            initialState: {
              pageIndex: queryPageIndex,
              pageSize: queryPageSize,
            },
            manualPagination: true,
            pageCount: approvalCustomers?.customers.paginatorInfo.lastPage,
          }}
          onApprove={(id: any) => {
            handleApprove(id);
          }}
          setQueryPageIndex={setQueryPageIndex}
          setQueryPageSize={setQueryPageSize}
          isServerSide
        />
      ) : (
        <div className="text-center mt-20">No Customers for manual approval</div>
      )}
    </>
  );
}

export default ApprovalRequiredTab;
