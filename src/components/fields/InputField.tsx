// Chakra imports
import {
  Flex,
  FormLabel,
  Input,
  SpaceProps,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
// Custom components

export default function Default(props: {
  id: string;
  label: string;
  extra: JSX.Element;
  placeholder: string;
  type: string;
  mb: SpaceProps["mb"];
}) {
  const { id, label, extra, placeholder, type, mb, ...rest } = props;
  // Chakra Color Mode
  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");

  return (
    <Flex flexDirection="column" mb={mb ? mb : "30px"}>
      <FormLabel
        display="flex"
        ms="10px"
        htmlFor={id}
        fontSize="sm"
        color={textColorPrimary}
        fontWeight="bold"
        _hover={{ cursor: "pointer" }}
      >
        {label}
        <Text fontSize="sm" fontWeight="400" ms="2px">
          {extra}
        </Text>
      </FormLabel>
      <Input
        {...rest}
        type={type}
        id={id}
        fontWeight="500"
        variant="main"
        placeholder={placeholder}
        _placeholder={{ fontWeight: "400", color: "secondaryGray.600" }}
        h="44px"
        maxH="44px"
      />
    </Flex>
  );
}
