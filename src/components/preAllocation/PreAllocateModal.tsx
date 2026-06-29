import { useMutation } from "@apollo/client";
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
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
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
import { PREALLOCATE_JOBS_MUTATION } from "graphql/job";
import { reorderArray } from "helpers/helper";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { JobBulkAssignRow } from "./PreJobBulkAssignRow";

interface FilterJobsModalProps extends UseDisclosureProps {
  selectedDriver: any;
  selectedJobs: any[];
  columns: any[];
  refreshPage: any;
  setSelectedJobs: React.Dispatch<React.SetStateAction<any>>;
  setIsChecked: () => void; // ✅ clearAllRows — just call to clear checkboxes
}

export default function PreAllocateModal({
  columns,
  isOpen,
  onClose,
  selectedJobs,
  refreshPage,
  setSelectedJobs: _setSelectedJobs, // kept in props for parent compatibility, not used inside modal
  selectedDriver,
}: FilterJobsModalProps) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Local copy of jobs used for drag reorder inside the modal.
  // This is intentionally separate from the parent selectedJobs state —
  // because parent state gets reset by JobPaginationTable on every re-render.
  const [localJobs, setLocalJobs] = useState<any[]>([]);

  // Snapshot selectedJobs into localJobs ONLY when modal first opens.
  // Using a ref flag so that drag reorders (which call setLocalJobs)
  // do NOT trigger this effect and reset the order.
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      // Take a one-time snapshot of selectedJobs when modal opens
      setLocalJobs([...selectedJobs]);
      hasInitialized.current = true;
    }
    if (!isOpen) {
      // Reset flag when modal closes so next open gets a fresh snapshot
      hasInitialized.current = false;
      setLocalJobs([]);
    }
    // Intentionally NOT including selectedJobs in deps —
    // we only want to snapshot once on open, not on every parent re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Ref so drag callbacks always read latest localJobs without stale closure
  const localJobsRef = useRef<any[]>([]);
  localJobsRef.current = localJobs;

  // Ref to avoid stale activeId inside onDragEnd closure
  const activeIdRef = useRef<UniqueIdentifier | null>(null);

  // ✅ FIX: PointerSensor instead of MouseSensor + TouchSensor
  // PointerSensor handles mouse + touch in one sensor — more reliable for table rows
  // distance:5 = less travel needed before drag activates (was 8 = too much)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Extract a stable string id from a job item
  const getId = useCallback(
    (item: any): string =>
      String(item?.original?.job?.id ?? item?.id ?? ""),
    [],
  );

  // Find the active item from localJobs for DragOverlay rendering
  const activeItem =
    activeId !== null
      ? localJobs.find((job) => getId(job) === String(activeId)) ?? null
      : null;

  // Stable list of string ids for SortableContext
  const jobIds = localJobs.map((job) => getId(job));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    activeIdRef.current = event.active.id;
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      // Read activeId from ref — avoids stale closure bug
      const currentActiveId = activeIdRef.current;
      activeIdRef.current = null;
      setActiveId(null);

      const { over } = event;
      if (!over || currentActiveId === null) return;

      const currentJobs = localJobsRef.current;

      const fromIndex = currentJobs.findIndex(
        (job: any) => getId(job) === String(currentActiveId),
      );
      const toIndex = currentJobs.findIndex(
        (job: any) => getId(job) === String(over.id),
      );

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        // Spread into new array — React needs new reference to detect state change
        const reordered = reorderArray([...currentJobs], fromIndex, toIndex);
        setLocalJobs(reordered);
      }
    },
    [getId],
  );

  const handleDragCancel = useCallback(() => {
    activeIdRef.current = null;
    setActiveId(null);
  }, []);

  // Build mutation payload from the current localJobs order at click time
  const buildPayload = useCallback(() => {
    return localJobsRef.current.map((item, index) => {
      if (!selectedDriver?.id) return null;
      return {
        id: item?.original?.job?.id,
        customer_id: item?.original?.job?.customer?.id,
        company_id: item?.original?.job?.company?.id,
        preallocation_driver_id: selectedDriver?.id,
        name: item?.original?.job?.name,
        d_sort_id: Number(index + 1),
        sort_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        job_type_id: item?.original?.job?.job_type?.id,
      };
    });
  }, [selectedDriver?.id]);

  const [handleBulkAssignJobs] = useMutation(PREALLOCATE_JOBS_MUTATION, {
    onCompleted: () => {
      toast({
        title: "Jobs pre-allocated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      refreshPage();
      onClose();
    },
    onError: (error) => {
      console.log(error);
      showGraphQLErrorToast(error);
    },
  });

  return (
    <Modal id="bulk-assign-modal" isCentered isOpen={isOpen} onClose={onClose}>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(1px)" />
      <ModalContent maxWidth={"85%"}>
        <ModalHeader>
          <Text m="4">
            Pre-Allocation Jobs{" "}
            {selectedDriver?.full_name ? ` - ${selectedDriver.full_name}` : ""}
          </Text>
          <Divider />
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p="4">
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
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <Table size="sm">
                <Thead>
                  <Tr>
                    {columns.map((column) => (
                      <Th key={`row-header-bulk-assign-${column?.id}`}>
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
                        key={getId(item)}
                        columns={columns}
                        item={item}
                        sortId={getId(item)}
                      />
                    ))}
                  </SortableContext>
                </Tbody>
              </Table>

              {/* Render drag overlay outside modal to avoid overflow:hidden clipping */}
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
                          key={`overlay-${getId(activeItem)}`}
                          columns={columns}
                          item={activeItem}
                          sortId={getId(activeItem)}
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
                isDisabled={isSaving}
                variant="primary"
                onClick={() => {
                  setIsSaving(true);
                  handleBulkAssignJobs({
                    variables: { input: buildPayload() },
                  });
                }}
                className="ml-2"
              >
                Pre-Allocate Jobs
              </Button>
            </Flex>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}