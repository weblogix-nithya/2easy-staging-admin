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
  defaultInvoiceLineItem,
  DELETE_INVOICE_LINE_ITEM_MUTATION,
  GET_INVOICE_LINE_ITEM_QUERY,
  UPDATE_INVOICE_LINE_ITEM_MUTATION,
} from "graphql/invoiceLineItem";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function InvoiceLineItemEdit() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const [invoiceLineItem, setInvoiceLineItem] = useState(defaultInvoiceLineItem);
  const [invoiceLineItemStatuses, setInvoiceLineItemStatuses] = useState([]);
  const [invoiceLineItemTypes, setInvoiceLineItemTypes] = useState([]);
  const router = useRouter();
  const { id } = router.query;

  const {
    loading: invoiceLineItemLoading,
    data: invoiceLineItemData,
    refetch: getInvoiceLineItem,
  } = useQuery(GET_INVOICE_LINE_ITEM_QUERY, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      if (data?.invoiceLineItem == null) {
        router.push("/admin/invoice-line-items");
      }
      setInvoiceLineItem({ ...invoiceLineItem, ...data?.invoiceLineItem });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [handleUpdateInvoiceLineItem, {}] = useMutation(UPDATE_INVOICE_LINE_ITEM_MUTATION, {
    variables: {
      input: invoiceLineItem,
    },
    onCompleted: (data) => {
      toast({
        title: "InvoiceLineItem updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteInvoiceLineItem, {}] = useMutation(DELETE_INVOICE_LINE_ITEM_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      toast({
        title: "InvoiceLineItem deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/invoice-line-items");
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
          {!invoiceLineItemLoading && (
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
                value={invoiceLineItem.name}
                onChange={(e) =>
                  setInvoiceLineItem({ ...invoiceLineItem, [e.target.name]: e.target.value })
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
                onClick={() => handleUpdateInvoiceLineItem()}
                isLoading={invoiceLineItemLoading}
              >
                Update
              </Button>
              <AreYouSureAlert onDelete={handleDeleteInvoiceLineItem}></AreYouSureAlert>
            </FormControl>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default InvoiceLineItemEdit;
