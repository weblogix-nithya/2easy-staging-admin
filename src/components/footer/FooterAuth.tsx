import {
  Flex,
  Link,
  List,
  ListItem,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

export default function Footer(props: { [x: string]: any }) {
  let textColor = useColorModeValue("gray.400", "white");
  let linkColor = useColorModeValue({ base: "gray.400", lg: "white" }, "white");
  return (
    <Flex
      zIndex="3"
      flexDirection={{
        base: "column",
        lg: "row",
      }}
      alignItems={{
        base: "center",
        xl: "start",
      }}
      justifyContent="space-between"
      px={{ base: "30px", md: "0px" }}
      pb="30px"
      {...props}
    >
      <Text
        color={textColor}
        textAlign={{
          base: "center",
          xl: "start",
        }}
        mb={{ base: "20px", lg: "0px" }}
      >
        {" "}
        &copy; {new Date().getFullYear()}
        <Text as="span" fontWeight="500" ms="4px">
          {process.env.NEXT_PUBLIC_APP_NAME}. All Rights Reserved. Made with
          love by
          <Link
            mx="3px"
            color={textColor}
            href={process.env.NEXT_PUBLIC_APP_URL}
            target="_blank"
            fontWeight="700"
          >
            {process.env.NEXT_PUBLIC_APP_NAME}!
          </Link>
        </Text>
      </Text>
      <List display="flex">
        <ListItem
          me={{
            base: "20px",
            md: "44px",
          }}
        >
          <Link
            fontWeight="500"
            color={linkColor}
            href={process.env.NEXT_PUBLIC_SUPPORT_URL}
            target="_blank"
          >
            Support
          </Link>
        </ListItem>
        <ListItem
          me={{
            base: "20px",
            md: "44px",
          }}
        >
          <Link
            fontWeight="500"
            color={linkColor}
            href={process.env.NEXT_PUBLIC_TNC_URL}
            target="_blank"
          >
            Terms of Use
          </Link>
        </ListItem>
        <ListItem
          me={{
            base: "20px",
            md: "44px",
          }}
        >
          <Link
            fontWeight="500"
            color={linkColor}
            href={process.env.NEXT_PUBLIC_PRIVACY_URL}
            target="_blank"
          >
            Privacy
          </Link>
        </ListItem>
        <ListItem>
          <Link
            fontWeight="500"
            color={linkColor}
            href={process.env.NEXT_PUBLIC_BLOG_URL}
            target="_blank"
          >
            Blog
          </Link>
        </ListItem>
      </List>
    </Flex>
  );
}
