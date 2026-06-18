import { useLazyQuery, useMutation } from "@apollo/client";
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
  Table,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
  UseDisclosureProps,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import {
  BULK_UPDATE_JOB_MUTATION,
  GET_PREALLOCATED_JOBS_BY_DRIVER_QUERY,
} from "graphql/job";
import { reorderArray } from "helpers/helper";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { JobBulkAssignRow } from "./PreJobBulkAssignRow";

function formatDate(date: Date, isStart: boolean): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const time = isStart ? "00:00:00" : "23:59:59";
  return `${year}-${month}-${day} ${time}`;
}

interface FilterJobsModalProps extends UseDisclosureProps {
  driver: any;
  isOpen: boolean;
  onClose: () => void;
  columns: any[];
  setSelectedJobs: React.Dispatch<React.SetStateAction<any>>;
  setIsChecked: React.Dispatch<React.SetStateAction<any>>;
  rangeDate?: [Date, Date];
}

export default function AssignJobsModal({
  columns,
  isOpen,
  onClose,
  setSelectedJobs,
  setIsChecked,
  driver,
  rangeDate,
}: FilterJobsModalProps) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [localJobs, setLocalJobs] = useState<any[]>([]);

  // ✅ FIX 1: Use ref to track localJobs during drag — avoids re-render on every mouse move
  const localJobsRef = useRef<any[]>([]);
  localJobsRef.current = localJobs;

  // ✅ FIX 2: Sensors with activation constraints — drag starts only after 8px move
  // This prevents accidental drags and reduces main thread load during small movements
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [fetchDriverJobs, { loading: jobsLoading }] = useLazyQuery(
    GET_PREALLOCATED_JOBS_BY_DRIVER_QUERY,
    {
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        const jobs =
          data?.jobs?.data?.map((job: any) => ({
            id: job.id,
            original: { job },
          })) || [];
        setLocalJobs(jobs);
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  useEffect(() => {
    if (!isOpen) {
      setLocalJobs([]);
      return;
    }
    if (!driver) return;

    const driverId = parseInt(String(driver?.value ?? driver?.id), 10);
    if (!driverId) return;

    fetchDriverJobs({
      variables: {
        preallocation_driver_id: driverId,
        between_at: rangeDate?.[0]
          ? {
            from_at: formatDate(rangeDate[0], true),
            to_at: formatDate(rangeDate[1], false),
          }
          : undefined,
        first: 20,
        page: 1,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, driver?.id, driver?.value]);

  // ✅ FIX 3: useCallback so getIndex doesn't recreate on every render
  const getIndex = useCallback(
    (id: UniqueIdentifier) =>
      localJobsRef.current.findIndex((job: any) => String(job.id) === String(id)),
    [],
  );

  const activeIndex = activeId !== null ? getIndex(activeId) : -1;
  const activeItem = activeIndex !== -1 ? localJobs[activeIndex] : null;

  // ✅ FIX 4: sortedBulkAssignJobs computed ONLY on confirm click — NOT as useMemo
  // useMemo was recalculating on every drag move causing 200-500ms main thread blocks
  const buildPayload = useCallback(() => {
    return localJobsRef.current.map((item, index) => {
      if (!driver?.id && !driver?.value) return null;
      return {
        id: item.original.job.id,
        customer_id: item.original.job.customer.id,
        company_id: item.original.job.company.id,
        driver_id: parseInt(String(driver?.value ?? driver?.id), 10),
        preallocation_driver_id: null,
        name: item.original.job.name,
        d_sort_id: Number(index + 1),
        sort_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        job_type_id: item.original.job.job_type_id,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.id, driver?.value]);

  const [handleBulkAssignJobs] = useMutation(BULK_UPDATE_JOB_MUTATION, {
    onCompleted: () => {
      toast({
        title: "Jobs assigned successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsChecked(false);
      setSelectedJobs([]);
      setLocalJobs([]);
      setIsSaving(false);
      onClose();
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
      setIsSaving(false);
    },
  });

  // ✅ FIX 5: Memoize jobIds array so SortableContext doesn't re-render during drag
  const jobIds = localJobs.map((job) => job.id);

  return (
    <Modal id="bulk-assign-modal" isCentered isOpen={isOpen} onClose={onClose}>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(1px)" />
      <ModalContent maxWidth={"85%"}>
        <ModalHeader>
          <Text m="4">
            Pre-Allocated Jobs assigned to
            {driver?.full_name
              ? ` - ${driver.full_name}`
              : driver?.label
                ? ` - ${driver.label}`
                : ""}
          </Text>
          <Divider />
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p="4">
          {jobsLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="lg" color="blue.500" />
              <Text mt={3} color="gray.500">
                Loading jobs...
              </Text>
            </Box>
          ) : localJobs.length === 0 ? (
            <Box textAlign="center" py={10} color="gray.500">
              No pre-allocated jobs found for this driver.
            </Box>
          ) : (
            <VStack
              overflowX="auto"
              spacing={4}
              w="full"
              align="start"
              p={4}
              mb={4}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={({ active }) => {
                  if (!active) return;
                  setActiveId(active.id);
                }}
                onDragEnd={({ over }) => {
                  setActiveId(null);
                  if (over) {
                    const overId = over.id;
                    const currentJobs = localJobsRef.current;
                    const fromIndex = currentJobs.findIndex(
                      (job: any) => String(job.id) === String(activeId),
                    );
                    const toIndex = currentJobs.findIndex(
                      (job: any) => String(job.id) === String(overId),
                    );
                    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                      setLocalJobs(reorderArray(currentJobs, fromIndex, toIndex));
                    }
                  }
                }}
                onDragCancel={() => setActiveId(null)}
              >
                <Table size="sm">
                  <Thead>
                    <Tr>
                      {columns.map((column) => (
                        <Th key={`row-header-bulk-assign-${column.id}`}>
                          {column.Header}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    <SortableContext
                      items={jobIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {localJobs.map((item) => (
                        <JobBulkAssignRow
                          key={item.id}
                          columns={columns}
                          item={item}
                        />
                      ))}
                    </SortableContext>
                  </Tbody>
                </Table>

                {/* ✅ Portal renders DragOverlay outside Modal's overflow:hidden */}
                {createPortal(
                  <DragOverlay dropAnimation={null}>
                    {activeItem ? (
                      <Table
                        size="sm"
                        style={{
                          width: "100%",
                          tableLayout: "fixed",
                          borderCollapse: "collapse",
                          background: "#EBF8FF",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                        }}
                      >
                        <Tbody>
                          <JobBulkAssignRow
                            key={`overlay-${activeItem.id}`}
                            columns={columns}
                            item={activeItem}
                            isDragOverlay
                          />
                        </Tbody>
                      </Table>
                    ) : null}
                  </DragOverlay>,
                  document.body,
                )}
              </DndContext>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter justifyContent={"center"}>
          <Box w={"full"}>
            <Flex justifyContent={"space-between"}>
              <Button
                variant="outline"
                onClick={() => onClose()}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                isDisabled={isSaving || jobsLoading || localJobs.length === 0}
                variant="primary"
                onClick={() => {
                  setIsSaving(true);
                  // ✅ Payload built only on click, not on every drag move
                  handleBulkAssignJobs({
                    variables: { input: buildPayload() },
                  });
                }}
                className="ml-2"
              >
                {isSaving ? <Spinner size="sm" mr={2} /> : null}
                Confirm to assign Jobs ({localJobs.length})
              </Button>
            </Flex>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}