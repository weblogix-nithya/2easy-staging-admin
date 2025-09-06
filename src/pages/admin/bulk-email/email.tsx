import { useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import PrivateAccessModal from "components/access/PrivateAccessModal";

import { TabsComponent } from "components/tabs/TabsComponet";

import { SEND_GROUP_EMAIL } from "graphql/jobCcEmails";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export default function InvoiceIndex() {
  const { isAdmin } = useSelector((state: RootState) => state.user);
  const [senderName, setSenderName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const toast = useToast();
  const staticTabs = [
    {
      id: 1,
      name: "Bulk Email",
      tabName: "Bulk Email",
      hash: "bulk_email",
    },
    // Uncomment below to add the History tab in the future
    // {
    //   id: 2,
    //   name: "History",
    //   tabName: "History",
    //   hash: "history",
    //   hidden: true, // You can use this property to hide/show
    // },
  ];
  const [tabs, setTabs] = useState(staticTabs);

  const [tabId, setActiveTab] = useState(isAdmin == true ? 1 : 2);

  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isPrivateRoute =
    useSelector((state: RootState) => state.routes.routes).find(
      (route) => route.layout + route.path == router.pathname,
    )?.isPrivate || false;

  useEffect(() => {
    if (isPrivateRoute && isAdmin) onOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrivateRoute]);

  // useQuery(GET_COMPANYS_QUERY, {
  //   variables: {
  //     query: debouncedCompanySearch,
  //     page: 1,
  //     first: 100,
  //     orderByColumn: "id",
  //     orderByOrder: "ASC",
  //   },
  //   onCompleted: (data) => {
  //     setCompaniesOptions([]);
  //     data.companys.data.map((_entity: any) => {
  //       setCompaniesOptions((companys) => [
  //         ...companys,
  //         {
  //           value: parseInt(_entity.id),
  //           label: _entity.name,
  //         },
  //       ]);
  //     });
  //   },
  // });

  // useQuery(GET_CUSTOMERS_QUERY, {
  //   variables: {
  //     query: debouncedCustomerSearch,
  //     page: 1,
  //     first: 100,
  //     orderByColumn: "id",
  //     orderByOrder: "ASC",
  //   },
  //   onCompleted: (data) => {
  //     setCustomerOptions([]);
  //     data.customers.data.map((customer: any) => {
  //       setCustomerOptions((customers) => [
  //         ...customers,
  //         {
  //           value: parseInt(customer.id),
  //           label: customer.full_name,
  //         },
  //       ]);
  //     });
  //   },
  // });

  const [sendGroupEmail, { loading }] = useMutation(SEND_GROUP_EMAIL, {
    onCompleted: (data) => {
      if (data.sendGroupEmail.success) {
        toast({
          title: "Email sent!",
          description: data.sendGroupEmail.message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setSubject("");
        setBody("");
      } else {
        toast({
          title: "Failed to send email.",
          description: data.sendGroupEmail.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
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
            <h1 className="mb-0">Bulk Email</h1>
          </Flex>
        </SimpleGrid>
      </Box>

      {/* TODO: Should this be https://chakra-ui.com/docs/components/tabs instead? */}
      <SimpleGrid className="text-sm text-center font-bold border-b border-[var(--chakra-colors-gray-200)]">
        <Flex className="pl-5">
          <TabsComponent
            tabs={tabs}
            onChange={(tabId) => setActiveTab(tabId)}
          />
        </Flex>
      </SimpleGrid>
      {/* END Tabs */}

      <Box pt="0px">
        <SimpleGrid
          mb="20px"
          pt="16px"
          px="24px"
          columns={{ sm: 1 }}
          spacing={{ base: "20px", xl: "20px" }}
        >
          <Flex justifyContent="flex-start" alignItems="center">
            {/* <Box className="!max-w-md" p="10px 10px" h="max-content" w="20%">
              <Select
                placeholder="Company"
                options={companiesOptions}
                size="lg"
                className="select mb-0"
                classNamePrefix="two-easy-select"
                onInputChange={(e) => {
                  onChangeSearchCompany(e);
                }}
                onChange={(e) => setCompanyFilter(e?.value || null)}
                isClearable={true}
              ></Select>
            </Box>
            <Box className="!max-w-md" p="10px 10px" h="max-content" w="20%">
              <Select
                placeholder="User"
                isMulti
                options={customerOptions}
                size="lg"
                className="select mb-0"
                classNamePrefix="two-easy-select"
                onInputChange={(e) => {
                  onChangeSearchCustomer(e);
                }}
                onChange={(e) =>
                  setCustomerFilter(e ? e.map((item) => item.value) : null)
                }
                isClearable={true}
              ></Select>
            </Box> */}

            <Text fontSize={"lg"}>To : All 2Easy users</Text>
            {/* TODO: Search per tab search */}
          </Flex>
          <Divider className="!my-0 !py-0" />
          <Box
            maxW="1300px"
            px={6}
            py={4}
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            mt={4}
          >
            {/* <Input
              placeholder="Your Name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              mb={3}
              size="lg"
            /> */}
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              mb={3}
              size="lg"
            />
            <Textarea
              placeholder="Type your email message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              mb={3}
              rows={8}
              size="lg"
            />
            <Button
              colorScheme="blue"
              onClick={() => sendGroupEmail({ variables: { subject, body } })}
              isLoading={loading}
              isDisabled={!subject || !body}
            >
              Send Email
            </Button>
          </Box>
        </SimpleGrid>
      </Box>
      <PrivateAccessModal isOpen={isOpen} onClose={onClose} />

    </AdminLayout>
  );
}
