// Chakra imports
import { Box, Flex, Link, Text } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function DashboardInfoCardRow(props: {
  title?: string;
  description?: string;
  descriptionBgColor?: string;
  link?: string;
  data?: any[];
  path?: string;
}) {
  const { title, description, descriptionBgColor, link, data, path } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Flex
        className="py-4 px-2 rounded-lg transition hover:bg-[#DEE7F5] cursor-pointer"
        alignItems="center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="!font-bold text-sm">{title}</p>
        <Box
          className="py-1 px-2 ml-auto mr-4 rounded-lg"
          sx={{
            backgroundColor: descriptionBgColor,
          }}
        >
          <p className="!font-bold text-sm text-white">{description}</p>
        </Box>
        <FontAwesomeIcon
          icon={isOpen ? "chevron-down" : "chevron-right"}
          color="#bebebe"
        />
      </Flex>
      {isOpen && data != undefined && data.length != 0 && (
        <>
          {data.map((row: any, index) => {
            return (
              <Text key={row.id}>
                <Link href={`${path}/${row.id}`} className="px-3">
                  {row.name || row.full_name}
                </Link>
              </Text>
            );
          })}
        </>
      )}
    </>
  );
}
