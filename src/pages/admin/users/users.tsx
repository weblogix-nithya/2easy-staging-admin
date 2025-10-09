import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  // Divider,
  Flex,
  Grid,
  Link,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import { TabsComponent } from "components/tabs/TabsComponet";
import { GET_USERS_QUERY } from "graphql/user";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";
import ApprovalRequiredTab from "./components/approvalRequiredTab";
// import './components/approvalRequiredTab'
import RestoreUserTab from "./components/restoreUserTab";
// import PaginationTable from "components/table/PaginationTable"
import UsersTab from "./components/usersTab";
import ResetPasswordTab from "./components/resetPasswordTab";

export default function UserIndex() {
  let menuBg = useColorModeValue("white", "navy.800");
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin } = useSelector((state: RootState) => state.user);
  const [tabId, setActiveTab] = useState(1);

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const tabs = [
    {
      id: 1,
      tabName: "Users",
      hash: "usersList",
      isVisible: true,
    },
    {
      id: 2,
      tabName: "Restore Users",
      hash: "restoreUsers",
      isVisible: true,
    },
    {
      id: 3,
      tabName: "Approve Users",
      hash: "approveUsers",
      isVisible: true,
    },
    {
      id: 4,
      tabName: "Reset Password",
      hash: "resetPassword",
      isVisible: isAdmin,
      // isVisible: true,
    },
  ];

  const resetColumns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name" as const,
      },
      {
        Header: "Email",
        accessor: "email" as const,
      },
      {
        Header: "Actions",
        accessor: "id" as const,
        isReset: isAdmin,
      },
    ],
    [isAdmin],
  );

  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name" as const,
      },
      {
        Header: "Email",
        accessor: "email" as const,
      },
      {
        Header: "Actions",
        accessor: "id" as const,
      },
    ],
    [],
  );

  const restoreColumns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name" as const,
      },
      {
        Header: "Email",
        accessor: "email" as const,
      },
      {
        Header: "Actions",
        accessor: "id" as const,
        isRestore: isAdmin,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const {
    loading,
    error,
    data: users,
    // refetch: getUsers,
  } = useQuery(GET_USERS_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: () => {
      // console.log(data.users.data,'data')
    },
  });

  useEffect(() => {
    onChangeSearchQuery.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const handleTabChange = useCallback(
    async (nextTabId: number) => {
      if (nextTabId === tabId) return;

      setActiveTab(nextTabId);

      const needsRefresh = nextTabId === 3;
      if (!needsRefresh) return;
    },
    [tabId],
  );

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "97px", xl: "97px" }}>
        <SimpleGrid mb="20px" pt="32px" px="12px" columns={{ sm: 1 }}>
          <Flex
            minWidth="max-content"
            alignItems="center"
            justifyContent="space-between"
            className="mb-4"
          >
            <h1 className="mb-0">Users</h1>

            <Link href="/admin/users/create">
              <Button variant="primary">Create New</Button>
            </Link>
          </Flex>

          <Flex minWidth="max-content" className="!flex-start">
            <SearchBar
              ms="0"
              placeholder="Search users"
              onChangeSearchQuery={onChangeSearchQuery}
              background={menuBg}
              borderRadius="8px"
            />
          </Flex>

          <Grid backgroundColor="white">
            <TabsComponent tabs={tabs} onChange={handleTabChange} />
            {tabId == 1 && (
              <UsersTab
                loading={loading}
                users={users}
                error={error}
                columns={columns}
                queryPageIndex={queryPageIndex}
                queryPageSize={queryPageSize}
                setQueryPageIndex={setQueryPageIndex}
                setQueryPageSize={setQueryPageSize}
              />
            )}
            {tabId == 2 && (
              <RestoreUserTab
                restoreColumns={restoreColumns}
                queryPageIndex={queryPageIndex}
                queryPageSize={queryPageSize}
                setQueryPageIndex={setQueryPageIndex}
                setQueryPageSize={setQueryPageSize}
              />
            )}
            {tabId == 3 && (
              <ApprovalRequiredTab
                // loading={loading}
                // users={users}
                // error={error}
                // approveColumns={approveColumns}
                searchQuery={searchQuery}
                queryPageIndex={queryPageIndex}
                queryPageSize={queryPageSize}
                setQueryPageIndex={setQueryPageIndex}
                setQueryPageSize={setQueryPageSize}
              />
            )}
            {tabId == 4 && (
              <ResetPasswordTab
                searchQuery={searchQuery}
                // setSearchQuery={setSearchQuery}
                resetColumns={resetColumns}
                queryPageIndex={queryPageIndex}
                queryPageSize={queryPageSize}
                setQueryPageIndex={setQueryPageIndex}
                setQueryPageSize={setQueryPageSize}
              />
            )}{" "}
          </Grid>
        </SimpleGrid>
      </Box>
    </AdminLayout>
  );
}
