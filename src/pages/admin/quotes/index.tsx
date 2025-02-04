import { useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Link,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorModeValue,
} from "@chakra-ui/react";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import QuoteTabPanel from "components/quote/QuoteTabPanel";
import { GET_QUOTE_CATEGORIES_QUERY } from "graphql/quoteCategory";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";

export default function QuoteIndex() {
  let menuBg = useColorModeValue("white", "navy.800");
  const [categoryTabs, setCategoryTabs] = useState([]);
  const [tabIndex, setTabIndex] = useState(1);

  useQuery(GET_QUOTE_CATEGORIES_QUERY, {
    onCompleted: (data) => {
      data.quoteCategories.map((category: any) => {
        setCategoryTabs((categoryTabs) => [
          ...categoryTabs,
          {
            id: category?.id,
            name: category?.name,
            tabName: category?.name,
            hash: category?.name?.replace(/\s+/g, "_").toLowerCase(),
          },
        ]);
      });
    },
  });

  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  useEffect(() => {
    onChangeSearchQuery.cancel();
  });

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        <SimpleGrid
          mb="20px"
          pt="32px"
          px="24px"
          columns={{ sm: 1 }}
          spacing={{ base: "20px", xl: "20px" }}
        >
          <Flex minWidth="max-content" justifyContent="space-between">
            <h1 className="mb-0">Quotes</h1>
            <SearchBar
              onChangeSearchQuery={onChangeSearchQuery}
              placeholder="Search quotes"
              background={menuBg}
              me="10px"
            />
            <Link href="/admin/quotes/create">
              <Button variant="primary">Create Quote</Button>
            </Link>
          </Flex>
        </SimpleGrid>
      </Box>

      <Tabs onChange={(index) => setTabIndex(index)} variant="enclosed" isLazy>
        <TabList>
          {categoryTabs.map((category, index) => (
            <Tab key={index}>{category.name}</Tab>
          ))}
        </TabList>

        <TabPanels>
          {categoryTabs.map((category, index) => (
            <TabPanel p={4} key={index}>
              <QuoteTabPanel
                categoryId={parseInt(category.id)}
                searchQuery={searchQuery}
                queryPageIndex={queryPageIndex}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </AdminLayout>
  );
}
