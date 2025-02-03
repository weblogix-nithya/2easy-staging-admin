import { SearchIcon } from "@chakra-ui/icons";
import {
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
} from "@chakra-ui/react";

export function SearchBar(props: {
  variant?: string;
  background?: string;
  children?: JSX.Element;
  ms?: string;
  placeholder?: string;
  borderRadius?: string | number;
  [x: string]: any;
}) {
  // Pass the computed styles into the `__css` prop
  const {
    variant,
    background,
    children,
    ms,
    placeholder,
    borderRadius,
    searchQuery,
    onChangeSearchQuery,
    ...rest
  } = props;
  // Chakra Color Mode
  const searchIconColor = useColorModeValue("gray.700", "white");
  const inputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const inputText = useColorModeValue("gray.700", "gray.100");

  return (
    <InputGroup
      w={{ base: "100%", md: "200px" }}
      ms={ms ? ms : "auto"}
      border="1px"
      borderColor="gray.200"
      borderRadius="8px"
      {...rest}
    >
      <InputLeftElement>
        <IconButton
          aria-label="search"
          // bg="inherit"
          bg="transparent"
          borderRadius="inherit"
          _active={{
            // bg: "inherit",
            bg: "transparent",
            transform: "none",
            borderColor: "transparent",
          }}
          _focus={{
            boxShadow: "none",
          }}
          _hover={{
            bg: "transparent",
          }}
          icon={<SearchIcon color={searchIconColor} w="15px" h="15px" />}
        />
      </InputLeftElement>

      <Input
        variant="search"
        placeholder={placeholder ? placeholder : "Search..."}
        value={searchQuery}
        onChange={(e) => {
          onChangeSearchQuery(e.target.value);
        }}
        // bg={background ? background : inputBg}
        bg="white"
        fontWeight="500"
        fontSize="sm"
        color={inputText}
        _placeholder={{ color: "black.500", fontSize: "14px" }}
        borderRadius={borderRadius ? borderRadius : "30px"}
      />
    </InputGroup>
  );
}
