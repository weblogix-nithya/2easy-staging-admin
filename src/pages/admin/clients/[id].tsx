// Chakra imports
import { useMutation, useQuery } from "@apollo/client";
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
import AreYouSureAlert from "components/alert/AreYouSureAlert";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  defaultClient,
  DELETE_CLIENT_MUTATION,
  GET_CLIENT_QUERY,
  UPDATE_CLIENT_MUTATION,
} from "graphql/client";
import { GET_CLIENT_STATUSES_QUERY } from "graphql/clientStatuses";
import { GET_CLIENT_TYPES_QUERY } from "graphql/clientTypes";
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

function ClientEdit() {
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
  const { id } = router.query;

  const {
    loading: clientLoading,
    // data: clientData,
    // refetch: getClient,
  } = useQuery(GET_CLIENT_QUERY, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      if (data?.client == null) {
        router.push("/admin/clients");
      }
      setClient({ ...client, ...data?.client });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [handleUpdateClient, {}] = useMutation(UPDATE_CLIENT_MUTATION, {
    variables: {
      input: client,
    },
    onCompleted: () => {
      toast({
        title: "Client updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteClient, {}] = useMutation(DELETE_CLIENT_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: () => {
      toast({
        title: "Client deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/clients");
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
          {!clientLoading && (
            <FormControl>
              <Flex
                justifyContent="space-between"
                alignItems="center"
                mb="24px"
              >
                <h1 className="mb-0">Edit client</h1>

                <Flex>
                  <AreYouSureAlert
                    onDelete={handleDeleteClient}
                  ></AreYouSureAlert>
                  <Button
                    fontSize="sm"
                    variant="brand"
                    fontWeight="500"
                    w="100%"
                    h="50"
                    mb="0"
                    ms="10px"
                    onClick={() => handleUpdateClient()}
                    isLoading={clientLoading}
                  >
                    Update
                  </Button>
                </Flex>
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
                  First Name
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="main"
                  value={client.first_name}
                  onChange={(e) =>
                    setClient({ ...client, [e.target.name]: e.target.value })
                  }
                  type="text"
                  name="first_name"
                  placeholder="John"
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
                  mb="0"
                  width="200px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                >
                  Last Name
                </FormLabel>
                <Input
                  isRequired={true}
                  placeholder="John"
                  type="text"
                  name="last_name"
                  value={client.last_name}
                  onChange={(e) =>
                    setClient({ ...client, [e.target.name]: e.target.value })
                  }
                  fontSize="sm"
                  ms={{ base: "0px", md: "0px" }}
                  variant="main"
                  className="max-w-md"
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
                  Full Name
                </FormLabel>
                <Input
                  disabled
                  isRequired={true}
                  placeholder="John Doe"
                  type="email"
                  name="full_name"
                  value={`${client.first_name} ${client.last_name}`}
                  onChange={(e) =>
                    setClient({ ...client, [e.target.name]: e.target.value })
                  }
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
                  Email
                </FormLabel>
                <Input
                  isRequired={true}
                  placeholder={`mail@${process.env.NEXT_PUBLIC_APP_NAME}.com.au`}
                  type="email"
                  name="email"
                  value={client.email}
                  onChange={(e) =>
                    setClient({ ...client, [e.target.name]: e.target.value })
                  }
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
                  Client Status
                </FormLabel>
                <Box className="!max-w-md w-full">
                  <Select
                    placeholder="Select Status"
                    defaultValue={clientStatuses.find(
                      (clientStatus) =>
                        clientStatus.value === client.client_status_id,
                    )}
                    options={clientStatuses}
                    onChange={(e) => {
                      setClient({ ...client, client_status_id: e.value });
                    }}
                    size="lg"
                    className="select mb-0"
                    classNamePrefix="two-easy-select"
                  ></Select>
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
                  Client Type
                </FormLabel>
                <Box className="!max-w-md w-full">
                  <Select
                    placeholder="Select Type"
                    defaultValue={clientTypes.find(
                      (clientType) =>
                        clientType.value === client.client_type_id,
                    )}
                    options={clientTypes}
                    onChange={(e) => {
                      setClient({ ...client, client_type_id: e.value });
                    }}
                    size="lg"
                    className="select mb-0"
                    classNamePrefix="two-easy-select"
                  ></Select>
                </Box>
              </Flex>
            </FormControl>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default ClientEdit;
