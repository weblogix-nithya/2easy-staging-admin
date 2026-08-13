import { useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Switch,
  Text,
  UseDisclosureProps,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { DndContext, UniqueIdentifier } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  BULK_UPDATE_DYNAMIC_TABLE_USERS_MUTATION,
  DynamicTableUser,
  GET_DYNAMIC_TABLE_USERS_QUERY,
} from "graphql/dynamicTableUser";
import { reorderArray } from "helpers/helper";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

import SortableJobTableSetting from '../jobs/SortableJobTableSetting';

// ✅ NEW: hard cap on how many columns a user can have active at once,
// per Sam's approval. Prevents the table from getting overloaded again.
const MAX_ACTIVE_COLUMNS = 12;

// ✅ NEW: the default column set approved by Sam. Matched against
// `item.name` — if your DynamicTableUser records store the column label
// under a different field (e.g. `dynamic_table.column_description`),
// update DEFAULT_COLUMN_NAMES or the matching logic in handleResetToDefault
// accordingly.
const DEFAULT_COLUMN_NAMES = [
  "Delivery ID",
  "Quad",
  "Ready By / Drop by",
  "Pickup Address and Name",
  "Delivery Address and Name",
  "Dimensions",
];


export default function JobTableSettingsModal(props: UseDisclosureProps) {
  const { isOpen, onClose } = props;
  const userId = useSelector((state: RootState) => state.user.userId);
  const toast = useToast();
  const [dynamicTableUsers, setDynamicTableUsers] = useState<
    DynamicTableUser[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const getIndex = (id: UniqueIdentifier) =>
    dynamicTableUsers?.findIndex(
      (dynamicTableUser: DynamicTableUser) => dynamicTableUser.id == id,
    );
  // const getPosition = (id: UniqueIdentifier) => getIndex(id) + 1;
  const activeIndex = activeId ? getIndex(activeId) : -1;

  useEffect(() => {
    if (isOpen == true) {
      getDynamicTableUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const { refetch: getDynamicTableUsers } = useQuery(
    GET_DYNAMIC_TABLE_USERS_QUERY,
    {
      variables: {
        query: "",
        page: 1,
        first: 100,
        orderByColumn: "sort_id",
        orderByOrder: "ASC",
        user_id: userId,
        table_name: "pre-allocation-jobs",
      },
      skip: !userId && !isOpen,
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        setDynamicTableUsers(
          data.dynamicTableUsers.data.map((item: DynamicTableUser) => item));
        setIsLoading(false);
      },
    },
  );

  // // Prefetch data when component mounts
  // useEffect(() => {
  //   getDynamicTableUsers();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // // Refresh data when modal opens if needed
  // useEffect(() => {
  //   if (isOpen) {
  //     setIsLoading(true);
  //     getDynamicTableUsers();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isOpen]);

  const activeCount = dynamicTableUsers.filter(
    (item) => item.is_active,
  ).length;

  // ✅ NEW: resets to Sam's approved default set — matches by column name
  // (case/whitespace-insensitive) against DEFAULT_COLUMN_NAMES above.
  const handleResetToDefault = () => {
    const normalize = (s: string) => s?.trim().toLowerCase();
    const defaultSet = new Set(DEFAULT_COLUMN_NAMES.map(normalize));
    setDynamicTableUsers(
      dynamicTableUsers.map((item) => ({
        ...item,
        is_active: defaultSet.has(normalize(item.name)),
      })),
    );
  };

  const sortedDynamicTableUsers = dynamicTableUsers.map((item, index) => {
    return {
      id: item.id,
      is_active: item.is_active,
      sort_id: index + 1,
    };
  });

  const [handleBulkUpdateDynamicTableUsers, { }] = useMutation(
    BULK_UPDATE_DYNAMIC_TABLE_USERS_MUTATION,
    {
      variables: {
        input: sortedDynamicTableUsers,
      },
      onCompleted: (_data) => {
        toast({
          title: "User table settings updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        onClose();
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  return (
    <Modal
      id="job-table-setting-modal"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      motionPreset="none"
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(1px)" />
      <ModalContent>
        <ModalHeader>
          Table Settings
          <Text fontSize="sm" fontWeight="normal" color="gray.500">
            {activeCount} / {MAX_ACTIVE_COLUMNS} columns active
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack w="full" align="start" spacing={3}>
            {isLoading ? (
              <Spinner size="xl" />
            ) : (
              <>
                <Divider mb="2" />
                <DndContext
                  onDragStart={({ active }) => {
                    if (!active) {
                      return;
                    }
                    setActiveId(active.id);
                  }}
                  onDragEnd={({ over }) => {
                    setActiveId(null);
                    if (over) {
                      const overIndex = getIndex(over.id);
                      if (activeIndex !== overIndex) {
                        let newArray = reorderArray(
                          dynamicTableUsers,
                          activeIndex,
                          overIndex,
                        );
                        setDynamicTableUsers(newArray);
                      }
                    }
                  }}
                  onDragCancel={() => setActiveId(null)}
                >
                  <SortableContext
                    items={dynamicTableUsers.filter((item: DynamicTableUser) => {
                      return item.is_active;
                    })}
                  >
                    {dynamicTableUsers
                      .filter((item: DynamicTableUser) => {
                        return item.is_active;
                      })
                      .map((item: DynamicTableUser) => (
                        <SortableJobTableSetting
                          key={item.id}
                          dynamicTableUser={item}
                          onActiveToggle={() => {
                            setDynamicTableUsers(
                              [...dynamicTableUsers].map((dynamicTableUser) => {
                                if (dynamicTableUser.id === item.id) {
                                  return {
                                    ...dynamicTableUser,
                                    is_active: !dynamicTableUser.is_active,
                                  };
                                } else return dynamicTableUser;
                              }),
                            );
                          }}
                        />
                      ))}
                  </SortableContext>
                </DndContext>

                {dynamicTableUsers
                  .filter((item: DynamicTableUser) => {
                    return !item.is_active;
                  })
                  .map((item: DynamicTableUser) => (
                    <Box key={"disabled-" + item.id} w={"full"}>
                      <div className="flex justify-between">
                        <div className="flex flex-col">
                          <p>{item.name}</p>
                          <Text
                            className="text-sm text-slate-600"
                            variant="black.500"
                          >
                            {item.dynamic_table?.column_description}
                          </Text>
                        </div>
                        <Switch
                          mt="auto"
                          mb="auto"
                          isChecked={item.is_active}
                          onChange={(e) => {
                            // ✅ NEW: block enabling past the 12-column cap
                            if (e.target.checked && activeCount >= MAX_ACTIVE_COLUMNS) {
                              toast({
                                title: `You can only have up to ${MAX_ACTIVE_COLUMNS} columns active at once`,
                                description: "Turn off another column first to enable this one.",
                                status: "warning",
                                duration: 3000,
                                isClosable: true,
                              });
                              return;
                            }
                            setDynamicTableUsers(
                              [...dynamicTableUsers].map((dynamicTableUser) => {
                                if (dynamicTableUser.id === item.id) {
                                  return {
                                    ...dynamicTableUser,
                                    is_active: e.target.checked,
                                  };
                                } else return dynamicTableUser;
                              }),
                            );
                          }}
                        />
                      </div>
                      <Divider mt="1" />
                    </Box>
                  ))
                }
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter justifyContent={"center"}>
          <Box w={"full"}>
            <Flex justifyContent={"space-between"}>
              <Flex gap={2}>
                <Button
                  variant="outline"
                  onClick={() => onClose()}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleResetToDefault}
                >
                  Reset to Default
                </Button>
              </Flex>
              <Button
                variant="primary"
                onClick={() => handleBulkUpdateDynamicTableUsers()}
                className="ml-2"
              >
                Save
              </Button>
            </Flex>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}