import { useMutation, useQuery } from "@apollo/client";
// Chakra imports
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Input,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { CREATE_CLIENT_MUTATION, defaultClient } from "graphql/client";
import { GET_CLIENT_STATUSES_QUERY } from "graphql/clientStatuses";
import { GET_CLIENT_TYPES_QUERY } from "graphql/clientTypes";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function ClientCreate() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  // //  const textColorSecondary = "gray.400";
  const [client, setClient] = useState(defaultClient);
  const [clientStatuses, setClientStatuses] = useState([]);
  const [clientTypes, setClientTypes] = useState([]);

  useQuery(GET_CLIENT_STATUSES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setClientStatuses([]);
      data.clientStatuses.data.map((clientStatus: any) => {
        setClientStatuses((clientStatuses) => [
          ...clientStatuses,
          { value: parseInt(clientStatus.id), label: clientStatus.name },
        ]);
      });
    },
  });

  useQuery(GET_CLIENT_TYPES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setClientTypes([]);
      data.clientTypes.data.map((clientType: any) => {
        setClientTypes((clientTypes) => [
          ...clientTypes,
          { value: parseInt(clientType.id), label: clientType.name },
        ]);
      });
    },
  });

  const router = useRouter();

  const [handleCreateClient, {}] = useMutation(CREATE_CLIENT_MUTATION, {
    variables: {
      input: {
        first_name: client.first_name,
        last_name: client.last_name,
        full_name: client.full_name,
        email: client.email,
        client_status_id: client.client_status_id,
        client_type_id: client.client_type_id,
        organisation_id: 1,
      },
    },
    onCompleted: (data) => {
      toast({
        title: "Client created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push(`/admin/clients/${data.createClient.id}`);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "97px", xl: "97px" }}>
        {/* Main Fields */}
        <Grid>
          <FormControl>
            <Flex justifyContent="space-between" alignItems="center">
              <h1 className="mb-0">Create client</h1>
              <Button
                fontSize="sm"
                variant="brand"
                fontWeight="500"
                h="50"
                onClick={() => handleCreateClient()}
              >
                Create New
              </Button>
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
                First Name
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="first_name"
                value={client.first_name}
                onChange={(e) =>
                  setClient({ ...client, [e.target.name]: e.target.value })
                }
                placeholder="John"
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
                fontWeight="500"
                color={textColor}
                mb="0"
              >
                Full Name
              </FormLabel>
              <Input
                isRequired={true}
                variant="main"
                type="email"
                name="full_name"
                value={client.full_name}
                onChange={(e) =>
                  setClient({ ...client, [e.target.name]: e.target.value })
                }
                className="max-w-md"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                placeholder="John Doe"
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
                Email
              </FormLabel>
              <Input
                isRequired={true}
                variant="main"
                type="email"
                name="email"
                value={client.email}
                onChange={(e) =>
                  setClient({ ...client, [e.target.name]: e.target.value })
                }
                className="max-w-md"
                placeholder={`mail@${process.env.NEXT_PUBLIC_APP_NAME}.com.au`}
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
                Client Status
              </FormLabel>
              <Box className="!max-w-md w-full">
                <Select
                  instanceId="client-status"
                  placeholder="Select Status"
                  options={clientStatuses}
                  onChange={(e) => {
                    setClient({ ...client, client_status_id: e.value });
                  }}
                  size="lg"
                  className="select"
                  classNamePrefix="two-easy-select"
                ></Select>
              </Box>
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
                Client Type
              </FormLabel>

              <Box className="!max-w-md w-full">
                <Select
                  instanceId="client-type"
                  placeholder="Select Type"
                  options={clientTypes}
                  onChange={(e) => {
                    setClient({ ...client, client_type_id: e.value });
                  }}
                  size="lg"
                  className="select"
                  classNamePrefix="two-easy-select"
                ></Select>
              </Box>
            </Flex>
          </FormControl>
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default ClientCreate;
