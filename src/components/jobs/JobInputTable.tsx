import {
  Button,
  Flex,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { faTrashAlt } from "@fortawesome/pro-light-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CustomInputField from "components/fields/CustomInputField";
import { JobItem } from "graphql/jobItem";
import React from "react";
import { PluginHook, usePagination, useTable } from "react-table";

type PaginationTableProps<T extends JobItem> = {
  columns: any[];
  optionsSelect?: any[];
  data: T[];
  plugins?: PluginHook<T>[];
  onRemoveClick?: (id: number) => void;
  onValueChanged?: (value: any, index: number, fieldToUpdate?: string) => void;
};

const JobInputTable = <T extends object>({
  columns,
  data,
  onRemoveClick,
  onValueChanged,
  optionsSelect = [],
  plugins = [],
}: PaginationTableProps<JobItem>) => {
  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, page } =
    useTable<JobItem>(
      { ...optionsSelect, columns, data },
      usePagination,
      ...plugins,
    );

  function handleInputHighlight(
    event: React.MouseEvent<HTMLInputElement, MouseEvent>,
  ): void {
    // User request to highlight input field on click
    event.currentTarget.select();
  }

  const calculateCBM = (row: any): number => {
    const qty = parseFloat(row.quantity) || 0;
    const length = parseFloat(row.dimension_height) || 0;
    const width = parseFloat(row.dimension_width) || 0;
    const height = parseFloat(row.dimension_depth) || 0;

    const widthThreshold = 1.20;
    const lengthThreshold = 1.20;
    const heightThreshold = 1.50;
    const palletHeight = 1.20;
    const palletValue = widthThreshold * lengthThreshold * palletHeight; // 1.728

    let palletStatus = "";
    if (width > widthThreshold || length > lengthThreshold) {
        palletStatus = "oversized";
    } else if (height > heightThreshold) {
        palletStatus = "overheight";
    }

    let lengthMultiplier = 0;
    if (length >= 0.01 && length <= 1.20) lengthMultiplier = 1;
    else if (length >= 1.21 && length <= 2.40) lengthMultiplier = 2;
    else if (length >= 2.41 && length <= 3.60) lengthMultiplier = 3;
    else if (length >= 3.61 && length <= 4.80) lengthMultiplier = 4;
    else if (length >= 4.81 && length <= 6.00) lengthMultiplier = 5;
    else if (length >= 6.01 && length <= 7.20) lengthMultiplier = 6;
    else if (length >= 7.21 && length <= 9.00) lengthMultiplier = 7;

    const widthMultiplier = 2;
    const heightMultiplier = 1.5;

    let cbmWithMultiplier = 0;
    if (length < lengthThreshold && width < widthThreshold && height < heightThreshold) {
        // No thresholds breached
        cbmWithMultiplier = length * width * height;
    } else if (lengthMultiplier > 0 && width <= widthThreshold && height <= heightThreshold) {
        // Length only
        cbmWithMultiplier = palletValue * lengthMultiplier;
    } else if (length <= lengthThreshold && width > widthThreshold && height <= heightThreshold) {
        // Width only
        cbmWithMultiplier = palletValue * widthMultiplier;
    } else if (length > lengthThreshold && width > widthThreshold && height <= heightThreshold) {
        // Width and length
        cbmWithMultiplier = palletValue * (widthMultiplier * lengthMultiplier);
    } else if (length <= lengthThreshold && width <= widthThreshold && height > heightThreshold) {
        // Height only
        cbmWithMultiplier = palletValue * heightMultiplier;
    } else if (length > lengthThreshold && width > widthThreshold && height > heightThreshold) {
        // Height + width + length
        cbmWithMultiplier = palletValue * (widthMultiplier * lengthMultiplier) * heightMultiplier;
    } else if (length > lengthThreshold && width <= widthThreshold && height > heightThreshold) {
        // Height + length
        cbmWithMultiplier = palletValue * lengthMultiplier * heightMultiplier;
    } else if (length <= lengthThreshold && width > widthThreshold && height > heightThreshold) {
        // Height + width
        cbmWithMultiplier = palletValue * (widthMultiplier * lengthMultiplier) * heightMultiplier;
    }

    return parseFloat((cbmWithMultiplier * qty).toFixed(3));
  };

  return (
    <VStack w="full" align="start" spacing={4}>
      <Table colorScheme="white" {...getTableProps()}>
        <Thead>
          {headerGroups.map((headerGroup, index) => (
            <Tr {...headerGroup.getHeaderGroupProps()} key={`header-row-${index}`}>
              {headerGroup.headers.map((column) => (
                <Th {...column.getHeaderProps()} key={`row-header-${column.id}`} className="first:pl-0">
                  {column.render("Header")}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>

        <Tbody {...getTableBodyProps()}>
          {data.map((row, index) => {
            return (
              <Tr key={index + row.id}>
                {/* Item Type */}
                <Td padding={"0px"}>
                  <CustomInputField
                    isSelect={true}
                    optionsArray={optionsSelect}
                    showLabel={false}
                    value={optionsSelect.find((_entity) => _entity.value === row.item_type_id)}
                    placeholder=""
                    onChange={(e) => {
                      onValueChanged(
                        { ...row, item_type_id: e.value || null },
                        index
                      );
                    }}
                    mb="0"
                    maxWidth="100%"
                    minWidth="200px"
                  />
                </Td>

                <Td>
                  <Flex align="center">
                    <CustomInputField
                      // inputRef={heightRef}
                      type="number"
                      showLabel={false}
                      placeholder="0.00"
                      name="dimension_height"
                      defaultValue={
                        row.dimension_height_cm
                          ? row.dimension_height_cm
                          : (row.dimension_height * 100).toFixed(2)
                      }
                      suffixText="cm"
                      onClick={handleInputHighlight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updatedRow = {
                          ...row,
                          [e.target.name]: val / 100 || 0,
                          [e.target.name + "_cm"]: val || 0,
                        };
                        updatedRow.volume = calculateCBM(updatedRow);
                        onValueChanged(updatedRow, index, e.target.name + "_cm");
                      }}
                      maxWidth="95%"
                      mb="0"
                      inputStyles={
                        row.dimension_height_cm == 0.0 ||
                        (row.dimension_height * 100).toFixed(2) == "0.00"
                          ? { color: "var(--chakra-colors-secondaryGray-600)" }
                          : null
                      }
                    />

                    <CustomInputField
                      type="number"
                      // inputRef={widthRef}
                      showLabel={false}
                      placeholder="0.00"
                      name="dimension_width"
                      defaultValue={
                        row.dimension_width_cm
                          ? row.dimension_width_cm
                          : (row.dimension_width * 100).toFixed(2)
                      }
                      suffixText="cm"
                      onClick={handleInputHighlight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updatedRow = {
                          ...row,
                          [e.target.name]: val / 100 || 0,
                          [e.target.name + "_cm"]: val || 0,
                        };
                        updatedRow.volume = calculateCBM(updatedRow);
                        onValueChanged(updatedRow, index, e.target.name + "_cm");
                      }}
                      maxWidth="95%"
                      mb="0"
                      inputStyles={
                        row.dimension_width_cm == 0.0 ||
                        (row.dimension_width * 100).toFixed(2) == "0.00"
                          ? { color: "var(--chakra-colors-secondaryGray-600)" }
                          : null
                      }
                    />

                    <CustomInputField
                      type="number"
                      // inputRef={depthRef}
                      showLabel={false}
                      placeholder="0.00"
                      name="dimension_depth"
                      defaultValue={
                        row.dimension_depth_cm
                          ? row.dimension_depth_cm
                          : (row.dimension_depth * 100).toFixed(2)
                      }
                      suffixText="cm"
                      onClick={handleInputHighlight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updatedRow = {
                          ...row,
                          [e.target.name]: val / 100 || 0,
                          [e.target.name + "_cm"]: val || 0,
                        };
                        updatedRow.volume = calculateCBM(updatedRow);
                        onValueChanged(updatedRow, index, e.target.name + "_cm");
                      }}
                      maxWidth="95%"
                      mb="0"
                      inputStyles={
                        row.dimension_depth_cm == 0.0 ||
                        (row.dimension_depth * 100).toFixed(2) == "0.00"
                          ? { color: "var(--chakra-colors-secondaryGray-600)" }
                          : null
                      }
                    />
                  </Flex>
                </Td>

                <Td>
                  <CustomInputField
                    showLabel={false}
                    placeholder=""
                    maxWidth="100%"
                    name="quantity"
                    value={row.quantity}
                    onChange={(e) => {
                      const updatedRow = {
                        ...row,
                        [e.target.name]: parseFloat(e.target.value) || 0,
                      };
                      updatedRow.volume = calculateCBM(updatedRow);
                      onValueChanged(updatedRow, index, e.target.name);
                    }}
                    mb="0"
                  />
                </Td>

                {/* Weight */}
                <Td>
                  <CustomInputField
                    showLabel={false}
                    placeholder=""
                    maxWidth="100%"
                    name="weight"
                    value={row.weight}
                    suffixText="kg"
                    type="number"
                    // onChange={(e) => {
                    //   onValueChanged(
                    //     {
                    //       ...row,
                    //       [e.target.name]: parseFloat(e.target.value) || null,
                    //     },
                    //     index,
                    //   );
                    // }}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value) || null;
                      onValueChanged(
                        {
                          ...row,
                          [e.target.name]: newValue,
                        },
                        index,
                      );
                    }}
                    mb="0"
                  />
                </Td>

                <Td>
                <CustomInputField
                  type="number"
                  showLabel={false}
                    placeholder="0.00"
                  maxWidth="100%"
                  name="volume"
                    value={row.volume}
                  suffixText="cbm"
                  onChange={(e) => {
                      onValueChanged(
                        {
                      ...row,
                      [e.target.name]: parseFloat(e.target.value) || null,
                      [e.target.name + "_cm"]:
                        parseFloat(e.target.value) * 1000000 || null,
                        },
                        index,
                      );
                  }}
                  mb="0"
                />
              </Td>

                <Td>
                  {/* Hide button if this is the ONLY index of the loop */}
                  {index === 0 && data.length === 1 ? null : (
                    <Button
                      bg="white"
                      fontSize="sm"
                      className="!text-[var(--chakra-colors-black-400)]"
                      onClick={() => {
                        onRemoveClick(index);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faTrashAlt}
                        className="!text-[var(--chakra-colors-black-400)]"
                        size="lg"
                      />
                    </Button>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </VStack>
  );
};

export default JobInputTable;
