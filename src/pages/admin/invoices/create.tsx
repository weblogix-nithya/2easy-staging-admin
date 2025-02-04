// Chakra imports
import { useMutation } from "@apollo/client";
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
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { CREATE_INVOICE_MUTATION, defaultInvoice } from "graphql/invoice";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function InvoiceCreate() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const [invoice, setInvoice] = useState(defaultInvoice);
  const router = useRouter();

  const [handleCreateInvoice, {}] = useMutation(CREATE_INVOICE_MUTATION, {
    variables: {
      input: {
        name: invoice.name,
      },
    },
    onCompleted: (data) => {
      toast({
        title: "Invoice created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push(`/admin/invoices/${data.createInvoice.id}`);
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
              value={invoice.name}
              onChange={(e) =>
                setInvoice({ ...invoice, [e.target.name]: e.target.value })
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
              onClick={() => handleCreateInvoice()}
            >
              Create
            </Button>
          </FormControl>
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default InvoiceCreate;
