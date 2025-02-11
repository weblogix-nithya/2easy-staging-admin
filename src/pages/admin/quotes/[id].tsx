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
  Input,
  Radio,
  RadioGroup,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { faTrashCan } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AreYouSureAlert from "components/alert/AreYouSureAlert";
import CustomInputField from "components/fields/CustomInputField";
import FileInput from "components/fileInput/FileInput";
import QuoteAddressesSection from "components/quote/QuoteAddressesSection";
import QuoteItemsTable from "components/quote/QuoteItemsTable";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { GET_CUSTOMER_ADDRESSES_QUERY } from "graphql/customerAddress";
import { GET_ITEM_TYPES_QUERY } from "graphql/itemType";
import { SEND_CONSIGNMENT_DOCKET } from "graphql/job";
import { DELETE_MEDIA_MUTATION } from "graphql/media";
import {
  defaultQuote,
  DELETE_QUOTE_MUTATION,
  GET_QUOTE_QUERY,
  PROCESS_QUOTE_AND_BOOK_MUTATION,
  PROCESS_QUOTE_MUTATION,
  SEND_QUOTE_MUTATION,
  UPDATE_QUOTE_MUTATION,
} from "graphql/quote";
import { GET_QUOTE_CATEGORIES_QUERY } from "graphql/quoteCategory";
import {
  CREATE_QUOTE_DESTINATION_MUTATION,
  defaultQuoteDestination,
  DELETE_QUOTE_DESTINATION_MUTATION,
  UPDATE_QUOTE_DESTINATION_MUTATION,
} from "graphql/quoteDestination";
import {
  CREATE_QUOTE_ITEM_MUTATION,
  defaultQuoteItem,
  DELETE_QUOTE_ITEM_MUTATION,
  UPDATE_QUOTE_ITEM_MUTATION,
} from "graphql/quoteItem";
import {
  CREATE_QUOTE_LINE_ITEM_MUTATION,
  DELETE_QUOTE_LINE_ITEM_MUTATION,
  UPDATE_QUOTE_LINE_ITEM_MUTATION,
} from "graphql/quoteLineItem";
import { GET_QUOTE_SERVICES_QUERY } from "graphql/quoteService";
import { GET_QUOTE_TYPES_QUERY } from "graphql/quoteType";
import {
  formatCurrency,
  formatDate,
  formatDateTimeToDB,
  formatFloat,
  formatTimeUTCtoInput,
  formatToSelect,
  today,
} from "helpers/helper";
import AdminLayout from "layouts/admin";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export default function QuoteEdit() {
  const toast = useToast();
  const router = useRouter();
  const { id } = router.query;
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    [],
  );

  let menuBg = useColorModeValue("white", "navy.800");
  const { isAdmin, isCustomer, isCompany } = useSelector(
    (state: RootState) => state.user,
  );
  const [isUpdatingMedia, setIsUpdatingMedia] = useState(false);
  const [categories, setCategories] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [quoteTypes, setQuoteTypes] = useState([]);
  const [quote, setQuote] = useState(defaultQuote);
  const [quoteItems, setQuoteItems] = useState([defaultQuoteItem]);
  const [quoteLineItems, setQuoteLineItems] = useState([]);
  const [originalQuoteItems, setOriginalQuoteItems] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [gst, setGst] = useState(0);
  const [total, setTotal] = useState(0);
  const [requiredDateAt, setRequiredDateAt] = useState(today);
  const [readyAt, setReadyAt] = useState("06:00");
  const [dropAt, setDropAt] = useState("17:00");
  const [itemTypes, setItemTypes] = useState([]);
  const [deleteQuoteLineItemId, setDeleteQuoteLineItemId] = useState(null);
  const [isEnableEdit, setIsEnableEdit] = useState(true);
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [rateCardUrl, setRateCardUrl] = useState("");
  // const onChangeSearchQuery = useMemo(() => {
  //   return debounce((e) => {
  //     setSearchQuery(e);
  //     setQueryPageIndex(0);
  //   }, 300);
  // }, []);

  // Addresses
  const [originalQuoteDestinations, setOriginalQuoteDestinations] = useState(
    [],
  );
  const [quoteDestinations, setQuoteDestinations] = useState([]);
  const [pickUpDestination, setPickUpDestination] = useState(
    defaultQuoteDestination,
  );
  const [savedAddressesSelect, setSavedAddressesSelect] = useState([]);

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
      if (!isUpdatingMedia) {
        setQuote({ ...quote, ...data?.quote, media: data?.quote.media });
        setRateCardUrl(data?.quote.customer.rate_card_url);
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
        setOriginalQuoteItems(data.quote.quote_items);
        setRequiredDateAt(
          data.quote.date_required
            ? formatDate(data.quote.date_required)
            : requiredDateAt,
        );
        setReadyAt(
          data.quote.ready_at
            ? formatTimeUTCtoInput(data.quote.ready_at)
            : readyAt,
        );
        setQuoteLineItems(data.quote.quote_line_items);

        setDropAt(
          data.quote.date_required
            ? formatTimeUTCtoInput(data.quote.date_required)
            : dropAt,
        );
        setIsEnableEdit(!data.quote.job && !data.quote.is_approved);
      } else {
        setQuote({ ...quote, media: data?.quote.media });
        setIsUpdatingMedia(false);
      }
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const handleUpdateLineItem = (lineItem: any) => {
    return new Promise((resolve, reject) => {
      updateLineItem({ variables: lineItem })
        .then(({ data }) => {
          toast({
            title: "Line Item updated",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };
  // const {
  //   loading,
  //   error,
  //   data: quoteLineItemsData,
  //   refetch: getQuoteLineItems,
  // } = useQuery(GET_QUOTE_LINE_ITEMS_QUERY, {
  //   variables: {
  //     quote_id: id,
  //     query: searchQuery,
  //     page: queryPageIndex + 1,
  //     first: queryPageSize,
  //     orderByColumn: "id",
  //     orderByOrder: "ASC",
  //   },
  //   onCompleted: (data) => {
  //     setQuoteLineItems(data.quoteLineItems.data);
  //   },
  // });
  const [updateLineItem] = useMutation(UPDATE_QUOTE_LINE_ITEM_MUTATION);

  const handleCreateLineItem = (lineItem: any) => {
    return new Promise((resolve, reject) => {
      createLineItem({ variables: lineItem })
        .then(({ data }) => {
          toast({
            title: "Line Item created",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };
  const [createLineItem] = useMutation(CREATE_QUOTE_LINE_ITEM_MUTATION);

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
      {
        Header: "Actions",
        accessor: "downloadable_url" as const,
        isDelete: isAdmin,
        isEdit: false,
        isDownload: true,
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

  useQuery(GET_ITEM_TYPES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      const itemTypesArray = data.itemTypes.data.map(
        (_entity: { id: string; name: string }) => ({
          value: parseInt(_entity.id),
          label: _entity.name,
        }),
      );

      // Sort items, pushing "Other" to the end
      const sortedItemTypes = itemTypesArray.sort(
        (
          a: { value: number; label: string },
          b: { value: number; label: string },
        ) => {
          if (a.label === "Other") return 1;
          if (b.label === "Other") return -1;
          return 0;
        },
      );

      setItemTypes(sortedItemTypes);
    },
  });

  // Addresses Functions
  const addToQuoteDestinations = () => {
    let nextId = quoteDestinations[quoteDestinations.length - 1]
      ? quoteDestinations[quoteDestinations.length - 1].id + 1
      : 1;
    setQuoteDestinations((quoteDestinations) => [
      ...quoteDestinations,
      { ...defaultQuoteDestination, ...{ id: nextId, is_new: true } },
    ]);
  };
  const handleRemoveFromQuoteDestinations = (index: number) => {
    let _quoteDestinations = [...quoteDestinations];
    _quoteDestinations.splice(index, 1);
    setQuoteDestinations(_quoteDestinations);
  };
  //handleQuoteDestinationChanged
  const handleQuoteDestinationChanged = async (value: any, index: number) => {
    let _quoteDestinations = [...quoteDestinations];
    _quoteDestinations[index] = value;
    setQuoteDestinations(_quoteDestinations);
    //check if any quote destination is_saved_address and populate setSavedAddresses
  };
  //handleDelete
  const [handleDeleteQuoteDestination, {}] = useMutation(
    DELETE_QUOTE_DESTINATION_MUTATION,
    {
      onCompleted: (data) => {
        console.log("Quote destination Deleted", data);
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  //handleCreateQuoteDestination
  const handleCreateQuoteDestination = (quoteDestination: any) => {
    return new Promise((resolve, reject) => {
      createQuoteDestination({ variables: quoteDestination })
        .then(({ data }) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };
  const [createQuoteDestination] = useMutation(
    CREATE_QUOTE_DESTINATION_MUTATION,
  );
  //handleUpdateQuoteDestinations
  const [handleUpdateQuoteDestination, {}] = useMutation(
    UPDATE_QUOTE_DESTINATION_MUTATION,
    {
      onCompleted: (data) => {
        console.log("Quote destination updated");
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  const { refetch: getCustomerAddresses } = useQuery(
    GET_CUSTOMER_ADDRESSES_QUERY,
    {
      variables: {
        query: "",
        page: 1,
        first: 200,
        orderByColumn: "id",
        orderByOrder: "ASC",
        customer_id: quote.customer_id,
      },
      onCompleted: (data) => {
        setSavedAddressesSelect([]);

        setSavedAddressesSelect(
          formatToSelect(
            data.customerAddresses.data,
            "id",
            "address_business_name",
          ),
        );
      },
    },
  );
  // End of Addresses Function

  const [handleUpdateQuote, { loading: isSaving }] = useMutation(
    UPDATE_QUOTE_MUTATION,
    {
      variables: {
        input: {
          ...quote,
          quote_items: undefined,
          media: undefined,
          is_approved: undefined,
          is_quote_send: undefined,
          pick_up_destination: undefined,
          quote_destinations: undefined,
          customer: undefined,
          job: undefined,
          quote_status: undefined,
          quote_line_items: undefined,
          company: undefined,
        },
      },
      onCompleted: async (data) => {
        const updatePromises = [];
        //update quote destinations
        let _quoteDestinations = [...quoteDestinations];
        if (pickUpDestination.is_new) {
          updatePromises.push(
            await handleCreateQuoteDestination({
              input: {
                ...pickUpDestination,
                is_pickup: true,
                customer_id: undefined,
                id: undefined,
                quote_id: parseInt(data.updateQuote.id),
                jobDestination: undefined,
                media: undefined,
                is_new: undefined,
              },
            }),
          );
        } else {
          updatePromises.push(
            handleUpdateQuoteDestination({
              variables: {
                input: {
                  ...pickUpDestination,
                  quote_id: parseInt(data.updateQuote.id),
                  label: undefined,
                  is_pickup: true,
                  updated_at: undefined,
                  media: undefined,
                  is_new: undefined,
                },
              },
            }),
          );
        }
        for (let quoteDestination of _quoteDestinations) {
          if (quoteDestination.is_new) {
            updatePromises.push(
              await handleCreateQuoteDestination({
                input: {
                  ...quoteDestination,
                  quote_id: parseInt(data.updateQuote.id),
                  id: undefined,
                  is_new: undefined,
                  customer_id: undefined,
                  label: undefined,
                  is_pickup: false,
                  updated_at: undefined,
                  issue_reports: undefined,
                  media: undefined,
                },
              }),
            );
          } else {
            updatePromises.push(
              handleUpdateQuoteDestination({
                variables: {
                  input: {
                    ...quoteDestination,
                    customer_id: undefined,
                    label: undefined,
                    updated_at: undefined,
                    is_pickup: false,
                    issue_reports: undefined,
                    media: undefined,
                    is_new: undefined,
                  },
                },
              }),
            );
          }
        }
        //delete quote destinations
        originalQuoteDestinations.forEach((originalQuoteDestination) => {
          if (
            !quoteDestinations.find((quoteDestination) => {
              return quoteDestination.id == originalQuoteDestination.id;
            })
          ) {
            updatePromises.push(
              handleDeleteQuoteDestination({
                variables: {
                  id: parseInt(originalQuoteDestination.id),
                },
              }),
            );
          }
        });

        //update Quote items
        for (let item of quoteItems) {
          if (item.is_new) {
            updatePromises.push(
              handleCreateQuoteItem({
                variables: {
                  input: {
                    ...item,
                    quote_id: parseInt(data.updateQuote.id),
                    is_new: undefined,
                    id: undefined,
                    dimension_height_cm: undefined,
                    dimension_width_cm: undefined,
                    dimension_depth_cm: undefined,
                    volume_cm: undefined,
                    item_type: undefined,
                  },
                },
              }),
            );
          } else {
            updatePromises.push(
              handleUpdateQuoteItem({
                variables: {
                  input: {
                    ...item,
                    item_type: undefined,
                    is_new: undefined,
                    dimension_height_cm: undefined,
                    dimension_width_cm: undefined,
                    dimension_depth_cm: undefined,
                    volume_cm: undefined,
                  },
                },
              }),
            );
          }
        }

        for (let quoteLineItem of quoteLineItems) {
          if (quoteLineItem.id == null) {
            updatePromises.push(
              await handleCreateLineItem({
                input: {
                  name: quoteLineItem.name,
                  quote_id: quoteLineItem.quote_id,
                  is_surcharge: true,
                  is_rate: false,
                  tax_type: "OUTPUT",
                  unit_amount: formatFloat(quoteLineItem.unit_amount),
                  quantity: formatFloat(quoteLineItem.quantity),
                  line_amount: formatFloat(quoteLineItem.line_amount),
                },
              }),
            );
          } else {
            updatePromises.push(
              await handleUpdateLineItem({
                input: {
                  id: quoteLineItem.id,
                  name: quoteLineItem.name,
                  quote_id: quoteLineItem.quote_id,
                  unit_amount: formatFloat(quoteLineItem.unit_amount),
                  quantity: formatFloat(quoteLineItem.quantity),
                  line_amount: formatFloat(quoteLineItem.line_amount),
                },
              }),
            );
          }
        }

        // Delete Quote items.
        originalQuoteItems.forEach((item) => {
          if (
            !quoteItems.find((quoteItem) => {
              return quoteItem.id == item.id;
            })
          ) {
            updatePromises.push(
              handleDeleteQuoteItem({
                variables: {
                  id: parseInt(item.id),
                },
              }),
            );
          }
        });
        await Promise.all(updatePromises);
        // Refetch to get Quote Items.
        await getQuote();

        toast({
          title: "Quote updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
    },
  );

  const [handleDeleteQuote, {}] = useMutation(DELETE_QUOTE_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      toast({
        title: "Quote deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/quotes");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  const [handleProcessAndBook, { loading: isProcessBooking }] = useMutation(
    PROCESS_QUOTE_AND_BOOK_MUTATION,
    {
      variables: {
        id: id,
      },
      onCompleted: (data) => {
        toast({
          title: "Quote Item Processed and Booked",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        console.log("Quote Item Processed and Booked", data);
        getQuote();

        handleSendConsignmentDocket({
          variables: {
            id: parseInt(data.processBookQuote.job.id),
          },
        });
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  const [handleProcess, { loading: isProcessing }] = useMutation(
    PROCESS_QUOTE_MUTATION,
    {
      variables: {
        id: id,
      },
      onCompleted: (data) => {
        toast({
          title: "Quote Item Processed",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        console.log("Quote Item Processed", data);
        getQuote();
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  const [handleSendQuote, { loading: isSending }] = useMutation(
    SEND_QUOTE_MUTATION,
    {
      variables: {
        id: id,
      },
      onCompleted: (data) => {
        toast({
          title: "Quote has sent",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        console.log("Quote Item sent", data);
        getQuote();
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  const [handleSendConsignmentDocket] = useMutation(SEND_CONSIGNMENT_DOCKET);
  //deleteMedia
  const [handleDeleteMedia, {}] = useMutation(DELETE_MEDIA_MUTATION, {
    onCompleted: (data) => {
      toast({
        title: "Attachment deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      getQuote();
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  // Handles for Quote Items
  const addToQuoteItems = () => {
    let nextId = quoteItems[quoteItems.length - 1]?.id + 1 || 1;
    setQuoteItems((quoteItems) => [
      ...quoteItems,
      { ...defaultQuoteItem, ...{ id: nextId, is_new: true } },
    ]);
  };
  const handleRemoveQuoteItem = (index: number) => {
    let _items = [...quoteItems];
    _items.splice(index, 1);
    setQuoteItems(_items);
  };
  const handleQuoteItemChanged = (
    value: any,
    index: number,
    fieldToUpdate?: string,
  ) => {
    let _items = [...quoteItems];
    if (!value.dimension_height_cm) {
      value.dimension_height_cm = (
        parseFloat(value.dimension_height) * 100
      ).toFixed(2);
    }
    if (!value.dimension_width_cm) {
      value.dimension_width_cm = (
        parseFloat(value.dimension_width) * 100
      ).toFixed(2);
    }
    if (!value.dimension_depth_cm) {
      value.dimension_depth_cm = (
        parseFloat(value.dimension_depth) * 100
      ).toFixed(2);
    }
    if (fieldToUpdate == "volume") {
      value.volume =
        value.dimension_height *
        value.dimension_width *
        value.dimension_depth *
        value.quantity;
      value.volume_cm = (value.volume * 100).toFixed(2);
    }
    _items[index] = value;
    setQuoteItems(_items);
  };
  const [handleCreateQuoteItem, {}] = useMutation(CREATE_QUOTE_ITEM_MUTATION, {
    onCompleted: (data) => {
      console.log("Quote item created");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  const [handleUpdateQuoteItem, {}] = useMutation(UPDATE_QUOTE_ITEM_MUTATION, {
    onCompleted: (data) => {
      console.log("Quote item updated");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  const [handleDeleteQuoteItem, {}] = useMutation(DELETE_QUOTE_ITEM_MUTATION, {
    onCompleted: (data) => {
      console.log("Quote Item Deleted", data);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteQuoteLineItem, {}] = useMutation(
    DELETE_QUOTE_LINE_ITEM_MUTATION,
    {
      variables: {
        id: deleteQuoteLineItemId,
      },
      onCompleted: (data) => {
        toast({
          title: "Line Item deleted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setQuoteLineItems(
          quoteLineItems.filter((quoteLineItem) => {
            return quoteLineItem.id != deleteQuoteLineItemId;
          }),
        );
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  useEffect(() => {
    getCustomerAddresses();
  }, [quote.customer_id]);
  useEffect(() => {
    let quoteTotal = quoteLineItems.reduce((acc, quoteLineItem) => {
      return acc + parseFloat(quoteLineItem.line_amount);
    }, 0);
    setQuote({
      ...quote,
      total_tax: quoteTotal * 0.1,
      sub_total: quoteTotal,
      total: quoteTotal * 1.1,
    });
  }, [quoteLineItems]);

  useEffect(() => {
    dateChanged();
  }, [requiredDateAt, dropAt, readyAt]);
  const dateChanged = () => {
    try {
      setQuote({
        ...quote,
        date_required: formatDateTimeToDB(requiredDateAt, dropAt),
        ready_at: formatDateTimeToDB(requiredDateAt, readyAt),
      });
    } catch (e) {
      //console.log(e);
    }
  };

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
                  <Flex>
                    <h1 className="">Quote #{quote.id}</h1>
                    <Tag
                      mx="5px"
                      borderRadius="full"
                      variant="solid"
                      colorScheme="blue"
                    >
                      {quote.is_approved
                        ? "Approved"
                        : quote.quote_status?.name +
                          (quote.job
                            ? " and Booked"
                            : quote.is_quote_send
                            ? " - Quote Sent"
                            : "")}
                    </Tag>
                  </Flex>
                  <Flex alignItems="center">
                    <Button
                      mx="5px"
                      hidden={quote.is_approved || !quote.is_quote_send}
                      variant="primary"
                      isDisabled={isSaving}
                      onClick={() => {
                        router.push("/admin/quotes/acceptance/" + quote.id);
                      }}
                    >
                      {"View Acceptance Page"}
                    </Button>
                  </Flex>
                </Flex>

                {/* Fields */}
                <Box mb="16px">
                  {!isCompany && (
                    <CustomInputField
                      label="Company Name"
                      placeholder=""
                      name="client_name"
                      value={quote.company?.name}
                      isDisabled={true}
                    />
                  )}
                  <CustomInputField
                    label="Customer Name"
                    placeholder=""
                    name="client_name"
                    value={quote.customer_name}
                    isDisabled={true}
                  />
                  {isAdmin && (
                    <Flex alignItems="center" mb="16px">
                      <FormLabel
                        display="flex"
                        mb="0"
                        width="200px"
                        fontSize="sm"
                        fontWeight="500"
                        _hover={{ cursor: "pointer" }}
                      >
                        Rate Card
                      </FormLabel>
                      <Box width="100%">
                        {rateCardUrl ? (
                          <Button
                            onClick={() => {
                              window.open(
                                rateCardUrl,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                            fontSize="sm"
                            variant="outline"
                            fontWeight="500"
                            lineHeight="19px"
                            w="15%"
                            h="50"
                            mb="0"
                            className="!h-[39px]"
                          >
                            Download Rate Card
                          </Button>
                        ) : (
                          <Text>-</Text>
                        )}
                      </Box>
                    </Flex>
                  )}

                  <CustomInputField
                    label="Client Reference"
                    placeholder=""
                    name="customer_reference"
                    value={quote.customer_reference}
                    onChange={(e) =>
                      setQuote({
                        ...quote,
                        [e.target.name]: e.target.value,
                      })
                    }
                    isDisabled={!isEnableEdit}
                  />
                  <CustomInputField
                    label="Date Required"
                    type={"date"}
                    placeholder=""
                    name="date_required"
                    value={requiredDateAt}
                    onChange={(e) => {
                      setRequiredDateAt(e.target.value);
                    }}
                    isDisabled={!isEnableEdit}
                  />
                  <CustomInputField
                    label="Ready at:"
                    type={"time"}
                    placeholder=""
                    name="ready_at"
                    value={readyAt}
                    onChange={(e) => {
                      setReadyAt(e.target.value);
                      setQuote({
                        ...quote,
                        ready_at: new Date(
                          `${requiredDateAt} ${e.target.value}`,
                        ).toISOString(),
                        date_required: new Date(
                          `${requiredDateAt} ${dropAt}`,
                        ).toISOString(),
                      });
                    }}
                    isDisabled={!isEnableEdit}
                  />
                  <CustomInputField
                    label="Drop by:"
                    type={"time"}
                    placeholder=""
                    name="drop_at"
                    value={dropAt}
                    onChange={(e) => {
                      setDropAt(e.target.value);
                      setQuote({
                        ...quote,
                        ready_at: new Date(
                          `${requiredDateAt} ${readyAt}`,
                        ).toISOString(),
                        date_required: new Date(
                          `${requiredDateAt} ${e.target.value}`,
                        ).toISOString(),
                      });
                    }}
                    isDisabled={!isEnableEdit}
                  />
                  <CustomInputField
                    isSelect={true}
                    optionsArray={categories}
                    label="Category"
                    value={categories.find(
                      (entity) => entity.value == quote.quote_category_id,
                    )}
                    placeholder=""
                    onChange={(e) => {
                      setQuote({
                        ...quote,
                        quote_category_id: e.value || null,
                      });
                    }}
                    isDisabled={!isEnableEdit}
                  />
                  <CustomInputField
                    isSelect={true}
                    optionsArray={serviceTypes}
                    label="Service Type"
                    value={serviceTypes.find(
                      (entity) => entity.value == quote.quote_service_id,
                    )}
                    placeholder=""
                    onChange={(e) => {
                      setQuote({
                        ...quote,
                        quote_service_id: e.value || null,
                      });
                    }}
                    isDisabled={!isEnableEdit}
                  />
                  <CustomInputField
                    isSelect={true}
                    optionsArray={quoteTypes}
                    label="Urgency"
                    value={quoteTypes.find(
                      (entity) => entity.value == quote.quote_type_id,
                    )}
                    placeholder=""
                    onChange={(e) => {
                      setQuote({
                        ...quote,
                        quote_type_id: e.value || null,
                      });
                    }}
                    isDisabled={!isEnableEdit}
                  />

                  {/* Radio Fields */}
                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Tailgate?
                    </FormLabel>
                    <Box width="100%">
                      <RadioGroup
                        value={quote.is_tailgate_required ? "1" : "0"}
                        onChange={(e) => {
                          setQuote({
                            ...quote,
                            is_tailgate_required: e === "1" ? true : false,
                          });
                        }}
                        isDisabled={!isEnableEdit}
                      >
                        <Stack direction="row">
                          <Radio value="0">No</Radio>
                          <Radio value="1" pl={6}>
                            Yes
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </Box>
                  </Flex>

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Stackable Freight?
                    </FormLabel>
                    <Box width="100%">
                      <RadioGroup
                        value={quote.is_stackable_freight ? "1" : "0"}
                        onChange={(e) => {
                          setQuote({
                            ...quote,
                            is_stackable_freight: e === "1" ? true : false,
                          });
                        }}
                        isDisabled={!isEnableEdit}
                      >
                        <Stack direction="row">
                          <Radio value="0">No</Radio>
                          <Radio value="1" pl={6}>
                            Yes
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </Box>
                  </Flex>

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Hand Unloading?
                    </FormLabel>
                    <Box width="100%">
                      <RadioGroup
                        value={quote.is_hand_unloading ? "1" : "0"}
                        onChange={(e) => {
                          setQuote({
                            ...quote,
                            is_hand_unloading: e === "1" ? true : false,
                          });
                        }}
                        isDisabled={!isEnableEdit}
                      >
                        <Stack direction="row">
                          <Radio value="0">No</Radio>
                          <Radio value="1" pl={6}>
                            Yes
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </Box>
                  </Flex>

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Dangerous Goods?
                    </FormLabel>
                    <Box width="100%">
                      <RadioGroup
                        value={quote.is_dangerous_goods ? "1" : "0"}
                        onChange={(e) => {
                          setQuote({
                            ...quote,
                            is_dangerous_goods: e === "1" ? true : false,
                          });
                        }}
                        isDisabled={!isEnableEdit}
                      >
                        <Stack direction="row">
                          <Radio value="0">No</Radio>
                          <Radio value="1" pl={6}>
                            Yes
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </Box>
                  </Flex>

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Timeslot Required?
                    </FormLabel>
                    <Box width="100%">
                      <RadioGroup
                        value={quote.is_timeslot_required ? "1" : "0"}
                        onChange={(e) => {
                          setQuote({
                            ...quote,
                            is_timeslot_required: e === "1" ? true : false,
                          });
                        }}
                        isDisabled={!isEnableEdit}
                      >
                        <Stack direction="row">
                          <Radio value="0">No</Radio>
                          <Radio value="1" pl={6}>
                            Yes
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </Box>
                  </Flex>

                  {isAdmin && (
                    <CustomInputField
                      isInput
                      label="Quoted Price (Buy Price)"
                      placeholder=""
                      name="quoted_price"
                      value={quote.quoted_price}
                      onChange={(e) =>
                        setQuote({
                          ...quote,
                          [e.target.name]: e.target.value,
                        })
                      }
                      isDisabled={!isEnableEdit}
                    />
                  )}

                  <Flex alignItems="center" mb="16px">
                    <FormLabel
                      display="flex"
                      mb="0"
                      width="200px"
                      fontSize="sm"
                      fontWeight="500"
                      _hover={{ cursor: "pointer" }}
                    >
                      Client Notes
                    </FormLabel>
                    <Box width="100%">
                      <ReactQuill
                        readOnly={!isEnableEdit}
                        theme="snow"
                        value={quote.customer_notes}
                        onChange={(html) => {
                          setQuote({
                            ...quote,
                            customer_notes: html,
                          });
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
                      {isEnableEdit ? (
                        <QuoteAddressesSection
                          entityModel={quote}
                          savedAddressesSelect={savedAddressesSelect}
                          defaultQuoteDestination={pickUpDestination}
                          onAddressSaved={(hasChanged) => {
                            getCustomerAddresses();
                          }}
                          quoteDestinationChanged={(quoteDestination) => {
                            setPickUpDestination({
                              ...pickUpDestination,
                              ...quoteDestination,
                              ...{ id: pickUpDestination.id },
                              ...{ is_pickup: true },
                              ...(!pickUpDestination.id && { is_new: true }),
                            });
                            setQuote({
                              ...quote,
                              ...{
                                pick_up_lng: quoteDestination.lng,
                                pick_up_lat: quoteDestination.lat,
                                pick_up_address: quoteDestination.address,
                                pick_up_notes: quoteDestination.notes,
                                pick_up_name: quoteDestination.name,
                                pick_up_report: quoteDestination.report,
                              },
                            });
                          }}
                        />
                      ) : (
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
                      )}
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
                            {isEnableEdit ? (
                              <QuoteAddressesSection
                                entityModel={quote}
                                savedAddressesSelect={savedAddressesSelect}
                                defaultQuoteDestination={quoteDestination}
                                quoteDestinationChanged={(quoteDestination) => {
                                  handleQuoteDestinationChanged(
                                    quoteDestination,
                                    index,
                                  );
                                }}
                                onAddressSaved={(hasChanged) => {
                                  getCustomerAddresses();
                                }}
                              />
                            ) : (
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
                            )}

                            <GridItem>
                              <Flex>
                                {/* if index == 0 */}
                                {quoteDestinations.length > 1 &&
                                  isEnableEdit && (
                                    <Button
                                      bg="white"
                                      className="!text-[var(--chakra-colors-black-400)] mt-[3px] !py-3 !px-1 !h-[unset]"
                                      onClick={() => {
                                        handleRemoveFromQuoteDestinations(
                                          index,
                                        );
                                      }}
                                    >
                                      <FontAwesomeIcon
                                        icon={faTrashCan}
                                        className="!text-[var(--chakra-colors-black-400)]"
                                      />
                                    </Button>
                                  )}
                              </Flex>
                            </GridItem>
                          </Grid>
                          <Divider className="my-6" />
                        </Box>
                      );
                    })}
                  </Box>

                  {isEnableEdit && (
                    <Box mb="16px">
                      <Flex alignItems="center" mb="16px" mt={5}>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            addToQuoteDestinations();
                          }}
                        >
                          + Add delivery location
                        </Button>
                      </Flex>
                      <Divider className="my-12" />
                    </Box>
                  )}
                </Box>
                {
                  <>
                    <Box>
                      <h3 className="mb-6">Attachments</h3>

                      <Flex width="100%" className="mb-6">
                        <FileInput
                          entity="Quote"
                          entityId={quote.id}
                          onUpload={(url) => {
                            getQuote();
                            setIsUpdatingMedia(true);
                          }}
                          description="Browse or drop your files here to upload"
                          height="80px"
                          bg="primary.100"
                        />
                      </Flex>

                      {/* foreach Quote Attachments */}
                      {!quoteLoading && quote?.media.length >= 0 && (
                        <>
                          <PaginationTable
                            columns={attachmentColumns}
                            data={quote.media}
                            onDelete={(mediaId) => {
                              setIsUpdatingMedia(true);
                              handleDeleteMedia({
                                variables: {
                                  id: mediaId,
                                },
                              });
                            }}
                          />
                        </>
                      )}
                    </Box>
                    <Divider className="my-12" />
                  </>
                }

                {/* Items */}
                <Box mt={4}>
                  <Flex justify="space-between" align="center" mb="20px">
                    <h3 className="">Items</h3>
                    <Button
                      hidden={!isEnableEdit}
                      variant="secondary"
                      onClick={() => {
                        addToQuoteItems();
                      }}
                    >
                      + Add item
                    </Button>
                  </Flex>
                  {isEnableEdit ? (
                    <Box>
                      <QuoteItemsTable
                        data={quoteItems}
                        optionsSelect={itemTypes}
                        onRemoveClick={(index) => {
                          handleRemoveQuoteItem(index);
                        }}
                        onValueChanged={handleQuoteItemChanged}
                      />
                      <Divider className="my-12" />
                    </Box>
                  ) : (
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
                        style={{ height: "100px" }}
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
                  )}
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
                      {/* <SearchBar
                        hidden={isCustomer}
                        background={menuBg}
                        onChangeSearchQuery={onChangeSearchQuery}
                        me="10px"
                        borderRadius="30px"
                      /> */}
                      <Button
                        fontSize="sm"
                        lineHeight="19px"
                        variant="secondary"
                        className=""
                        onClick={() =>
                          setQuoteLineItems([
                            ...quoteLineItems,
                            {
                              id: null,
                              name: "",
                              quote_id: quote.id,
                              unit_amount: 0,
                              quantity: 0,
                              line_amount: 0,
                            },
                          ])
                        }
                        isLoading={quoteLoading}
                        hidden={isCustomer || !isEnableEdit}
                        isDisabled={isSaving}
                      >
                        + Add Item
                      </Button>
                    </Flex>
                    {!quoteLoading && (
                      <>
                        <TableContainer>
                          <Table variant="simple">
                            <Thead>
                              <Tr>
                                <Th pl="0">Description</Th>
                                <Th>Rate</Th>
                                <Th>QTY</Th>
                                <Th>Amount</Th>
                                {!isCustomer && <Th>Action</Th>}
                              </Tr>
                            </Thead>

                            <Tbody>
                              {quoteLineItems.map(
                                (quoteLineItem: any, index: number) => (
                                  <Tr key={index}>
                                    <Td pl="0">
                                      <Input
                                        variant="main"
                                        value={quoteLineItem.name}
                                        onChange={(e) => {
                                          let items = [...quoteLineItems];
                                          let item = {
                                            ...quoteLineItems[index],
                                          };
                                          item[e.target.name] = e.target.value;
                                          items[index] = item;
                                          setQuoteLineItems(items);
                                        }}
                                        type="text"
                                        name="name"
                                        className="max-w-md"
                                        fontSize="sm"
                                        ms={{ base: "0px", md: "0px" }}
                                        mb="0"
                                        fontWeight="500"
                                        size="lg"
                                        isDisabled={isCustomer || !isEnableEdit}
                                        hidden={isCustomer}
                                      />
                                      <Skeleton
                                        hidden={!isCustomer}
                                        isLoaded={!quoteLoading}
                                        w="75%"
                                      >
                                        {quoteLineItem.name}
                                      </Skeleton>
                                    </Td>

                                    <Td maxWidth="160px">
                                      <Input
                                        variant="main"
                                        value={quoteLineItem.unit_amount}
                                        onChange={(e) => {
                                          let items = [...quoteLineItems];
                                          let item = {
                                            ...quoteLineItems[index],
                                          };
                                          item[e.target.name] = e.target.value;
                                          item.line_amount = (
                                            item.quantity *
                                            parseFloat(e.target.value)
                                          ).toFixed(2);
                                          items[index] = item;
                                          setQuoteLineItems(items);
                                        }}
                                        type="number"
                                        name="unit_amount"
                                        className="max-w-md"
                                        fontSize="sm"
                                        ms={{ base: "0px", md: "0px" }}
                                        mb="0"
                                        fontWeight="500"
                                        size="lg"
                                        isDisabled={isCustomer || !isEnableEdit}
                                        hidden={isCustomer}
                                      />
                                      <Skeleton
                                        hidden={!isCustomer}
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
                                      <Input
                                        variant="main"
                                        value={quoteLineItem.quantity}
                                        onChange={(e) => {
                                          let items = [...quoteLineItems];
                                          let item = {
                                            ...quoteLineItems[index],
                                          };
                                          item[e.target.name] = e.target.value;
                                          item.line_amount = (
                                            item.unit_amount *
                                            parseFloat(e.target.value)
                                          ).toFixed(2);
                                          items[index] = item;
                                          setQuoteLineItems(items);
                                        }}
                                        type="text"
                                        name="quantity"
                                        className="max-w-md"
                                        fontSize="sm"
                                        ms={{ base: "0px", md: "0px" }}
                                        mb="0"
                                        fontWeight="500"
                                        size="lg"
                                        isDisabled={isCustomer || !isEnableEdit}
                                        hidden={isCustomer}
                                      />
                                      <Skeleton
                                        hidden={!isCustomer}
                                        isLoaded={!quoteLoading}
                                        w="75%"
                                      >
                                        {quoteLineItem.quantity}
                                      </Skeleton>
                                    </Td>

                                    <Td maxWidth="120px">
                                      <Input
                                        disabled={true}
                                        variant="main"
                                        value={quoteLineItem.line_amount}
                                        onChange={(e) => {
                                          let items = [...quoteLineItems];
                                          let item = {
                                            ...quoteLineItems[index],
                                          };
                                          item[e.target.name] = e.target.value;
                                          items[index] = item;
                                          setQuoteLineItems(items);
                                        }}
                                        type="text"
                                        name="line_amount"
                                        className="max-w-md"
                                        fontSize="sm"
                                        ms={{ base: "0px", md: "0px" }}
                                        mb="0"
                                        fontWeight="500"
                                        size="lg"
                                        isDisabled={isCustomer || !isEnableEdit}
                                        hidden={isCustomer}
                                      />
                                      <Skeleton
                                        hidden={!isCustomer}
                                        isLoaded={!quoteLoading}
                                        w="75%"
                                      >
                                        {formatCurrency(
                                          quoteLineItem.line_amount,
                                          quoteLineItem.currency,
                                        )}
                                      </Skeleton>
                                    </Td>
                                    {!isCustomer && (
                                      <Td>
                                        {isEnableEdit && (
                                          <AreYouSureAlert
                                            onDelete={() => {
                                              if (quoteLineItem.id === null) {
                                                setQuoteLineItems([
                                                  ...quoteLineItems.slice(
                                                    0,
                                                    index,
                                                  ),
                                                  ...quoteLineItems.slice(
                                                    index + 1,
                                                  ),
                                                ]);
                                                return;
                                              }
                                              setDeleteQuoteLineItemId(
                                                quoteLineItem.id,
                                              );
                                              setTimeout(() => {
                                                handleDeleteQuoteLineItem();
                                              }, 500);
                                            }}
                                            isLoading={isSaving}
                                          ></AreYouSureAlert>
                                        )}
                                      </Td>
                                    )}
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

                {
                  <Box className="w-full mt-4">
                    <Flex>
                      <Box className="max-w-[50%] w-full">
                        <CustomInputField
                          isTextArea={true}
                          showLabel={false}
                          isDisabled={isCustomer}
                          placeholder="Admin Notes"
                          name="admin_notes"
                          value={quote.admin_notes}
                          onChange={(e) =>
                            setQuote({
                              ...quote,
                              [e.target.name]: e.target.value,
                            })
                          }
                          maxWidth="80%"
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
                }

                <>
                  <Divider className="mt-12 mb-6" />
                  <Flex gap={4}>
                    <Box hidden={!isAdmin || !isEnableEdit}>
                      <Button
                        variant="primary"
                        isDisabled={isProcessBooking}
                        onClick={() => {
                          handleProcessAndBook();
                        }}
                      >
                        {isProcessBooking
                          ? "Processing and Booking ..."
                          : "Process and Book"}
                      </Button>
                    </Box>
                    <Box hidden={!isAdmin || !isEnableEdit}>
                      <Button
                        variant="primary"
                        isDisabled={isProcessing}
                        onClick={() => {
                          handleProcess();
                        }}
                      >
                        {isProcessing ? "Processing ..." : "Process Only"}
                      </Button>
                    </Box>
                    <Box hidden={!isAdmin || !isEnableEdit}>
                      <Button
                        variant="secondary"
                        isDisabled={isSending}
                        onClick={() => {
                          handleSendQuote();
                        }}
                      >
                        {isSending ? "Sending ..." : "Send Quote"}
                      </Button>
                    </Box>
                    <Box hidden={!isEnableEdit}>
                      <Button
                        variant="primary"
                        isDisabled={isSaving}
                        onClick={() => {
                          handleUpdateQuote();
                        }}
                      >
                        {isSaving ? "Saving Changes..." : "Save Changes"}
                      </Button>
                    </Box>
                    <Box hidden={!isEnableEdit}>
                      <Flex alignItems="center" className="mb-8">
                        <AreYouSureAlert
                          onDelete={handleDeleteQuote}
                        ></AreYouSureAlert>
                      </Flex>
                    </Box>
                  </Flex>
                </>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}
