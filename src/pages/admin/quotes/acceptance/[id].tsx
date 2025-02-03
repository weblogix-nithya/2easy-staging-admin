import "react-quill/dist/quill.snow.css";

import { useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { SEND_CONSIGNMENT_DOCKET } from "graphql/job";
import {
  APPROVE_QUOTE_MUTATION,
  defaultQuote,
  GET_QUOTE_QUERY,
} from "graphql/quote";
import { GET_QUOTE_CATEGORIES_QUERY } from "graphql/quoteCategory";
import { defaultQuoteDestination } from "graphql/quoteDestination";
import { defaultQuoteItem } from "graphql/quoteItem";
import {
  defaultQuoteLineItem,
  GET_QUOTE_LINE_ITEMS_QUERY,
} from "graphql/quoteLineItem";
import { GET_QUOTE_SERVICES_QUERY } from "graphql/quoteService";
import { GET_QUOTE_TYPES_QUERY } from "graphql/quoteType";
import { formatCurrency, formatDate, formatTime } from "helpers/helper";
import AdminLayout from "layouts/admin";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";

export default function QuoteEdit() {
  const toast = useToast();
  const router = useRouter();
  const { id } = router.query;
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    [],
  );

  const [categories, setCategories] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [quoteTypes, setQuoteTypes] = useState([]);
  const [quote, setQuote] = useState(defaultQuote);
  const [quoteItems, setQuoteItems] = useState([defaultQuoteItem]);
  const [quoteLineItems, setQuoteLineItems] = useState([defaultQuoteLineItem]);
  const [subTotal, setSubTotal] = useState(0);
  const [gst, setGst] = useState(0);
  const [total, setTotal] = useState(0);

  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");

  // Addresses
  const [originalQuoteDestinations, setOriginalQuoteDestinations] = useState(
    [],
  );
  const [quoteDestinations, setQuoteDestinations] = useState([]);
  const [pickUpDestination, setPickUpDestination] = useState(
    defaultQuoteDestination,
  );
  const [handleSendConsignmentDocket] = useMutation(SEND_CONSIGNMENT_DOCKET);
  const {
    loading: quoteLoading,
    data: quoteData,
    refetch: getQuote,
  } = useQuery(GET_QUOTE_QUERY, {
    variables: {
      id: id,
    },
    skip: !id,
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data?.quote == null) {
        router.push("/admin/quotes");
      }
      setQuote({ ...quote, ...data?.quote, media: data?.quote.media });
      // quoteDestinations without is_pickup
      let _quoteDestinations = data.quote.quote_destinations.filter(
        (destination: any) => !destination.is_pickup,
      );
      setOriginalQuoteDestinations([]);
      setOriginalQuoteDestinations(_quoteDestinations);

      setQuoteDestinations([]);
      setPickUpDestination(
        data.quote.pick_up_destination
          ? data.quote.pick_up_destination
          : { ...defaultQuoteDestination, id: null, is_new: true },
      );
      setQuoteDestinations(_quoteDestinations);
      setQuoteItems(data.quote.quote_items);
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });
  const {
    loading,
    error,
    data: quoteLineItemsData,
    refetch: getQuoteLineItems,
  } = useQuery(GET_QUOTE_LINE_ITEMS_QUERY, {
    variables: {
      quote_id: id,
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setQuoteLineItems(data.quoteLineItems.data);
    },
  });
  const attachmentColumns = useMemo(
    () => [
      {
        Header: "Document",
        accessor: "name" as const,
      },
      {
        Header: "uploaded by",
        accessor: "uploaded_by" as const,
      },
      {
        Header: "date uploaded",
        accessor: "created_at" as const,
        type: "date",
      },
    ],
    [],
  );

  useQuery(GET_QUOTE_CATEGORIES_QUERY, {
    onCompleted: (data) => {
      setCategories([]);
      data.quoteCategories.map((_entity: any) => {
        setCategories((categories) => [
          ...categories,
          {
            value: parseInt(_entity.id),
            label: _entity.name,
          },
        ]);
      });
    },
  });

  useQuery(GET_QUOTE_SERVICES_QUERY, {
    onCompleted: (data) => {
      setServiceTypes([]);
      data.quoteServices.map((_entity: any) => {
        setServiceTypes((serviceTypes) => [
          ...serviceTypes,
          {
            value: parseInt(_entity.id),
            label: _entity.name,
          },
        ]);
      });
    },
  });

  useQuery(GET_QUOTE_TYPES_QUERY, {
    onCompleted: (data) => {
      setQuoteTypes([]);
      data.quoteTypes.map((_entity: any) => {
        setQuoteTypes((quoteTypes) => [
          ...quoteTypes,
          {
            value: parseInt(_entity.id),
            label: _entity.name,
          },
        ]);
      });
    },
  });

  const [handleApproveQuote, { loading: isApprovingQuote }] = useMutation(
    APPROVE_QUOTE_MUTATION,
    {
      variables: {
        id: id,
      },
      onCompleted: (data) => {
        toast({
          title: "Job created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        router.push(`/admin/jobs/${data.approveQuote.id}`);
        console.log("Quote Item Approved and Created a Job", data);

        handleSendConsignmentDocket({
          variables: {
            id: parseInt(data.approveQuote.id),
          },
        });
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  useEffect(() => {
    setSubTotal(quote.sub_total);
    setGst(quote.total_tax);
    setTotal(quote.total);
  }, [quote]);

  return (
    <AdminLayout>
      <Box
        className="mk-customers-id overflow-auto"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
        backgroundColor="white"
      >
        {/* Main Fields */}
        <Grid
          pr="24px"
          className="mk-mainInner"
          h={{
            base: "calc(100vh - 130px)",
            md: "calc(100vh - 97px)",
            xl: "calc(100vh - 97px)",
          }}
        >
          {!quoteLoading && (
            <Grid pl="6" backgroundColor="white">
              <FormControl>
                <Flex justify="space-between" align="center" className="my-8">
                  <h1 className="">Quote #{quote.id} Acceptance</h1>
                </Flex>

                {/* Fields */}
                <Box mb="16px">
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Customer Name
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">{quote.customer_name}</Text>
                    </Box>
                  </Flex>

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Client Reference
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">{quote.customer_reference}</Text>
                    </Box>
                  </Flex>
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Date Required
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">
                        {formatDate(quote.date_required, "DD/MM/YYYY")}
                      </Text>
                    </Box>
                  </Flex>
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Ready By
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">{formatTime(quote.ready_at)}</Text>
                    </Box>
                  </Flex>
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Drop By
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">
                        {formatTime(quote.date_required)}
                      </Text>
                    </Box>
                  </Flex>
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Category
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">
                        {
                          categories.find(
                            (entity) => entity.value == quote.quote_category_id,
                          )?.label
                        }
                      </Text>
                    </Box>
                  </Flex>
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Service Type
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">
                        {
                          serviceTypes.find(
                            (entity) => entity.value == quote.quote_service_id,
                          )?.label
                        }
                      </Text>
                    </Box>
                  </Flex>
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Urgency
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">
                        {
                          quoteTypes.find(
                            (entity) => entity.value == quote.quote_type_id,
                          )?.label
                        }
                      </Text>
                    </Box>
                  </Flex>

                  {/* Radio Fields */}
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Tailgate?
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">
                        {quote.is_tailgate_required ? "Yes" : "No"}
                      </Text>
                    </Box>
                  </Flex>

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Stackable Freight?
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">
                        {quote.is_stackable_freight ? "Yes" : "No"}
                      </Text>
                    </Box>
                  </Flex>

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Dangerous Goods?
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">
                        {quote.is_dangerous_goods ? "Yes" : "No"}
                      </Text>
                    </Box>
                  </Flex>

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Timeslot Required?
                    </FormLabel>
                    <Box width="100%">
                      <Text fontSize="md">
                        {quote.is_timeslot_required ? "Yes" : "No"}
                      </Text>
                    </Box>
                  </Flex>

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Client Notes
                    </FormLabel>
                    <Box width="100%">
                      <Text
                        dangerouslySetInnerHTML={{
                          __html: quote.customer_notes,
                        }}
                      />
                    </Box>
                  </Flex>
                </Box>

                {/* Addresses */}
                <Box>
                  <h2 className="mb-4">Addresses</h2>

                  {/* Pickup address */}
                  <Box mb="16px">
                    <h3 className="mb-5 mt-3">Pickup Information</h3>
                    <Grid templateColumns="repeat(10, 1fr)" gap={6}>
                      <GridItem colSpan={2}>
                        <h4 className="mt-3">Pickup depot</h4>
                      </GridItem>

                      <GridItem colSpan={7}>
                        <Flex
                          alignItems="center"
                          justifyContent="space-between"
                          width="100%"
                          className="py-0"
                        >
                          <p className="py-3 text-sm">
                            {pickUpDestination.address}
                          </p>
                        </Flex>
                      </GridItem>
                    </Grid>
                  </Box>

                  <Divider className="my-6" />

                  {/* Delivery Information */}
                  <Box mb="16px">
                    <h3 className="mb-5 mt-3">Delivery Information</h3>
                    {/* foreach quoteDestinations */}
                    {quoteDestinations.map((quoteDestination, index) => {
                      return (
                        <Box key={quoteDestination.id}>
                          <Grid templateColumns="repeat(10, 1fr)" gap={4}>
                            <GridItem colSpan={2}>
                              <h4 className="mt-3">
                                Delivery Address {index + 1}
                              </h4>
                            </GridItem>

                            <GridItem colSpan={7}>
                              <Flex
                                alignItems="center"
                                justifyContent="space-between"
                                width="100%"
                                className="py-0"
                              >
                                <p className="py-3 text-sm">
                                  {quoteDestination.address}
                                </p>
                              </Flex>
                            </GridItem>
                          </Grid>
                          <Divider className="my-6" />
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Attachments */}
                <Box>
                  <h3 className="mb-6">Attachments</h3>

                  {/* foreach Quote Attachments */}
                  {!quoteLoading && quote?.media.length >= 0 && (
                    <>
                      <PaginationTable
                        columns={attachmentColumns}
                        data={quote.media}
                      />
                    </>
                  )}
                </Box>

                <Divider className="my-12" />

                {/* Items */}
                <Box mt={4}>
                  <Flex justify="space-between" align="center" mb="20px">
                    <h3 className="">Items</h3>
                  </Flex>

                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Type</Th>
                        <Th>Dimensions (LxWxH)</Th>
                        <Th>QTY</Th>
                        <Th>Weight</Th>
                        <Th>CBM</Th>
                      </Tr>
                    </Thead>
                    <Tbody
                      className="bg-white divide-y divide-gray-200"
                      style={{ height: "50px" }}
                    >
                      {quoteItems.map((item) => {
                        return (
                          <Tr key={item.id}>
                            <Td>{item.item_type?.name}</Td>
                            <Td>
                              {item.dimension_depth +
                                "X" +
                                item.dimension_width +
                                "X" +
                                item.dimension_height}
                            </Td>
                            <Td> {item.quantity}</Td>
                            <Td> {item.weight}</Td>
                            <Td> {item.volume}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>

                <Box pt={{ base: "40px", md: "40px", xl: "40px" }}>
                  <SimpleGrid
                    mb="16px"
                    columns={{ sm: 1 }}
                    spacing={{ base: "20px", xl: "20px" }}
                  >
                    <Flex
                      minWidth="max-content"
                      justify={"space-between"}
                      alignItems="center"
                    >
                      <h3>Line Items</h3>
                    </Flex>
                    {!loading && (
                      <>
                        <TableContainer>
                          <Table variant="simple">
                            <Thead>
                              <Tr>
                                <Th pl="0">Description</Th>
                                <Th>Rate</Th>
                                <Th>QTY</Th>
                                <Th>Amount</Th>
                              </Tr>
                            </Thead>

                            <Tbody>
                              {quoteLineItems.map(
                                (quoteLineItem: any, index: number) => (
                                  <Tr key={index}>
                                    <Td pl="0">
                                      <Skeleton
                                        isLoaded={!quoteLoading}
                                        w="75%"
                                      >
                                        {quoteLineItem.name}
                                      </Skeleton>
                                    </Td>

                                    <Td maxWidth="160px">
                                      <Skeleton
                                        isLoaded={!quoteLoading}
                                        w="75%"
                                      >
                                        {formatCurrency(
                                          quoteLineItem.unit_amount,
                                          quoteLineItem.currency,
                                        )}
                                      </Skeleton>
                                    </Td>

                                    <Td maxWidth="120px">
                                      <Skeleton
                                        isLoaded={!quoteLoading}
                                        w="75%"
                                      >
                                        {quoteLineItem.quantity}
                                      </Skeleton>
                                    </Td>

                                    <Td maxWidth="120px">
                                      <Skeleton
                                        isLoaded={!quoteLoading}
                                        w="75%"
                                      >
                                        {formatCurrency(
                                          quoteLineItem.line_amount,
                                          quoteLineItem.currency,
                                        )}
                                      </Skeleton>
                                    </Td>
                                  </Tr>
                                ),
                              )}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </SimpleGrid>
                  <Divider className="my-12" />
                </Box>

                <Box className="w-full mt-4">
                  <Flex>
                    <Box className="max-w-[50%] w-full mt-4">
                      <Text
                        w="80%"
                        dangerouslySetInnerHTML={{
                          __html: quote.admin_notes,
                        }}
                      />
                    </Box>
                    <Box className="max-w-[50%] w-full ml-auto">
                      {!quoteLoading && (
                        <Flex flexDirection="column" className="ml-auto">
                          <Flex
                            justifyContent="space-between"
                            className="py-4 border-b border-[#e3e3e3]"
                          >
                            <Skeleton isLoaded={true} w="50%">
                              <p className="text-sm !font-bold">SubTotal </p>
                            </Skeleton>
                            <Skeleton isLoaded={true} w="50%">
                              <p className="text-sm text-right">
                                {formatCurrency(quote.sub_total, "AUD")}
                              </p>
                            </Skeleton>
                          </Flex>
                          <Flex
                            justifyContent="space-between"
                            className="py-4 border-b border-[#e3e3e3]"
                          >
                            <Skeleton isLoaded={true} w="50%">
                              <p className="text-sm !font-bold">GST </p>
                            </Skeleton>
                            <Skeleton isLoaded={true} w="50%">
                              <p className="text-sm text-right">
                                {formatCurrency(quote.total_tax, "AUD")}
                              </p>
                            </Skeleton>
                          </Flex>
                          <Flex
                            justifyContent="space-between"
                            className="py-4 border-b border-[#e3e3e3]"
                          >
                            <Skeleton isLoaded={true} w="50%">
                              <p className="text-sm !font-bold">Total </p>
                            </Skeleton>
                            <Skeleton isLoaded={true} w="50%">
                              <p className="text-sm text-right">
                                {formatCurrency(quote.total, "AUD")}
                              </p>
                            </Skeleton>
                          </Flex>
                        </Flex>
                      )}
                    </Box>
                  </Flex>
                </Box>

                {!quote.is_approved && (
                  <>
                    <Divider className="mt-12 mb-6 mb-6" />
                    <Flex gap={1} className="mb-8">
                      <Box>
                        <Button
                          variant="primary"
                          isDisabled={isApprovingQuote}
                          onClick={onOpen}
                        >
                          {isApprovingQuote
                            ? "Approving and Creating Job ..."
                            : "Approve"}
                        </Button>
                      </Box>
                    </Flex>
                  </>
                )}
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Acceptance Page</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure to approve this quote?</Text>
          </ModalBody>

          <ModalFooter>
            <Button
              isDisabled={isApprovingQuote}
              variant="outline"
              mr={3}
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              isDisabled={isApprovingQuote}
              colorScheme="blue"
              onClick={() => {
                handleApproveQuote();
              }}
            >
              {isApprovingQuote ? "Approving and Creating Job ..." : "Approve"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
