import { useMutation, useQuery } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
// import { MUTATION_RESTORE_USER } from "graphql/customer";
import { GET_USERS_QUERY, UPDATE_USER_ACCESS_MUTATION } from "graphql/user";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

interface ResetPasswordTabProps {
  searchQuery: string;
  // setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  resetColumns: any;
  queryPageIndex: number;
  queryPageSize: number;
  setQueryPageIndex: React.Dispatch<React.SetStateAction<number>>;
  setQueryPageSize: React.Dispatch<React.SetStateAction<number>>;
}

function ResetPasswordTab({
  searchQuery,
  // setSearchQuery,
  resetColumns,
  queryPageIndex,
  queryPageSize,
  setQueryPageIndex,
  setQueryPageSize,
}: ResetPasswordTabProps) {
  const toast = useToast();

  // const { isAdmin, isResetAccess } = useSelector((state: RootState) => state.user);
  // console.log(isResetAccess, "res");
  const [handleResetUser, {}] = useMutation(UPDATE_USER_ACCESS_MUTATION, {
    onCompleted: (_data) => {
      console.log("APP", _data);
      // Toast()
      toast({
        title: " password reset access provided for the user successfully",
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
    loading,
    // error,
    data: resetCustomers,
    refetch,
  } = useQuery(GET_USERS_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      console.log(data.users.data, "reset data"); //is_approve?
    },
  });

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  const handleReset = (id: any) => {
    handleResetUser({
      variables: {
        input: {
          id: parseInt("813"), // or just id
          reset_approve: true,
        },
      },
    });
  };
  return (
    <>
      {resetCustomers?.users?.data?.length > 0 ? (
        <PaginationTable
          columns={resetColumns}
          data={resetCustomers?.users?.data}
          options={{
            initialState: {
              pageIndex: queryPageIndex,
              pageSize: queryPageSize,
            },
            manualPagination: true,
            pageCount: resetCustomers?.users?.paginatorInfo.lastPage,
          }}
          onReset={(id: any) => {
            handleReset(id);
          }}
          setQueryPageIndex={setQueryPageIndex}
          setQueryPageSize={setQueryPageSize}
          isServerSide
        />
      ) : (
        <div className="text-center mt-20">
          You are not authorized to reset password for the user
        </div>
      )}
    </>
  );
}

export default ResetPasswordTab;
