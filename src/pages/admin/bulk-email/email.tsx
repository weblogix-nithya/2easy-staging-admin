import { useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  Input,
  SimpleGrid,
  Text,
  // Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import PrivateAccessModal from "components/access/PrivateAccessModal";
// import FileInput from "components/fileInput/FileInput";
// import PaginationTable from "components/table/PaginationTable";
import { TabsComponent } from "components/tabs/TabsComponet";
import { SEND_GROUP_EMAIL } from "graphql/jobCcEmails";
import AdminLayout from "layouts/admin";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
});
export default function InvoiceIndex() {
  const { isAdmin } = useSelector((state: RootState) => state.user);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const toast = useToast();
  // const [temporaryMedia, setTemporaryMedia] = useState([]);
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
  const [tabs, _setTabs] = useState(staticTabs);

  const [_tabId, setActiveTab] = useState(isAdmin == true ? 1 : 2);

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

  // const attachmentColumns = useMemo(
  //   () => [
  //     {
  //       Header: "Document",
  //       accessor: "path" as const,
  //     },
  //     {
  //       Header: "uploaded by",
  //       accessor: "uploaded_by" as const,
  //     },
  //     {
  //       Header: "date uploaded",
  //       accessor: "created_at" as const,
  //     },
  //     {
  //       Header: "Actions",
  //       accessor: "downloadable_url" as const,
  //       isDelete: true,
  //       isEdit: false,
  //       isDownload: true,
  //     },
  //   ],
  //   [],
  // );

  // const handleRemoveFromTemporaryMedia = (id: number) => {
  //   let _temporaryMedia = [...temporaryMedia];
  //   _temporaryMedia = _temporaryMedia.filter((e) => e.id !== id);
  //   setTemporaryMedia(_temporaryMedia);
  // };
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
            maxW="1800px"
            minW="1500px"
            px={6}
            py={4}
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            mt={4}
          >
            <Flex gap={8} align="stretch">
              {/* Input Column */}
              <Box
                flex="1"
                minW="600px"
                maxW="900px"
                display="flex"
                flexDirection="column"
              >
                <Text fontSize="xl" fontWeight="extrabold" mb={2}>
                  Email Content
                </Text>
                <Box
                  flex="1"
                  display="flex"
                  flexDirection="column"
                  minW="400px"
                  maxW="700px"
                >
                  <Input
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    mb={3}
                    size="lg"
                  />
                  <Box mb={3} flex="1">
                    <ReactQuill
                      theme="snow"
                      value={body}
                      onChange={(html) => setBody(html)}
                      style={{ height: "300px", marginBottom: "40px" }}
                    />
                  </Box>
                  {/* <Textarea
                    placeholder="Type your email message here..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    mb={3}
                    rows={12}
                    size="lg"
                    flex="1"
                    resize="none"
                  /> */}
                  <Button
                    colorScheme="blue"
                    onClick={() => {
                      // const finalBody = `Hello!\n\n\n${body}\n\nRegards, \n2easy`;
                      sendGroupEmail({
                        variables: { subject, body: body },
                      });
                    }}
                    isLoading={loading}
                    isDisabled={!subject || !body}
                    alignSelf="flex-start"
                  >
                    Send Email
                  </Button>
                </Box>
              </Box>
              {/* Preview Column */}
              <Box
                flex="1"
                minW="600px"
                maxW="900px"
                display="flex"
                flexDirection="column"
              >
                <Text fontSize="xl" fontWeight="extrabold" mb={2}>
                  Preview
                </Text>
                <Box
                  flex="1"
                  minW="600px"
                  maxW="900px"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  p={4}
                  bg="gray.50"
                  display="flex"
                  flexDirection="column"
                  height="100%"
                >
                  <Input
                    placeholder="Subject"
                    value={`Subject : ${subject}`}
                    mb={3}
                    size="lg"
                    isReadOnly
                  />
                  <Text color="gray.500" mb={2} fontWeight="bold">
                    Hello!
                  </Text>
                  <Box
                    flex="1"
                    color="gray.800"
                    fontSize="md"
                    mb={2}
                    minHeight="200px"
                    sx={{
                      p: { marginBottom: "8px" },
                      ul: { paddingLeft: "20px" },
                    }}
                  >
                    {body ? (
                      <ReactQuill
                        value={body}
                        readOnly={true}
                        theme="bubble" // or "snow"
                      />
                    ) : (
                      <Text color="gray.400">
                        [Your message will appear here]
                      </Text>
                    )}
                  </Box>
                  <Text color="gray.500" fontWeight="bold">
                    Regards,
                  </Text>
                  <Text color="gray.500" fontWeight="bold">
                    2easy
                  </Text>
                </Box>
              </Box>
            </Flex>
          </Box>
          <Box>
            {/* Attachments */}
            {/* <Box mb="16px">
              <h3 className="mb-5 mt-3">Attachments</h3>
              <Flex width="100%" className="mb-6">
                <FileInput
                  entity="Job"
                  entityId={job.id}
                  onTemporaryUpload={(_temporaryMedia) => {
                    setTemporaryMedia(_temporaryMedia);
                  }}
                  isTemporary={true}
                  defaulTemporaryFiles={temporaryMedia}
                  description="Browse or drop your files here to upload"
                  height="80px"
                  bg="primary.100"
                ></FileInput>
              </Flex> */}

            {/* foreach jobAttachments */}
            {/* {temporaryMedia.length >= 0 && (
                <PaginationTable
                  columns={attachmentColumns}
                  data={temporaryMedia}
                  onDelete={(mediaId) => {
                    handleRemoveFromTemporaryMedia(mediaId);
                  }}
                />
              )}  https://chatgpt.com/share/6981d6a9-902c-8013-b310-a5940b51600e
            </Box> */}
          </Box>
        </SimpleGrid>
      </Box>
      <PrivateAccessModal isOpen={isOpen} onClose={onClose} />
    </AdminLayout>
  );
}
