import PaginationTable from "components/table/PaginationTable";
import React from "react";

interface CustomerTabProps {
  isAdmin: boolean;
  isCompany: boolean;
  loading: boolean;
  customers: any;
  companyCustomerLoading: boolean;
  companyCustomers: any;
  columns: any;
  queryPageIndex: number;
  queryPageSize: number;
  setQueryPageIndex: React.Dispatch<React.SetStateAction<number>>;
  setQueryPageSize: React.Dispatch<React.SetStateAction<number>>;
}

function CustomerTab({
  isAdmin,
  isCompany,
  loading,
  customers,
  companyCustomerLoading,
  companyCustomers,
  columns,
  queryPageIndex,
  queryPageSize,
  setQueryPageIndex,
  setQueryPageSize,
}: CustomerTabProps) {
  return (
    <>
      {isAdmin && !loading && customers?.customers?.data?.length >= 0 && (
        <PaginationTable
          columns={columns}
          data={customers?.customers.data}
          options={{
            initialState: {
              pageIndex: queryPageIndex,
              pageSize: queryPageSize,
            },
            manualPagination: true,
            pageCount: customers?.customers.paginatorInfo.lastPage,
          }}
          setQueryPageIndex={setQueryPageIndex}
          setQueryPageSize={setQueryPageSize}
          isServerSide
        />
      )}

      {isCompany &&
        !companyCustomerLoading &&
        companyCustomers?.customers?.data?.length >= 0 && (
          <PaginationTable
            columns={columns}
            data={companyCustomers?.customers.data}
            options={{
              initialState: {
                pageIndex: queryPageIndex,
                pageSize: queryPageSize,
              },
              manualPagination: true,
              pageCount: companyCustomers?.customers.paginatorInfo.lastPage,
            }}
            setQueryPageIndex={setQueryPageIndex}
            setQueryPageSize={setQueryPageSize}
            isServerSide
          />
        )}
    </>
  );
}

export default CustomerTab;
