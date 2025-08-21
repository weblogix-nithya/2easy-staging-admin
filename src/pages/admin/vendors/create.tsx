// External Libraries
import { useMutation, useQuery } from "@apollo/client";
// Chakra UI Components
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Textarea,
  useColorModeValue,
  useToast
} from "@chakra-ui/react";
// Custom Components
import AddressesModal from "components/addresses/AddressesModal";
import FileInput from "components/fileInput/FileInput";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
// GraphQL Queries & Constants
import { CREATE_VENDOR_MUTATION, defaultVendor, GET_VENDOR_SERVICES_QUERY,paymentTerms } from "graphql/vendor";
// Layouts
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import Select from "react-select";

const customStyles = {
  control: (provided) => ({
    ...provided,
    height: '40px', // Set the height
    minHeight: '40px', // Set the minimum height
    width: '200px', // Set the width
    fontSize: '16px', // Set the font size
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: '16px', // Set the font size for the selected value
  }),
  option: (provided) => ({
    ...provided,
    fontSize: '16px', // Set the font size for the options
  }),
};

function VendorCreate() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  // //  const textColorSecondary = "gray.400";
  const [vendor, setVendor] = useState(defaultVendor);
  const router = useRouter();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [handleCreateVendor, { }] = useMutation(CREATE_VENDOR_MUTATION, {
    variables: {
      input: {
        name: vendor?.name,
        abn: vendor?.abn,
        contact_phone: vendor?.contact_phone,
        contact_email: vendor?.contact_email,
        account_email: vendor?.account_email,
        address: vendor?.address,
        address_business_name: vendor?.address_business_name,
        address_line_1: vendor?.address_line_1,
        address_line_2: vendor?.address_line_2,
        address_city: vendor?.address_city,
        address_postal_code: vendor?.address_postal_code,
        address_state: vendor?.address_state,
        address_country: vendor?.address_country,
        lng: vendor?.lng,
        lat: vendor?.lat,
        lcl_rate: vendor?.lcl_rate,
        is_pod_sendable: vendor?.is_pod_sendable,
        is_invoice_sendable: vendor?.is_invoice_sendable,
        admin_notes: vendor?.admin_notes,
        base_notes: vendor?.base_notes,
        account_name: vendor?.account_name,
        account_number: vendor?.account_number,
        bsb_code: vendor?.bsb_code,
        on_hold: vendor?.on_hold,
        payment_term: vendor?.payment_term ?? null,
        vendor_service_id: Number(vendor?.vendor_service_id),
        // vendor_service: vendor?.vendor_service?.service_name,
      },
    },
    onCompleted: (data) => {
      toast({
        title: "Vendor created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push(`/admin/vendors/${data.createVendor.id}`);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const {
    loading: vendorServicesLoading,
    error: vendorServicesError,
    data: vendorServicesData,
  } = useQuery(GET_VENDOR_SERVICES_QUERY);

  if (vendorServicesError) {
    console.error("Error getting vendor services", vendorServicesError);
  }

  const vendorServiceOptions = vendorServicesData?.vendorServices.map((service: any) => ({
    label: service.service_name,
    value: service.id,
  }));

  const [temporaryMedia, setTemporaryMedia] = useState([]);

  const attachmentColumns = useMemo(
    () => [
      {
        Header: "Document",
        accessor: "path" as const,
      },
      {
        Header: "uploaded by",
        accessor: "uploaded_by" as const,
      },
      {
        Header: "date uploaded",
        accessor: "created_at" as const,
      },
      {
        Header: "Actions",
        accessor: "downloadable_url" as const,
        isDelete: true,
        isEdit: false,
        isDownload: true,
      },
    ],
    [],
  );

  const handleRemoveFromTemporaryMedia = (id: number) => {
    let _temporaryMedia = [...temporaryMedia];
    _temporaryMedia = _temporaryMedia.filter((e) => e.id !== id);
    setTemporaryMedia(_temporaryMedia);
  };

  return (
    <AdminLayout>
      <Box
        className="mk-vendorCreate"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
      >
        {/* Main Fields */}
        <Grid pt="32px" px="24px">
          <FormControl>
            <Flex justifyContent="space-between" alignItems="center">
              <h1 className="mb-0">New Vendor</h1>
              <Button
                fontSize="sm"
                variant="brand"
                onClick={() => handleCreateVendor()}
              >
                Create
              </Button>
            </Flex>

            <Divider className="my-6" />
            <h3 className="mt-6 mb-4">Details</h3>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                mb="0"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
              >
                Name
              </FormLabel>
              <Input
                isRequired={true}
                variant="main"
                value={vendor?.name}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
                    [e.target.name]: e.target.value,
                  })
                }
                type="text"
                name="name"
                className="max-w-md"
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
                value={vendor?.abn}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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
                Main contact number
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="contact_phone"
                value={vendor?.contact_phone}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
                    [e.target.name]: e.target.value,
                  })
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
                value={vendor?.contact_email}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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
                  value={paymentTerms?.find((term) => term.value === vendor?.payment_term)}
                  options={paymentTerms}
                  onChange={(selectedOption) => {
                    setVendor({ ...vendor, payment_term: selectedOption?.value });
                    // console.log("Selected:", selectedOption);
                  }}
                  styles={customStyles}
                  className="select mb-0"
                  classNamePrefix="two-easy-select"
                />
              </Box>
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
                Vendor Service
              </FormLabel>

              <Box className="!max-w-md w-full">
                <Select
                  isLoading={vendorServicesLoading}
                  placeholder="Select Vendor Service"
                  value={vendorServiceOptions?.find(
                    (service: any) => service.value === vendor?.vendor_service_id
                  )}
                  options={vendorServiceOptions}
                  onChange={selectedOption => {
                    setVendor({
                      ...vendor,
                      vendor_service_id: selectedOption?.value,
                      vendor_service: {
                        ...vendor?.vendor_service,
                        service_name: selectedOption?.label,
                        // updated_at: currentDateTime
                      }
                    });
                    // console.log("Selected:", selectedOption);
                  }}
                  styles={customStyles}
                  className="select mb-0"
                  classNamePrefix="two-easy-select"
                />
              </Box>
            </Flex>

            <Flex alignItems="start" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Admin Notes
              </FormLabel>

              <Textarea
                name="admin_notes"
                value={vendor?.admin_notes}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
                    [e.target.name]: e.target.value,
                  })
                }
                className="mb-4 max-w-md"
                fontSize="sm"
                rows={4}
                placeholder="Admin Notes"
              />
            </Flex>

            <Flex alignItems="start" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Base Notes
              </FormLabel>

              <Flex className="flex-col w-full max-w-md">
                <Textarea
                  name="base_notes"
                  value={vendor?.base_notes}
                  onChange={(e) =>
                    setVendor({
                      ...vendor,
                      [e.target.name]: e.target.value,
                    })
                  }
                  fontSize="sm"
                  className="w-full max-w-md"
                  rows={4}
                  placeholder="Base Notes"
                />
                <p className=" bottom-[0] mt-2 text-[10px] text-[var(--chakra-colors-black-500)] font-medium">
                  Base notes are displayed to drivers on all jobs
                  placed by this customer
                </p>
              </Flex>
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
                value={vendor?.account_email}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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
                value={vendor?.address}
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
              defaultAddress={vendor}
              isModalOpen={isAddressModalOpen}
              description="Billing address"
              onModalClose={(e) => setIsAddressModalOpen(e)}
              onSetAddress={(target) => {
                setVendor({ ...vendor, ...target });
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
                value={vendor?.address_line_1}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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
                value={vendor?.address_line_2}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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
                value={vendor?.address_city}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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
                value={vendor?.address_state}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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
                value={vendor?.address_postal_code}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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

            <h3 className="mt-6 mb-4">Payment Details</h3>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                mb="0"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
              >
                Account Name
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="account_name"
                value={vendor?.account_name}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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
                mb="0"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
              >
                BSB
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="bsb_code"
                value={vendor?.bsb_code}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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
                mb="0"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
              >
                Account Number
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="account_number"
                value={vendor?.account_number}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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

            <Flex alignItems="center" mb="16px" className="max-w-md">
              <FormLabel
                htmlFor="on-hold-switch"
                display="flex"
                mb="0"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color="textColor"
              >
                On Hold
              </FormLabel>
              <Switch
                id="on-hold-switch"
                mt="auto"
                mb="auto"
                isChecked={vendor?.on_hold ?? false} // Ensure it's always a boolean
                onChange={(e) => {
                  setVendor((prevVendor) => ({
                    ...prevVendor,
                    on_hold: e.target.checked,
                  }));
                }}
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
                value={vendor?.lcl_rate}
                onChange={(e) =>
                  setVendor({
                    ...vendor,
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
            <Divider className="my-12" />

            {/* Attachments */}
            <Box mb="16px">
              <h3 className="mb-5 mt-3">Attachments</h3>
              <Flex width="100%" className="mb-6">
                <FileInput
                  entity="Job"
                  entityId={vendor?.id}
                  onTemporaryUpload={(_temporaryMedia) => {
                    setTemporaryMedia(_temporaryMedia);
                  }}
                  isTemporary={true}
                  defaulTemporaryFiles={temporaryMedia}
                  description="Browse or drop your files here to upload"
                  height="80px"
                  bg="primary.100"
                ></FileInput>
              </Flex>

              {/* foreach jobAttachments */}
              {temporaryMedia.length >= 0 && (
                <PaginationTable
                  columns={attachmentColumns}
                  data={temporaryMedia}
                  onDelete={(mediaId) => {
                    handleRemoveFromTemporaryMedia(mediaId);
                  }}
                />
              )}
            </Box>

            <Divider className="my-12" />
            <h3 className="mt-6 mb-4">Notifications</h3>
            <Flex className="w-full" alignItems="center">
              <FormLabel
                display="flex"
                mb="0"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
              >
                Send POD
              </FormLabel>

              <RadioGroup
                value={vendor?.is_pod_sendable ? "1" : "0"}
                onChange={(e) => {
                  setVendor({
                    ...vendor,
                    is_pod_sendable: e === "1" ? true : false,
                  });
                }}
              >
                <Stack direction="row" pt={3}>
                  <Radio value="0">No</Radio>
                  <Radio value="1" pl={6}>
                    Yes
                  </Radio>
                </Stack>
              </RadioGroup>
            </Flex>
            <Flex className="w-full" alignItems="center">
              <FormLabel
                display="flex"
                mb="0"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
              >
                Send Invoice
              </FormLabel>

              <RadioGroup
                value={vendor?.is_invoice_sendable ? "1" : "0"}
                onChange={(e) => {
                  setVendor({
                    ...vendor,
                    is_invoice_sendable: e === "1" ? true : false,
                  });
                }}
              >
                <Stack direction="row" pt={3}>
                  <Radio value="0">No</Radio>
                  <Radio value="1" pl={6}>
                    Yes
                  </Radio>
                </Stack>
              </RadioGroup>
            </Flex>
          </FormControl>
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default VendorCreate;
