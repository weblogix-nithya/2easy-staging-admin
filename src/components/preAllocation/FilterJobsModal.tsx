import { gql, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormLabel,
  // Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  UseDisclosureProps,
  VStack,
} from "@chakra-ui/react";
import { CreatableSelect, Select } from "chakra-react-select";
import CustomInputField from "components/fields/CustomInputField";
import { GET_COMPANYS_QUERY } from "graphql/company";
// import { formatDateTimeToDB } from "helpers/helper";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

import {
  defaultSelectedFilter,
  filterDisplayNames as defaultFilterDisplayNames, SelectedFilter
} from "./Filters";

// ─── GraphQL ─────────────────────────────────────────────────────────────────
export const GET_AREA_COLOR_LIST = gql`
  query GetAreaColorList($states: [String!]) {
    areaColorList(states: $states) {
      id
      state
      area
      color
    }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface FilterJobsModalProps extends UseDisclosureProps {
  // jobStatuses?: { value: string; label: string }[];
  // jobCategories?: { value: string; label: string }[];
  onFilterApply: (
    selectedFilters: SelectedFilter,
    filterDisplayNames: any,
  ) => void;
  selectedFilters: SelectedFilter;
  setSelectedFilters: React.Dispatch<React.SetStateAction<SelectedFilter>>;
  jobFilter: any;
  filterDisplayNames: any;
  setJobFilter: any;
}

export default function FilterJobsModal({
  isOpen,
  onClose,
  // jobStatuses,
  // jobCategories,
  onFilterApply,
  selectedFilters,
  setSelectedFilters,
  jobFilter,
  setJobFilter,
  filterDisplayNames,
}: FilterJobsModalProps) {
  const isCompany = useSelector((state: RootState) => state.user.isCompany);

  // ── Local filter display names ───────────────────────────────────────────
  const [localFilterDisplayNames, setLocalFilterDisplayNames] =
    useState(filterDisplayNames);

  // ── Companies ────────────────────────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [companiesOptions, setCompaniesOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const onChangeSearchCompany = useMemo(
    () => debounce((e: string) => setDebouncedSearch(e), 300),
    [],
  );

  const { data: companiesData } = useQuery(GET_COMPANYS_QUERY, {
    variables: {
      query: debouncedSearch,
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    skip: !isOpen, // don't fetch while modal is closed
  });
  useEffect(() => {
    if (!companiesData?.companys?.data) return;
    setCompaniesOptions(
      companiesData.companys.data.map((e: any) => ({
        value: String(e.id),
        label: e.name,
      })),
    );
  }, [companiesData]);

  useEffect(() => {
    return () => {
      // lodash.debounce adds .cancel()
      // @ts-ignore
      onChangeSearchCompany.cancel?.();
    };
  }, [onChangeSearchCompany]);


  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFilterApply = () => {
    onFilterApply({ ...selectedFilters }, { ...localFilterDisplayNames });
    onClose();
  };

  const handleResetAll = () => {
    onFilterApply(
      { ...defaultSelectedFilter },
      { ...defaultFilterDisplayNames },
    );
    onClose();
  };

  function handleInputHighlight(
    event: React.MouseEvent<HTMLInputElement, MouseEvent>,
  ): void {
    // User request to highlight input field on click
    event.currentTarget.select();
  }

  // ── Static options ────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stateOptions = [
    { value: "Victoria", label: "VIC" },
    { value: "Queensland", label: "QLD" },
    { value: "New South Wales", label: "NSW" },
    { value: "Western Australia", label: "WA" },
    { value: "South Australia", label: "SA" },
    { value: "Tasmania", label: "TAS" },
  ];


  // ── Area / Quadrant ────────────────────────────────────────────

  // Get selected state values
  const selectedStateValues = useMemo(
    () => (selectedFilters.states ?? []).map((s: any) => s.value),
    [selectedFilters.states]
  );

  // Fetch areas based on selected states
  const { data: areaData, loading: areaLoading } = useQuery(
    GET_AREA_COLOR_LIST,
    {
      variables: { states: selectedStateValues },
      skip: !isOpen || selectedStateValues.length === 0,
    }
  );

  // Area options state
  const [areaOptions, setAreaOptions] = useState<
    { value: string; label: string; state: string }[]
  >([]);

  // Build area dropdown options
  useEffect(() => {
    if (!areaData?.areaColorList) {
      setAreaOptions([]);
      return;
    }

    // Remove duplicates safely
    const unique = new Map<string, { value: string; label: string; state: string }>();

    areaData.areaColorList.forEach((a: any) => {
      if (!unique.has(a.area)) {
        unique.set(a.area, {
          value: a.area,
          label: a.area,
          state: a.state,
        });
      }
    });

    setAreaOptions(Array.from(unique.values()));
  }, [areaData]);

  useEffect(() => {
    if (jobFilter.states?.length) {
      setSelectedFilters(prev => ({
        ...prev,
        states: jobFilter.states.map(s => ({
          value: s,
          label:
            stateOptions.find(opt => opt.value === s)?.label || s,
        })),
      }));
    }
  }, [jobFilter.states, stateOptions, setSelectedFilters]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal id="filter-jobs-modal" isCentered isOpen={isOpen} onClose={onClose}>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(1px)" />
      <ModalContent>
        <ModalHeader>Filter Jobs</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack w="full" align="start" spacing={3}>
            <Divider />
            <Box w={"full"}>
              <FormLabel>State</FormLabel>
              <Select
                components={{
                  DropdownIndicator: () => null,
                  IndicatorSeparator: () => null,
                }}
                value={selectedFilters.states}
                isMulti={true}
                options={stateOptions}
                name="states"
                onChange={(e) => {
                  setSelectedFilters({
                    ...selectedFilters,
                    states: e.length > 0 ? e : undefined,
                  });
                  const values = e.map((o) => o.value);
                  const labels = e.map((o) => o.label).join(",");
                  setJobFilter({
                    ...jobFilter,
                    states: values,
                  });
                  setLocalFilterDisplayNames({
                    ...localFilterDisplayNames,
                    states: {
                      ...localFilterDisplayNames.states,
                      value: labels,
                    },
                  });
                }}
              />
            </Box>

            {/* ── Quad ── */}
            <Box w={"full"}>
              <FormLabel>Quad</FormLabel>
              <Select
                components={{
                  DropdownIndicator: () => null,
                  IndicatorSeparator: () => null,
                }}
                value={selectedFilters.quadrant ?? []}
                isMulti
                options={areaOptions}
                name="quadrant"
                isDisabled={selectedStateValues.length === 0}
                placeholder={
                  selectedStateValues.length === 0
                    ? "Select a state first"
                    : areaLoading
                      ? "Loading..."
                      : "Select quadrants..."
                }

                onChange={(e) => {
                  setSelectedFilters({
                    ...selectedFilters,
                    quadrant: e.length > 0 ? e : undefined,
                  });

                  const values = e.map((o) => o.value);
                  const labels = e.map((o) => o.label).join(",");

                  setJobFilter({
                    ...jobFilter,
                    quadrant: values,
                  });

                  setLocalFilterDisplayNames({
                    ...localFilterDisplayNames,
                    quadrant: {
                      label: "Quadrant",   // 🔥 IMPORTANT FIX
                      value: labels,
                    },
                  });
                }}
              />
            </Box>

            {/* ── Suburb ── */}
            <Box w={"full"}>
              <FormLabel>Suburb</FormLabel>
              <CreatableSelect
                isMulti
                value={selectedFilters.suburbs}
                components={{
                  DropdownIndicator: () => null,
                  IndicatorSeparator: () => null,
                }}
                onChange={(e) => {
                  setSelectedFilters({
                    ...selectedFilters,
                    suburbs: e.length > 0 ? e : undefined,
                  });
                  const values = e.map((o) => o.value);
                  const labels = e.map((o) => o.label).join(",");
                  setJobFilter({
                    ...jobFilter,
                    suburbs: values,
                  });
                  setLocalFilterDisplayNames({
                    ...localFilterDisplayNames,
                    suburbs: {
                      ...localFilterDisplayNames.suburbs,
                      value: labels,
                    },
                  });
                }}
                formatCreateLabel={(userInput) => `${userInput}`}
              />
            </Box>
            {!isCompany && (
              <Box w={"full"}>
                <FormLabel>Company</FormLabel>
                <Select
                  components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                  }}
                  value={selectedFilters.has_company_ids}
                  isMulti={true}
                  options={companiesOptions}
                  name="has_company_ids"
                  onInputChange={(e) => {
                    onChangeSearchCompany(e);
                  }}
                  onChange={(e) => {
                    setSelectedFilters({
                      ...selectedFilters,
                      has_company_ids: e.length > 0 ? e : undefined,
                    });
                    const values = e.map((o) => o.value);
                    const labels = e.map((o) => o.label).join(",");
                    setJobFilter({
                      ...jobFilter,
                      has_company_ids: values,
                    });
                    setLocalFilterDisplayNames({
                      ...localFilterDisplayNames,
                      has_company_ids: {
                        ...localFilterDisplayNames.has_company_ids,
                        value: labels,
                      },
                    });
                  }}
                />
              </Box>
            )}

            {/* <Box w={"full"}>
              <FormLabel>Date</FormLabel>

              <Input
                type={"date"}
                placeholder=""
                name="job_date_at"
                value={selectedFilters.job_date_at}
                onChange={(e) => {
                  setSelectedFilters({
                    ...selectedFilters,
                    job_date_at: e.target.value,
                  });
                  setJobFilter({
                    ...jobFilter,
                    job_date_at: formatDateTimeToDB(e.target.value, "00:00"),
                  });
                  setLocalFilterDisplayNames({
                    ...localFilterDisplayNames,
                    job_date_at: {
                      ...localFilterDisplayNames.job_date_at,
                      value: e.target.value,
                    },
                  });
                }}
              />
            </Box> */}
            {/* <Box w={"full"}>
              <FormLabel>Status</FormLabel>
              <Select
                components={{
                  DropdownIndicator: () => null,
                  IndicatorSeparator: () => null,
                }}
                value={selectedFilters.job_status_id}
                isMulti={true}
                options={jobStatuses}
                name="job_status_id"
                onChange={(e) => {
                  setSelectedFilters({
                    ...selectedFilters,
                    job_status_id: e,
                  });
                  const values = e.map((o) => o.value);
                  const labels = e.map((o) => o.label).join(",");
                  setJobFilter({
                    ...jobFilter,
                    job_status_id: values,
                  });
                  setLocalFilterDisplayNames({
                    ...localFilterDisplayNames,
                    job_status_id: {
                      ...localFilterDisplayNames.job_status_id,
                      value: labels,
                    },
                  });
                }}
              />
            </Box> */}
            <Box w={"full"}>
              <Checkbox
                isChecked={selectedFilters.is_tailgate_required}
                onChange={(e) => {
                  setJobFilter({
                    ...jobFilter,
                    is_tailgate_required: e.target.checked,
                  });
                  setSelectedFilters({
                    ...selectedFilters,
                    is_tailgate_required: e.target.checked,
                  });
                  setLocalFilterDisplayNames({
                    ...localFilterDisplayNames,
                    is_tailgate_required: {
                      ...localFilterDisplayNames.is_tailgate_required,
                      value: e.target.checked && "Yes",
                    },
                  });
                }}
              >
                Tailgate jobs only
              </Checkbox>
            </Box>

            <FormLabel fontWeight={"500"}>Shipment Size</FormLabel>
            <VStack spacing={3}>
              <Flex>
                <Box w={"full"}>
                  <FormLabel fontWeight={"bold"}>From</FormLabel>
                  <CustomInputField
                    type="number"
                    showLabel={false}
                    placeholder="0.00"
                    name="weight_from"
                    defaultValue={selectedFilters.weight_from}
                    suffixText="kg"
                    onClick={handleInputHighlight}
                    onChange={(e) => {
                      setSelectedFilters({
                        ...selectedFilters,
                        weight_from: e.target.value,
                      });
                      setJobFilter({
                        ...jobFilter,
                        weight_from: parseInt(e.target.value),
                      });
                      setLocalFilterDisplayNames({
                        ...localFilterDisplayNames,
                        weight_from: {
                          ...localFilterDisplayNames.weight_from,
                          value: e.target.value,
                        },
                      });
                    }}
                    maxWidth="95%"
                    mb="0"
                  />
                </Box>
                <Box w={"full"}>
                  <FormLabel fontWeight={"bold"}>To</FormLabel>
                  <CustomInputField
                    type="number"
                    showLabel={false}
                    placeholder="0.00"
                    name="weight_to"
                    defaultValue={selectedFilters.weight_to}
                    suffixText="kg"
                    onClick={handleInputHighlight}
                    onChange={(e) => {
                      setSelectedFilters({
                        ...selectedFilters,
                        weight_to: e.target.value,
                      });
                      setJobFilter({
                        ...jobFilter,
                        weight_to: parseInt(e.target.value),
                      });
                      setLocalFilterDisplayNames({
                        ...localFilterDisplayNames,
                        weight_to: {
                          ...localFilterDisplayNames.weight_to,
                          value: e.target.value,
                        },
                      });
                    }}
                    maxWidth="95%"
                    mb="0"
                  />
                </Box>
              </Flex>
              <Flex>
                <Box w={"full"}>
                  <FormLabel fontWeight={"bold"}>From</FormLabel>
                  <CustomInputField
                    type="number"
                    showLabel={false}
                    placeholder="0.00"
                    name="volume_from"
                    defaultValue={selectedFilters.volume_from}
                    suffixText="cbm"
                    onClick={handleInputHighlight}
                    onChange={(e) => {
                      setSelectedFilters({
                        ...selectedFilters,
                        volume_from: e.target.value,
                      });
                      setJobFilter({
                        ...jobFilter,
                        volume_from: parseInt(e.target.value),
                      });
                      setLocalFilterDisplayNames({
                        ...localFilterDisplayNames,
                        volume_from: {
                          ...localFilterDisplayNames.volume_from,
                          value: e.target.value,
                        },
                      });
                    }}
                    maxWidth="95%"
                    mb="0"
                  />
                </Box>
                <Box w={"full"}>
                  <FormLabel fontWeight={"bold"}>To</FormLabel>
                  <CustomInputField
                    type="number"
                    showLabel={false}
                    placeholder="0.00"
                    name="volume_to"
                    defaultValue={selectedFilters.volume_to}
                    suffixText="cbm"
                    onClick={handleInputHighlight}
                    onChange={(e) => {
                      setSelectedFilters({
                        ...selectedFilters,
                        volume_to: e.target.value,
                      });
                      setJobFilter({
                        ...jobFilter,
                        volume_to: parseInt(e.target.value),
                      });
                      setLocalFilterDisplayNames({
                        ...localFilterDisplayNames,
                        volume_to: {
                          ...localFilterDisplayNames.volume_to,
                          value: e.target.value,
                        },
                      });
                    }}
                    maxWidth="95%"
                    mb="0"
                  />
                </Box>
              </Flex>
            </VStack>
            <Divider />
          </VStack>
        </ModalBody>
        <ModalFooter justifyContent={"center"}>
          <Box w={"full"}>
            <Flex justifyContent={"space-between"}>
              <Button
                variant="outline"
                onClick={() => handleResetAll()}
                className="mr-2"
              >
                Reset all
              </Button>
              <Button
                variant="primary"
                onClick={() => handleFilterApply()}
                className="ml-2"
              >
                Filter jobs
              </Button>
            </Flex>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
