import { Box, BoxProps } from "@chakra-ui/react";
import NextImage from "next/image";
import * as React from "react";

interface ImageProps extends BoxProps {
  src: string;
  alt: string;
  style?: any;
  w?: string;
  h?: string;
  borderRadius?: string;
  me?: string;
}

export const Image = (props: ImageProps) => {
  const { src, alt, ...rest } = props;
  return (
    <Box overflow={"hidden"} position="relative" {...rest}>
      <NextImage
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        style={{
          objectFit: "cover",
        }}
      />
    </Box>
  );
};
