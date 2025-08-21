// Chakra imports
import { useLazyQuery, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Textarea,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { GET_COMPANY_QUERY } from "graphql/company";
import { CREATE_CUSTOMER_MUTATION, defaultCustomer } from "graphql/customer";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function CustomerCreate() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  // //  const textColorSecondary = "gray.400";
  const [customer, setCustomer] = useState(defaultCustomer);
  const [companyName, setCompanyName] = useState(null);
  const router = useRouter();
  const { company_id } = router.query;

  const [handleCreateCustomer, {}] = useMutation(CREATE_CUSTOMER_MUTATION, {
    variables: {
      input: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        abn: customer.abn,
        phone_no: customer.phone_no,
        email: customer.email,
        company_name: companyName || customer.company_name,
        company_id: company_id || null,
      },
    },
    onCompleted: (data) => {
      toast({
        title: "Customer created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push(`/admin/customers/${data.createCustomer.id}`);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [getCompany, {}] = useLazyQuery(GET_COMPANY_QUERY, {
    variables: {
      id: company_id,
    },
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data.company) {
        setCompanyName(data?.company.name);
      }
    },
    onError(error) {
      console.log(error);
    },
  });

  useEffect(() => {
    if (company_id) {
      getCompany();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company_id]);

  return (
    <AdminLayout>
      <Box
        className="mk-customerCreate"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
      >
        {/* Main Fields */}
        <Grid pt="32px" px="24px">
          <FormControl>
            <Flex justifyContent="space-between" alignItems="center">
              <h1 className="mb-0">New Customer</h1>
              <Button variant="brand" onClick={() => handleCreateCustomer()}>
                Create
              </Button>
            </Flex>

            <Divider className="my-6" />

            <h3 className="mb-4">Details</h3>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                mb="0"
                width="200px"
                color={textColor}
                fontSize="sm"
                fontWeight="500"
              >
                First Name
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="first_name"
                value={customer.first_name}
                onChange={(e) =>
                  setCustomer({ ...customer, [e.target.name]: e.target.value })
                }
                placeholder="John"
                className="max-w-md"
                variant="main"
                size="lg"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontSize="sm"
                fontWeight="500"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="0"
              >
                Last Name
              </FormLabel>
              <Input
                isRequired={true}
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                type="text"
                name="last_name"
                value={customer.last_name}
                onChange={(e) =>
                  setCustomer({ ...customer, [e.target.name]: e.target.value })
                }
                className="max-w-md"
                placeholder="Doe"
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="0"
              >
                Full Name
              </FormLabel>
              <Input
                disabled
                isRequired={true}
                type="text"
                name="full_name"
                value={`${customer.first_name} ${customer.last_name}`}
                onChange={(e) =>
                  setCustomer({ ...customer, [e.target.name]: e.target.value })
                }
                placeholder="Doe"
                className="max-w-md"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontSize="sm"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="0"
              >
                Admin Notes
              </FormLabel>
              <Textarea
                isRequired={true}
                name="admin_notes"
                value={customer.admin_notes}
                onChange={(e) =>
                  setCustomer({ ...customer, [e.target.name]: e.target.value })
                }
                placeholder="Admin notes"
                className="max-w-md"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontSize="sm"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="0"
              >
                Base Notes
              </FormLabel>
              <Textarea
                isRequired={true}
                name="base_notes"
                value={customer.base_notes}
                onChange={(e) =>
                  setCustomer({ ...customer, [e.target.name]: e.target.value })
                }
                placeholder="Base notes"
                className="max-w-md"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontSize="sm"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="0"
              >
                ABN
              </FormLabel>
              <Input
                isRequired={true}
                variant="main"
                type="text"
                name="abn"
                value={customer.abn}
                onChange={(e) =>
                  setCustomer({ ...customer, [e.target.name]: e.target.value })
                }
                placeholder=""
                className="max-w-md"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontSize="sm"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="0"
              >
                Phone Number
              </FormLabel>
              <Input
                isRequired={true}
                variant="main"
                type="text"
                name="phone_no"
                value={customer.phone_no}
                onChange={(e) =>
                  setCustomer({ ...customer, [e.target.name]: e.target.value })
                }
                placeholder=""
                className="max-w-md"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontSize="sm"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="0"
              >
                Email
              </FormLabel>
              <Input
                isRequired={true}
                variant="main"
                type="text"
                name="email"
                value={customer.email}
                onChange={(e) =>
                  setCustomer({ ...customer, [e.target.name]: e.target.value })
                }
                placeholder=""
                className="max-w-md"
                mb="0"
                ms={{ base: "0px", md: "0px" }}
                fontSize="sm"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="0"
              >
                Company Name
              </FormLabel>
              {company_id !== undefined ? (
                <Input
                  disabled={true}
                  isRequired={true}
                  variant="main"
                  type="text"
                  value={companyName}
                  placeholder=""
                  className="max-w-md"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontSize="sm"
                  fontWeight="500"
                  size="lg"
                />
              ) : (
                <Input
                  isRequired={true}
                  variant="main"
                  type="text"
                  name="company_name"
                  value={customer.company_name}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      [e.target.name]: e.target.value,
                    })
                  }
                  placeholder=""
                  className="max-w-md"
                  ms={{ base: "0px", md: "0px" }}
                  mb="0"
                  fontSize="sm"
                  fontWeight="500"
                  size="lg"
                />
              )}
            </Flex>
          </FormControl>
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default CustomerCreate;
