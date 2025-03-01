// Chakra imports
import { useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Input,
  useColorModeValue,
  useToast
} from "@chakra-ui/react";
import AddressesModal from "components/addresses/AddressesModal";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { CREATE_COMPANY_MUTATION, defaultCompany, paymentTerms } from "graphql/company";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import {useState } from "react";
import Select from "react-select";

function CompanyCreate() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const [company, setCompany] = useState(defaultCompany);
  const router = useRouter();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [handleCreateCompany, { }] = useMutation(CREATE_COMPANY_MUTATION, {
    variables: {
      input: {
        name: company.name,
        abn: company.abn,
        contact_phone: company.contact_phone,
        contact_email: company.contact_email,
        account_email: company.account_email,
        address: company.address,
        address_business_name: company.address_business_name,
        address_line_1: company.address_line_1,
        address_line_2: company.address_line_2,
        address_city: company.address_city,
        address_postal_code: company.address_postal_code,
        address_state: company.address_state,
        address_country: company.address_country,
        lng: company.lng,
        lat: company.lat,
        lcl_rate: company.lcl_rate,
        rate_card_url: undefined,
        logo_url: undefined,
        payment_term: company.payment_term ?? '7_days',
      },
    },
    onCompleted: (data) => {
      toast({
        title: "Company created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push(`/admin/companies/${data.createCompany.id}`);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  return (
    <AdminLayout>
      <Box
        className="mk-companyCreate"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
      >
        {/* Main Fields */}
        <Grid pt="32px" px="24px">
          <FormControl>
            <Flex justifyContent="space-between" alignItems="center">
              <h1 className="mb-0">New Company</h1>
              <Button
                fontSize="sm"
                variant="brand"
                onClick={() => handleCreateCompany()}
              >
                Create
              </Button>
            </Flex>

            <Divider className="my-6" />

            <h3 className="mb-4">Details</h3>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Company Name
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="name"
                value={company.name}
                onChange={(e) =>
                  setCompany({ ...company, [e.target.name]: e.target.value })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
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
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                ABN
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="abn"
                value={company.abn}
                onChange={(e) =>
                  setCompany({ ...company, [e.target.name]: e.target.value })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
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
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Main contact number
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="contact_phone"
                value={company.contact_phone}
                onChange={(e) =>
                  setCompany({ ...company, [e.target.name]: e.target.value })
                }
                placeholder="+61"
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
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
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Main contact email
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="contact_email"
                value={company.contact_email}
                onChange={(e) =>
                  setCompany({ ...company, [e.target.name]: e.target.value })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                mb="0"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
              >
                Payment Terms
              </FormLabel>

              <Box className="!max-w-md w-full">
                <Select
                  placeholder="Select Payment Terms"
                  value={paymentTerms.find((term) => term.value === company.payment_term)}
                  options={paymentTerms}
                  onChange={(selectedOption) => {
                    setCompany({ ...company, payment_term: selectedOption?.value });
                    console.log("Selected:", selectedOption);
                  }}
                  size="lg"
                  className="select mb-0"
                  classNamePrefix="two-easy-select"
                />
              </Box>
            </Flex>


            <Divider />
            <h3 className="mt-6 mb-4">Billing</h3>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Accounts email
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="account_email"
                value={company.account_email}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>
            <h4 className="mt-6 mb-4">Billing Address</h4>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Address
              </FormLabel>
              <Input
                type="text"
                name="address"
                value={company.address}
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
                onClick={() => setIsAddressModalOpen(true)}
              />
            </Flex>

            <AddressesModal
              defaultAddress={company}
              isModalOpen={isAddressModalOpen}
              description="Billing address"
              onModalClose={(e) => setIsAddressModalOpen(e)}
              onSetAddress={(target) => {
                setCompany({ ...company, ...target });
              }}
            />
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Address line 1
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="address_line_1"
                value={company.address_line_1}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
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
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Apt / Suite / Floor
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="address_line_2"
                value={company.address_line_2}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
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
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Address city
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="address_city"
                value={company.address_city}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
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
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Address state
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="address_state"
                value={company.address_state}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
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
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Address postcode
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="address_postal_code"
                value={company.address_postal_code}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>
            <Divider />

            <h3 className="mt-6 mb-4">Rates</h3>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                LCL Rate
              </FormLabel>
              <Input
                isRequired={true}
                type="number"
                name="lcl_rate"
                value={company.lcl_rate}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: parseFloat(e.target.value),
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>
          </FormControl>
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default CompanyCreate;
