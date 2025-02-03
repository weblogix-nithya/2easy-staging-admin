// Chakra imports
import { useMutation } from "@apollo/client";
import { Flex, Link, useColorModeValue, useToast } from "@chakra-ui/react";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { ADD_MEDIA_MUTATION } from "graphql/media";
import { useCallback, useState } from "react";
// Assets
import { useDropzone } from "react-dropzone";

function FileInputLink(props: {
  [x: string]: any;
  entity: string;
  entityId: number;
  collection_name?: string;
  description?: string;
  media_url?: string;
  onUpload?: (downloadable_url: string) => void;
  accept?: string;
}) {
  const {
    entity,
    entityId,
    collection_name,
    description,
    media_url,
    onUpload,
    ...rest
  } = props;
  const brandColor = useColorModeValue("brand.500", "white");
  const toast = useToast();
  const [media, setMedia] = useState({ raw: null, preview: null });
  const [isMedia, setIsMedia] = useState(media_url ? true : false);

  const [handleCreateMedia, {}] = useMutation(ADD_MEDIA_MUTATION, {
    variables: {
      input: {
        entity: entity,
        entity_id: entityId,
        collection_name: collection_name,
      },
      media: media,
    },
    onCompleted: (data) => {
      toast({
        title: "User updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onUpload(data.createMedia.downloadable_url);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  function isImgUrl(url: string) {
    return /\.(jpg|jpeg|png|webp|avif|gif)$/.test(url);
  }

  const onDrop = useCallback(
    (acceptedFiles: any) => {
      acceptedFiles.forEach((file: any) => {
        const reader = new FileReader();
        reader.onabort = () => console.log("file reading was aborted");
        reader.onerror = () => console.log("file reading has failed");
        reader.onload = () => {
          setMedia(file);
          // Added this because the setMedia is too slow. needs a minor delay before running handleCreateMedia.
          setTimeout(() => {
            handleCreateMedia();
          }, 500);
        };
        reader.readAsArrayBuffer(file);
      });
    },
    [handleCreateMedia],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: props.accept,
  });
  const bg = useColorModeValue("gray.100", "navy.700");
  const borderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");

  return (
    <Flex
      align="center"
      justify="center"
      w="100%"
      minH="100%"
      cursor="pointer"
      {...getRootProps({ className: "dropzone text-blue-600" })}
      {...rest}
    >
      <input {...getInputProps()} />
      <Link href="#" variant="no-effects">
        Upload
      </Link>
    </Flex>
  );
}

export default FileInputLink;
