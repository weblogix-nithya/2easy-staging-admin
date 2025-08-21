import {
  Box,
  Flex,
  FormLabel,
  GridItem,
  Input,
  InputGroup,
  // InputLeftAddon,
  InputRightAddon,
  SimpleGrid,
  SpaceProps,
  Text,
  Textarea,
  useColorModeValue,
} from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import { useState } from "react";
// Custom components

export default function Default(props: {
  id?: string;
  inputRef?: any;
  label?: string;
  extra?: string;
  placeholder?: string;
  // addonsStart?: React.ReactNode;
  addonsEnd?: React.ReactNode;
  type?: string;
  name?: string;
  showLabel?: boolean;
  value?: string | number | any;
  defaultValue?: string | number | any;
  maxWidth?: string;
  minWidth?: string;
  isDisabled?: boolean;
  isSelect?: boolean;
  isTextArea?: boolean;
  isInput?: boolean;
  inputStyles?: React.CSSProperties;
  optionsArray?: any[];
  onChange?: (field: any) => void;
  onInputChange?: (field: any) => void;
  onClick?: (field: any) => void;
  mb?: SpaceProps["mb"];
}) {
  const {
    id,
    inputRef,
    label = "",
    extra,
    placeholder = "",
    // addonsStart,
    addonsEnd,
    value,
    defaultValue,
    name,
    type,
    maxWidth,
    minWidth = "10%",
    showLabel = true,
    isDisabled,
    isSelect,
    isTextArea,
    mb,
    isInput = !isSelect && !isTextArea,
    inputStyles,
    optionsArray,
    onChange,
    onInputChange,
    onClick = (e) => {
      e.preventDefault();
    },
    ...rest
  } = props;

  // Chakra Color Mode
  const textColorPrimary = useColorModeValue("navy.700", "white");
   const textColorSecondary = useColorModeValue("#888888", "#888888");
  // RandomId
  const [_randomIdSection, _setRandomIdSection] = useState(
    (id ? id : name) + Math.random().toString(36).substring(7)
  );

  return (
    // TODO: Promote to each input type (select, input, textarea)
    <Flex alignItems="center" mb={mb ? mb : "16px"}>
      {showLabel && (
        <FormLabel
          display="flex"
          mb="0"
          width="200px"
          fontSize="sm"
          fontWeight="500"
          htmlFor={(id ? id : name) + _randomIdSection}
          color={textColorPrimary}
          _hover={{ cursor: "pointer" }}
        >
          <SimpleGrid columns={{ sm: 1 }}>
            <GridItem>{label}</GridItem>
            <GridItem>
              <Text
                fontSize="small"
                fontWeight="400"
                ms="2px"
                textColor={textColorSecondary}
              >
                {extra ? extra : ""}
              </Text>
            </GridItem>
          </SimpleGrid>
        </FormLabel>
      )}
      <Box width="100%">
        {isSelect && (
          <Box maxWidth={maxWidth ? maxWidth : "50%"} minWidth={minWidth}>
            <Select
              onInputChange={onInputChange}
              isDisabled={isDisabled}
              placeholder={placeholder}
              value={value}
              options={optionsArray}
              onChange={onChange}
              classNamePrefix="chakra-react-select"
            />
          </Box>
        )}
        {isInput && (
          <InputGroup
            size="lg"
            maxWidth={maxWidth ? maxWidth : "50%"}
            minWidth={minWidth}
            style={inputStyles}
          >
           {/* <InputLeftAddon>{addonsStart}</InputLeftAddon> */}
            <Input
              ref={inputRef}
              {...rest}
              isDisabled={isDisabled}
              type={type ? type : "text"}
              id={(id ? id : name) + _randomIdSection}
              variant="main"
              placeholder={placeholder}
              _placeholder={{ fontWeight: "400", color: "secondaryGray.600" }}
              isRequired={true}
              name={name}
              value={value}
              defaultValue={defaultValue}
              onChange={onChange}
              onClick={type === "date" ? undefined : onClick}
              ms={{ base: "0px", md: "0px" }}
              mb="0"
              fontSize="sm"
              fontWeight="500"
            />
            <InputRightAddon>{addonsEnd}</InputRightAddon>
          </InputGroup>
        )}
        {isTextArea && (
          <Textarea
            {...rest}
            isDisabled={isDisabled}
            id={(id ? id : name) + _randomIdSection}
            placeholder={placeholder}
            _placeholder={{ fontWeight: "400", color: "secondaryGray.600" }}
            isRequired={true}
            fontSize="sm"
            maxWidth={maxWidth ? maxWidth : "50%"}
            name={name}
            value={value ? value : ""}
            onChange={onChange}
            onClick={onClick}
            mb="0"
          />
        )}
      </Box>
    </Flex>
  );
}