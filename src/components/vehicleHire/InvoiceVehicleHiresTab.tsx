import {
  Box,
  Button,
  Divider,
  Flex,
  GridItem,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { formatCurrency } from "helpers/helper";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export default function InvoiceVehicleHiresTab(props: {
  vehicleHireObject: any;
}) {
  const { vehicleHireObject } = props;
  const toast = useToast();

  const isAdmin = useSelector((state: RootState) => state.user.isAdmin);
  const isCompany = useSelector((state: RootState) => state.user.isCompany);
  const isCustomer = useSelector((state: RootState) => state.user.isCustomer);
  const textColor = useColorModeValue("navy.700", "white");
  let menuBg = useColorModeValue("white", "navy.800");
  const textColorSecodary = useColorModeValue("#888888", "#888888");
  const [job, setJob] = React.useState<any>(vehicleHireObject);
  const router = useRouter();
  useEffect(() => {
    let _customer = null;

    if (
      vehicleHireObject.customer_invoice &&
      vehicleHireObject.customer_invoice.customer &&
      !vehicleHireObject.customer_invoice.customer?.full_name
    ) {
      _customer = {
        ...vehicleHireObject.customer_invoice.customer,
        full_name:
          vehicleHireObject.customer_invoice.customer?.first_name +
          " " +
          vehicleHireObject.customer_invoice.customer?.last_name,
      };
    }
    setJob({
      ...vehicleHireObject,
      customer_invoice: {
        ...vehicleHireObject.customer_invoice,
        customer: _customer
          ? _customer
          : vehicleHireObject.customer_invoice?.customer,
      },
    });
  }, [vehicleHireObject]);
  return (
    <Box mt={5}>
      {/* Invoice */}
      <Box mb={10} mt={10} width="">
        <Flex mb={1}>
          <Text fontWeight="800!" ms="2px" mr={10} mt={0} textColor={textColor}>
            Customer
          </Text>
          <SimpleGrid columns={{ sm: 1 }} ml={10}>
            <GridItem>
              <Text fontWeight="800!" fontSize="sm" color={"blue.500"}>
                {job.customer_invoice?.customer?.full_name}
              </Text>
            </GridItem>
            <GridItem>
              <Text
                fontSize="xs"
                fontWeight="400"
                mt={1}
                textColor={textColorSecodary}
              >
                {job.customer_invoice?.customer?.company?.name}
              </Text>
            </GridItem>
          </SimpleGrid>
        </Flex>
      </Box>
      <Divider />

      <Box mb={10} mt={10} width="">
        <Flex mb={1}>
          <Text fontWeight="800!" ms="2px" mr={10} mt={0} textColor={textColor}>
            Invoice
          </Text>
        </Flex>
        <Flex mb={1}>
          <Table>
            <Thead>
              <Tr>
                <Th>Description</Th>
                <Th>Rate</Th>
                <Th>QTY</Th>
                <Th colSpan={2} textAlign="end">
                  AMOUNT
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {job.customer_invoice?.invoice_line_items?.map(
                (item: any, index: number) => {
                  return (
                    <Tr key={"row-" + index}>
                      <Td>{item.name}</Td>
                      <Td>{formatCurrency(item.unit_amount, item.currecy)}</Td>
                      <Td>{item.quantity}</Td>
                      <Td colSpan={2} textAlign="end">
                        {formatCurrency(item.line_amount, item.currency)}
                      </Td>
                    </Tr>
                  );
                },
              )}

              <Tr>
                <Td pt={2} pb={2} colSpan={3} borderBottom="none"></Td>
                <Td pt={2} pb={2}>
                  <Text fontWeight="600!" fontSize="sm">
                    Subtotal
                  </Text>
                </Td>
                <Td pt={2} pb={2} textAlign="end">
                  <Text fontWeight="500!" fontSize="sm">
                    {formatCurrency(job.customer_invoice?.sub_total)}
                  </Text>
                </Td>
              </Tr>
              <Tr>
                <Td pt={2} pb={2} colSpan={3} borderBottom="none"></Td>
                <Td pt={2} pb={2}>
                  <Text fontWeight="600!" fontSize="sm">
                    GTS (10%)
                  </Text>
                </Td>
                <Td pt={2} pb={2} textAlign="end">
                  <Text fontWeight="500!" fontSize="sm">
                    {formatCurrency(job.customer_invoice?.total_tax)}
                  </Text>
                </Td>
              </Tr>
              <Tr>
                <Td pt={2} pb={2} colSpan={3} borderBottom="none"></Td>
                <Td pt={2} pb={2}>
                  <Text fontWeight="600!" fontSize="sm">
                    Total
                  </Text>
                </Td>
                <Td pt={2} pb={2} textAlign="end">
                  <Text fontWeight="500!" fontSize="sm">
                    {formatCurrency(job.customer_invoice?.total)}
                  </Text>
                </Td>
              </Tr>
              <Tr>
                <Td pt={2} pb={2} colSpan={3} borderBottom="none"></Td>
                <Td pt={2} pb={2}>
                  <Text fontWeight="800!" fontSize="md">
                    Balance Due
                  </Text>
                </Td>
                <Td pt={2} pb={2} textAlign="end">
                  <Text fontWeight="800!" fontSize="md">
                    {
                      //formatCurrency(job.customer_invoice?.amount_due)
                      formatCurrency(job.customer_invoice?.total)
                    }
                  </Text>
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end" mt={1}>
          <SimpleGrid minWidth={"35vw"}>
            {isCustomer && (
              <GridItem>
                <Text fontWeight="800!" fontSize="md" mt={7}>
                  Approval
                </Text>
                <Text fontWeight="500" fontSize="sm" mt={7}>
                  Invoice approved by xxxxxxx on xx xxx xxxx, xx:xx xx
                </Text>
              </GridItem>
            )}
            <GridItem mt={7}>
              <Button
                hidden={!isCustomer}
                px={5}
                py={1}
                mr={5}
                fontSize="sm"
                fontWeight="500"
                variant="brand"
                onClick={() => {
                  toast({ title: "TODO: Approve Invoice", status: "error" }); //TODO: Approve Invoice
                }}
              >
                Approve Invoice
              </Button>
              <Button
                px={5}
                py={1}
                fontSize="sm"
                fontWeight="500"
                variant="secondary"
                onClick={() => {
                  toast({ title: "TODO: download invoice", status: "error" }); //TODO: download invoice
                }}
              >
                Download invoice
              </Button>
              <Button
                hidden={!isAdmin}
                ml={5}
                px={5}
                py={1}
                fontSize="sm"
                variant="brand"
                fontWeight="500"
                onClick={() => {
                  if (job.customer_invoice?.id)
                    router.push(`/admin/invoices/${job.customer_invoice?.id}`);
                }}
              >
                Edit Invoice
              </Button>
            </GridItem>
          </SimpleGrid>
        </Flex>
      </Box>
    </Box>
  );
}
