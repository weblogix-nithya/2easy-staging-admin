// Chakra imports
import { useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Input,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import AreYouSureAlert from "components/alert/AreYouSureAlert";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  defaultInvoiceStatus,
  DELETE_INVOICE_STATUS_MUTATION,
  GET_INVOICE_STATUS_QUERY,
  UPDATE_INVOICE_STATUS_MUTATION,
} from "graphql/invoiceStatus";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function InvoiceStatusEdit() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  //  const textColorSecondary = "gray.400";
  const [invoiceStatus, setInvoiceStatus] = useState(defaultInvoiceStatus);
  // const [invoiceStatusStatuses, setInvoiceStatusStatuses] = useState([]);
  // const [invoiceStatusTypes, setInvoiceStatusTypes] = useState([]);
  const router = useRouter();
  const { id } = router.query;

  const {
    loading: invoiceStatusLoading,
    // data: invoiceStatusData,
    // refetch: getInvoiceStatus,
  } = useQuery(GET_INVOICE_STATUS_QUERY, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      if (data?.invoiceStatus == null) {
        router.push("/admin/invoice-statuses");
      }
      setInvoiceStatus({ ...invoiceStatus, ...data?.invoiceStatus });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [handleUpdateInvoiceStatus, {}] = useMutation(UPDATE_INVOICE_STATUS_MUTATION, {
    variables: {
      input: invoiceStatus,
    },
    onCompleted: (_data) => {
      toast({
        title: "InvoiceStatus updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteInvoiceStatus, {}] = useMutation(DELETE_INVOICE_STATUS_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (_data) => {
      toast({
        title: "InvoiceStatus deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/invoice-statuses");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        {/* Main Fields */}
        <Grid>
          {!invoiceStatusLoading && (
            <FormControl>
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="8px"
              >
                Name
              </FormLabel>
              <Input
                isRequired={true}
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                type="text"
                name="name"
                value={invoiceStatus.name}
                onChange={(e) =>
                  setInvoiceStatus({ ...invoiceStatus, [e.target.name]: e.target.value })
                }
                placeholder="John"
                mb="24px"
                fontWeight="500"
                size="lg"
              />
              <Button
                fontSize="sm"
                variant="brand"
                fontWeight="500"
                w="100%"
                h="50"
                mb="24px"
                onClick={() => handleUpdateInvoiceStatus()}
                isLoading={invoiceStatusLoading}
              >
                Update
              </Button>
              <AreYouSureAlert onDelete={handleDeleteInvoiceStatus}></AreYouSureAlert>
            </FormControl>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default InvoiceStatusEdit;
