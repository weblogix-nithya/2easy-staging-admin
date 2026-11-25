import {
  Button,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getNextBusinessDay,
  isStandardJobType,
  isWeekend,
  JobTypeOption,
  parseYMD,
  toYMD,
} from "utils/jobFormHelpers";

// Weekend (Sat/Sun) date rule: only admins can book, and only as Express or Urgent.
// - Admin: a confirm popup; OK keeps Express/Urgent (Urgent if Standard was picked),
//   Cancel goes back to the last weekday date.
// - Customer: a popup to contact 2EASY so an admin books it for them.
// enabled = false turns the rule off (e.g. an edit page before the job has loaded).
export function useWeekendUrgentRule({
  dateYMD,
  isAdmin,
  jobTypeOptions,
  jobTypeId,
  onSelectUrgent,
  onRevertDate,
  enabled = true,
}: {
  dateYMD?: string | null;
  isAdmin: boolean;
  jobTypeOptions: JobTypeOption[];
  jobTypeId: any;
  onSelectUrgent: (option: JobTypeOption) => void;
  onRevertDate: (ymd: string) => void;
  enabled?: boolean;
}) {
  const toast = useToast();
  const isWeekendBooking = useMemo(() => {
    if (!enabled) return false;
    const date = parseYMD(dateYMD);
    return !!date && isWeekend(date);
  }, [dateYMD, enabled]);
  const urgentJobTypeOption = useMemo(
    () =>
      (jobTypeOptions || []).find((opt) =>
        (opt?.label || "").toLowerCase().includes("urgent"),
      ) || null,
    [jobTypeOptions],
  );
  // Job types allowed on a weekend date: everything except Standard.
  const weekendJobTypeOptions = useMemo(
    () => (jobTypeOptions || []).filter((opt) => !isStandardJobType(opt)),
    [jobTypeOptions],
  );
  const isAllowedOnWeekend = useCallback(
    (id: any) => weekendJobTypeOptions.some((opt) => opt.value === id),
    [weekendJobTypeOptions],
  );

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isAdminConfirmOpen, setIsAdminConfirmOpen] = useState(false);
  // The weekend date the admin pressed OK for.
  const [confirmedDate, setConfirmedDate] = useState<string | null>(null);
  const isWeekendConfirmed = isWeekendBooking && confirmedDate === dateYMD;

  // Last weekday date, so Cancel can go back to it.
  const lastWeekdayRef = useRef<string | null>(null);
  useEffect(() => {
    if (dateYMD && !isWeekendBooking) lastWeekdayRef.current = dateYMD;
  }, [dateYMD, isWeekendBooking]);

  const onSelectUrgentRef = useRef(onSelectUrgent);
  const onRevertDateRef = useRef(onRevertDate);
  useEffect(() => {
    onSelectUrgentRef.current = onSelectUrgent;
    onRevertDateRef.current = onRevertDate;
  });

  useEffect(() => {
    if (!isWeekendBooking) {
      setIsAdminConfirmOpen(false);
      return;
    }
    if (!isAdmin) setIsCustomerModalOpen(true);
    else if (confirmedDate !== dateYMD) setIsAdminConfirmOpen(true);
  }, [isWeekendBooking, isAdmin, confirmedDate, dateYMD]);

  // After OK, Express or Urgent may stay; anything else (Standard/none) moves to Urgent.
  useEffect(() => {
    if (!isWeekendConfirmed || !isAdmin || !urgentJobTypeOption) return;
    if (isAllowedOnWeekend(jobTypeId)) return;
    onSelectUrgentRef.current(urgentJobTypeOption);
  }, [isWeekendConfirmed, isAdmin, urgentJobTypeOption, jobTypeId, isAllowedOnWeekend]);

  const confirmWeekend = () => {
    setConfirmedDate(dateYMD ?? null);
    setIsAdminConfirmOpen(false);
  };
  const cancelWeekend = () => {
    setIsAdminConfirmOpen(false);
    onRevertDateRef.current(
      lastWeekdayRef.current || toYMD(getNextBusinessDay(new Date())),
    );
  };

  // Call before saving/booking: false (with the popup or a toast) when the weekend rule blocks it.
  const checkWeekendBooking = useCallback(
    (currentJobTypeId: any) => {
      if (!isWeekendBooking) return true;
      if (!isAdmin) {
        setIsCustomerModalOpen(true);
        return false;
      }
      if (!isWeekendConfirmed) {
        setIsAdminConfirmOpen(true);
        return false;
      }
      if (weekendJobTypeOptions.length && !isAllowedOnWeekend(currentJobTypeId)) {
        toast({
          title: "Express or Urgent only on weekends",
          description: "Saturday or Sunday dates must be Express or Urgent.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
      return true;
    },
    [isWeekendBooking, isAdmin, isWeekendConfirmed, weekendJobTypeOptions, isAllowedOnWeekend, toast],
  );

  return {
    isWeekendBooking,
    weekendJobTypeOptions,
    checkWeekendBooking,
    modalProps: {
      isCustomerModalOpen,
      closeCustomerModal: () => setIsCustomerModalOpen(false),
      isAdminConfirmOpen,
      confirmWeekend,
      cancelWeekend,
    },
  };
}

export default function WeekendBookingModal({
  isCustomerModalOpen,
  closeCustomerModal,
  isAdminConfirmOpen,
  confirmWeekend,
  cancelWeekend,
}: ReturnType<typeof useWeekendUrgentRule>["modalProps"]) {
  return (
    <>
      {/* Admin: confirm the weekend date (OK = Express/Urgent only, Cancel = back to a weekday). */}
      <Modal
        isOpen={isAdminConfirmOpen}
        onClose={cancelWeekend}
        isCentered
        closeOnOverlayClick={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Weekend date selected</ModalHeader>
          <ModalBody>
            <Text mb="8px">
              You have selected a Saturday or Sunday date. Customers can&apos;t
              book weekend jobs; only an admin can create them.
            </Text>
            <Text>
              Weekend jobs can only be Express or Urgent, so Standard is not
              available. Press OK to continue as admin.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={confirmWeekend}>
              OK
            </Button>
            <Button variant="ghost" onClick={cancelWeekend}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Customer: weekend dates can't be booked online. */}
      <Modal isOpen={isCustomerModalOpen} onClose={closeCustomerModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Weekend booking</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb="12px">
              You can&apos;t create a job for a Saturday or Sunday date. Only
              the 2EASY admin team can create weekend jobs. Please contact
              2EASY by email and our admin team will create the job for you.
            </Text>
            <Text fontSize="sm">
              VIC:{" "}
              <Link href="mailto:hello.mel@2easyfreight.com" color="blue.600">
                hello.mel@2easyfreight.com
              </Link>
            </Text>
            <Text fontSize="sm">
              QLD:{" "}
              <Link href="mailto:hello.bne@2easyfreight.com" color="blue.600">
                hello.bne@2easyfreight.com
              </Link>
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={closeCustomerModal}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
