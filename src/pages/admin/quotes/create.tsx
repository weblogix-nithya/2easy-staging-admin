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
  Radio,
  RadioGroup,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import CustomInputField from "components/fields/CustomInputField";
import { GET_COMPANYS_QUERY } from "graphql/company";
import { GET_CUSTOMERS_QUERY } from "graphql/customer";
import { GET_ITEM_TYPES_QUERY } from "graphql/itemType";
import { CREATE_QUOTE_MUTATION, defaultQuote } from "graphql/quote";
import { GET_QUOTE_CATEGORIES_QUERY } from "graphql/quoteCategory";
import { GET_QUOTE_SERVICES_QUERY } from "graphql/quoteService";
import { GET_QUOTE_TYPES_QUERY } from "graphql/quoteType";
import { formatDateTimeToDB, formatToSelect, today } from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export default function QuoteCreate() {
  const toast = useToast();
  const router = useRouter();
  const ReactQuill = useMemo(
    () => dynamic(() => import("react-quill"), { ssr: false }),
    [],
  );

  const { isAdmin, isCustomer, isCompany, userName, customerId, companyId } =
    useSelector((state: RootState) => state.user);
  const [categories, setCategories] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [quoteTypes, setQuoteTypes] = useState([]);
  const [quote, setQuote] = useState(defaultQuote);
  const [customers, setCustomers] = useState([]);
  const [rateCardUrl, setRateCardUrl] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [requiredDateAt, setRequiredDateAt] = useState(today);
  const [readyAt, setReadyAt] = useState("06:00");
  const [dropAt, setDropAt] = useState("17:00");
  const [itemTypes, setItemTypes] = useState([]);
  const [companiesOptions, setCompaniesOptions] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setDebouncedSearch(e);
    }, 300);
  }, []);
  useEffect(() => {
    dateChanged();
  }, [requiredDateAt, dropAt, readyAt]);
  const dateChanged = () => {
    try {
      setQuote({
        ...quote,
        ready_at: formatDateTimeToDB(requiredDateAt, readyAt),
        date_required: formatDateTimeToDB(requiredDateAt, dropAt),
      });
    } catch (e) {
      //console.log(e);
      // something here
    }
  };

  useEffect(() => {
    if (isCustomer) {
      setQuote({
        ...quote,
        customer_name: userName,
        customer_id: customerId,
        ...(companyId ? { company_id: companyId } : {}),
      });
    }
  }, [companyId, isCustomer]);

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
      setItemTypes([]);
      data.itemTypes.data.map((_entity: any) => {
        setItemTypes((itemTypes) => [
          ...itemTypes,
          {
            value: parseInt(_entity.id),
            label: _entity.name,
          },
        ]);
      });
    },
  });

  const {
    loading,
    error,
    data,
    refetch: getCustomers,
  } = useQuery(GET_CUSTOMERS_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 1000,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    skip: !isAdmin,
    onCompleted: (data) => {
      setCustomers([]);
      setCustomers(data.customers?.data);
    },
  });

  useEffect(() => {
    if (quote.company_id) {
       setCustomerOptions([]); 
       getCustomers({ company_id: quote.company_id });
      setCustomerOptions(
        formatToSelect(
           customers.filter(
            (customer) => customer.company_id === quote.company_id,
          ),
          "id",
          "full_name",
        ),
      );
    }
   
  }, [quote.company_id]);

  useQuery(GET_COMPANYS_QUERY, {
    variables: {
      query: debouncedSearch,
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setCompaniesOptions([]);
      data.companys.data.map((_entity: any) => {
        setCompaniesOptions((companys) => [
          ...companys,
          {
            value: parseInt(_entity.id),
            label: _entity.name,
          },
        ]);
      });
    },
  });

  useEffect(() => {
    if (quote.customer_id && isAdmin) {
      setRateCardUrl(
        customers.find((customer) => customer.id === quote.customer_id)
          .rate_card_url,
      );` `
    }
  }, [quote.customer_id]);

  const [handleCreateQuote, { loading: saving }] = useMutation(
    CREATE_QUOTE_MUTATION,
    {
      variables: {
        input: {
          ...quote,
          id: undefined,
          quote_status_id: 1,
          media: undefined,
          is_approved: undefined,
          is_quote_send: undefined,
          job: undefined,
          quote_status: undefined,
          quote_line_items: undefined,
          ready_at: formatDateTimeToDB(requiredDateAt, readyAt),
          date_required: formatDateTimeToDB(requiredDateAt, dropAt),
        },
      },
      onCompleted: async (data) => {
        toast({
          title: "Quote created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        router.push(`/admin/quotes/${data.createQuote.id}`);
      },
    },
  );

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
          <Grid pl="6" backgroundColor="white">
            <FormControl>
              <h1 className="my-8">New Quote</h1>
              {/* Fields */}
              <Box mb="16px">
                {!isCompany && (
                  <CustomInputField
                    isSelect={true}
                    optionsArray={companiesOptions}
                    label="Company:"
                    value={companiesOptions.find(
                      (entity) => entity.value === quote.company_id,
                    )}
                    placeholder=""
                    onInputChange={(e) => {
                      onChangeSearchQuery(e);
                    }}
                    onChange={(e) => {
                      setQuote({
                        ...quote,
                        company_id: e.value || null,
                      });
                    }}
                  />
                )}
                {isCustomer ? (
                  <CustomInputField
                    label="Customer Name"
                    placeholder=""
                    name="customer_name"
                    value={quote.customer_name}
                    isDisabled={true}
                  />
                ) : (
                  <CustomInputField
                    isSelect={true}
                    optionsArray={customerOptions}
                    label="Customer Name"
                    placeholder=""
                    name="customer_name"
                    value={
                      customerOptions.find(
                        (entity) => entity.value == quote.customer_id,
                      ) || { value: null, label: "" }
                    }
                    onChange={(e) =>
                      setQuote({
                        ...quote,
                        customer_id: e.value || null,
                        customer_name: e.label || null,
                      })
                    }
                  />
                )}
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
                      {quote.customer_id && rateCardUrl ? (
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
                />
                <CustomInputField
                  label="Ready by:"
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
                />
                <CustomInputField
                  isSelect={true}
                  optionsArray={serviceTypes}
                  label="Service Type"
                  value={
                    serviceTypes.find(
                      (entity) => entity.value === quote.quote_service_id,
                    ) || { value: 0, label: "" }
                  }
                  placeholder=""
                  onChange={(e) => {
                    setQuote({
                      ...quote,
                      quote_service_id: e.value || null,
                    });
                  }}
                />
                <CustomInputField
                  isSelect={true}
                  optionsArray={quoteTypes}
                  label="Urgency"
                  value={
                    quoteTypes.find(
                      (entity) => entity.value === quote.quote_type_id,
                    ) || { value: 0, label: "" }
                  }
                  placeholder=""
                  onChange={(e) => {
                    setQuote({
                      ...quote,
                      quote_type_id: e.value || null,
                    });
                  }}
                />
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
                      defaultValue={"0"}
                      onChange={(e) => {
                        setQuote({
                          ...quote,
                          is_tailgate_required: e === "1" ? true : false,
                        });
                      }}
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
                      defaultValue={"0"}
                      onChange={(e) => {
                        setQuote({
                          ...quote,
                          is_stackable_freight: e === "1" ? true : false,
                        });
                      }}
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
                      defaultValue={"0"}
                      onChange={(e) => {
                        setQuote({
                          ...quote,
                          is_dangerous_goods: e === "1" ? true : false,
                        });
                      }}
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
                      defaultValue={"0"}
                      onChange={(e) => {
                        setQuote({
                          ...quote,
                          is_timeslot_required: e === "1" ? true : false,
                        });
                      }}
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
                    onChange={(e) =>
                      setQuote({
                        ...quote,
                        [e.target.name]: e.target.value,
                      })
                    }
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

              <Divider className="mt-12 mb-6" />

              {/* Create Job Button */}
              <Flex alignItems="center" className="mb-6">
                <Button
                  variant="primary"
                  onClick={() => {
                    handleCreateQuote();
                  }}
                  isDisabled={saving}
                >
                  Create Quote
                </Button>
              </Flex>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
}
