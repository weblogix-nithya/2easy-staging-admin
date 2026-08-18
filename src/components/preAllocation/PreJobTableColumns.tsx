import { CloseIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  IconButton,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import {
  faHandHolding,
  faInfinity,
  faPager,
  faTruckRampBox,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RemoveDriverContext } from "components/preAllocation/RemoveDriverContext";
import { DynamicTableUser } from "graphql/dynamicTableUser";
import {
  formatAddress,
  formatDate,
  formatTime,
  outputDynamicTable,
} from "helpers/helper";
import Image from "next/image";
import EditableFieldPopover from "pages/admin/jobs/job-components/EditableFieldPopover";
import React, { useCallback, useContext, useState } from "react";
import { MdMenu } from "react-icons/md";
import { RootState } from "store/store";

type JobLabel = {
  id: number;
  type: "label";
  name: string;
  color?: string;
};

export const isAdmin = (state: RootState) => state.user.isAdmin;
export const isCustomer = (state: RootState) => state.user.isCustomer;

// ─────────────────────────────────────────────
// CELL COMPONENTS — all wrapped with React.memo
// ─────────────────────────────────────────────

export const PickupAddressBusinessNameCell = React.memo(({ row }: any) => (
  <>
    <Text fontSize="md">
      {row.original?.job?.pick_up_destination?.address_business_name || "-"}
    </Text>
    <Text fontSize="md" mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
      {formatAddress(row?.original?.job?.pick_up_destinations)}
    </Text>
  </>
));
PickupAddressBusinessNameCell.displayName = "PickupAddressBusinessNameCell";

export const JobDestinationsCell = React.memo(({ row }: any) => {
  const destinations = row?.original?.job?.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );
  const first = filteredDestinations[0];

  const renderAddress = (destination: any) => (
    <>
      {destination.address_city}
      {"\n"}
      {destination.address_postal_code}, {destination.address_state}
    </>
  );

  return (
    <>
      {first ? (
        <Text whiteSpace="pre-line" fontSize="md" minWidth={"170px"}>
          {renderAddress(first)}
        </Text>
      ) : (
        <Text>-</Text>
      )}
      {filteredDestinations.length > 1 && (
        <Popover placement="bottom" closeOnBlur={false}>
          <PopoverTrigger>
            <Text color="primary.400" cursor="pointer">
              <strong>View All</strong>
            </Text>
          </PopoverTrigger>
          <PopoverContent color="black" bg="black.100" borderColor="black.100">
            <PopoverHeader color="black" pt={4} fontWeight="bold" border="0">
              Delivery addresses:
            </PopoverHeader>
            <PopoverArrow bg="black.100" />
            <PopoverCloseButton />
            <PopoverBody>
              {filteredDestinations.map((destination: any, index: number) => (
                <Text
                  color="black"
                  mb="5"
                  key={`dest-${index}`}
                  whiteSpace="pre-line"
                >
                  Address {index + 1}: {renderAddress(destination)}
                </Text>
              ))}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
});
JobDestinationsCell.displayName = "JobDestinationsCell";

export const JobDestinationsCellExport = ({ row }: any) => {
  const filteredDestinations = row?.original?.job?.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );
  return formatAddress(filteredDestinations[0]);
};

export const JobDestinationBusinessNameCell = React.memo(({ row }: any) => {
  const destinations = row?.original?.job?.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );
  const businessName = filteredDestinations[0]?.address_business_name || "-";
  return (
    <Text fontSize="md" textTransform="capitalize" minW="130px" maxW="170px">
      {businessName?.toLowerCase()}
    </Text>
  );
});
JobDestinationBusinessNameCell.displayName = "JobDestinationBusinessNameCell";

export const JobDestinationBusinessNameCellExport = ({ row }: any) => {
  const filteredDestinations = row?.original?.job?.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );
  return filteredDestinations[0]?.address_business_name || "-";
};

export const JobDestinationWithBusinessNameCell = React.memo(({ row }: any) => {
  const destinations = row?.original?.job?.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );
  const showDeliveryTime =
    row?.original?.job?.job_status?.id == 6 ||
    row?.original?.job?.job_status?.id == 7;
  const normalMedia =
    filteredDestinations[0]?.media?.filter(
      (item: any) => item.collection_name !== "signatures",
    ) || [];

  return (
    <>
      {filteredDestinations[0]?.updated_at && showDeliveryTime && (
        <>
          <Text fontSize="md" color="blue.600" mb={1}>
            Arrival time:{" "}
            {formatDate(filteredDestinations[0].arrived_at, "HH:mm, DD/MM/YYYY")}
          </Text>
          <Text fontSize="md" color="red.600" mb={1}>
            Delivery time:{" "}
            {formatDate(filteredDestinations[0].updated_at, "HH:mm, DD/MM/YYYY")}
          </Text>
        </>
      )}
      <Text isTruncated w={"fit-content"}>
        {filteredDestinations.length > 0
          ? `${filteredDestinations[0].address_line_1}, ${filteredDestinations[0].address_city}, ${filteredDestinations[0].address_postal_code}`
          : "-"}
      </Text>
      <Text>{filteredDestinations[0]?.address_business_name || "-"}</Text>
      {normalMedia.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {normalMedia.map((media: any, index: number) => (
            <Link key={`${index + 1}`} href={media.downloadable_url} isExternal>
              <Image
                src={media.downloadable_url}
                alt={media.name || "Delivery evidence"}
                width={50}
                height={50}
                style={{ objectFit: "cover", borderRadius: "4px", width: "50px", height: "50px" }}
              />
            </Link>
          ))}
        </Flex>
      )}
    </>
  );
});
JobDestinationWithBusinessNameCell.displayName = "JobDestinationWithBusinessNameCell";

export const JobDestinationWithBusinessNameCellExport = ({ row }: any) => {
  const filteredDestinations = row?.original?.job?.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );
  const formattedAddress = formatAddress(filteredDestinations[0]);
  const businessName = filteredDestinations[0]?.address_business_name || "-";
  return `${formattedAddress}\n${businessName}`;
};

export const PickupAddressWithTimebulkCell = React.memo(({ row }: any) => {
  const pickupDest = row?.original?.job?.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  return (
    <Text mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
      {`${pickupDest?.address_line_1}, ${pickupDest?.address_city}, ${pickupDest?.address_postal_code}\n ${pickupDest?.address_business_name || "-"}`}
    </Text>
  );
});
PickupAddressWithTimebulkCell.displayName = "PickupAddressWithTimebulkCell";

export const deliveryAddressWithTimebulkCell = React.memo(({ row }: any) => {
  const pickupDest = row?.original?.job?.job_destinations?.find(
    (dest: any) => dest.is_pickup === false,
  );
  return (
    <Text mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
      {`${pickupDest?.address_line_1}, ${pickupDest?.address_city}, ${pickupDest?.address_postal_code}\n ${pickupDest?.address_business_name || "-"}`}
    </Text>
  );
});
deliveryAddressWithTimebulkCell.displayName = "deliveryAddressWithTimebulkCell";

export const PickupAddressWithTimeCell = React.memo(({ row }: any) => {
  const pickupDest = row?.original?.job?.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  const showPickupTime =
    row?.original?.job?.job_status?.id == 4 ||
    row?.original?.job?.job_status?.id == 5 ||
    row?.original?.job?.job_status?.id == 6 ||
    row?.original?.job?.job_status?.id == 7;
  const normalMedia =
    pickupDest?.media?.filter(
      (item: any) => item.collection_name !== "signatures",
    ) || [];
  return (
    <>
      {pickupDest?.pickup_at && showPickupTime && (
        <>
          <Text fontSize="md" color="blue.600" mb={1}>
            Arrival time: {formatDate(pickupDest.arrived_at, "HH:mm, DD/MM/YYYY")}
          </Text>
          <Text fontSize="md" color="red.600" mb={1}>
            Collection time: {formatDate(pickupDest.pickup_at, "HH:mm, DD/MM/YYYY")}
          </Text>
        </>
      )}
      <Text>{pickupDest?.address_business_name || "-"}</Text>
      <Text mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
        {`${pickupDest?.address_line_1}, ${pickupDest?.address_city}, ${pickupDest?.address_postal_code}`}
      </Text>
      {normalMedia.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {normalMedia.map((media: any, index: number) => (
            <Link key={index} href={media.downloadable_url} isExternal>
              <Image
                src={media.downloadable_url}
                alt={media.name || "Pickup evidence"}
                width={50}
                height={50}
                style={{ objectFit: "cover", borderRadius: "4px", width: "50px", height: "50px" }}
              />
            </Link>
          ))}
        </Flex>
      )}
    </>
  );
});
PickupAddressWithTimeCell.displayName = "PickupAddressWithTimeCell";

export const PickupAddressWithTimeCellExport = ({ row }: any) => {
  const pickupDest = row?.original?.job?.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  const collectionTime = pickupDest?.pickup_at
    ? `Collection time: ${formatDate(pickupDest.pickup_at, "HH:mm, DD/MM/YYYY")}\n`
    : "";
  return `${collectionTime}${formatAddress(row?.original?.job?.pick_up_destination)}\n${row?.original?.job?.pick_up_destination?.address_business_name || "-"}`;
};

export const PickupAddressWithTimewithoutMediaCell = React.memo(({ row }: any) => {
  const pickupDest = row?.original?.job?.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  const showPickupTime =
    row?.original?.job?.job_status?.id == 4 ||
    row?.original?.job?.job_status?.id == 5 ||
    row?.original?.job?.job_status?.id == 6 ||
    row?.original?.job?.job_status?.id == 7;
  return (
    <>
      {pickupDest?.pickup_at && showPickupTime && (
        <>
          <Text fontSize="md" color="blue.600" mb={1}>
            Arrival time: {formatDate(pickupDest.arrived_at, "HH:mm, DD/MM/YYYY")}
          </Text>
          <Text fontSize="md" color="red.600" mb={1}>
            Collection time: {formatDate(pickupDest.pickup_at, "HH:mm, DD/MM/YYYY")}
          </Text>
        </>
      )}
      <Text fontSize="md">{pickupDest?.address_business_name || "-"}</Text>
      <Text mb="2" fontSize="md" minWidth={"300px"} flexWrap={"nowrap"}>
        {`${pickupDest?.address_line_1}, ${pickupDest?.address_city}, ${pickupDest?.address_postal_code}`}
      </Text>
    </>
  );
});
PickupAddressWithTimewithoutMediaCell.displayName = "PickupAddressWithTimewithoutMediaCell";

export const JobDestinationWithBusinessNamewithoutMediaCell = React.memo(({ row }: any) => {
  const destinations = row?.original?.job?.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );
  const showDeliveryTime =
    row?.original?.job?.job_status?.id == 6 ||
    row?.original?.job?.job_status?.id == 7;
  return (
    <>
      {filteredDestinations[0]?.updated_at && showDeliveryTime && (
        <>
          <Text fontSize="md" color="blue.600" mb={1}>
            Arrival time:{" "}
            {formatDate(filteredDestinations[0].arrived_at, "HH:mm, DD/MM/YYYY")}
          </Text>
          <Text fontSize="md" color="red.600" mb={1}>
            Delivery time:{" "}
            {formatDate(filteredDestinations[0].updated_at, "HH:mm, DD/MM/YYYY")}
          </Text>
        </>
      )}
      <Text fontSize="md">{filteredDestinations[0]?.address_business_name || "-"}</Text>
      <Text fontSize="md" isTruncated w={"fit-content"}>
        {filteredDestinations.length > 0
          ? `${filteredDestinations[0].address_line_1}, ${filteredDestinations[0].address_city}, ${filteredDestinations[0].address_postal_code}`
          : "-"}
      </Text>
    </>
  );
});
JobDestinationWithBusinessNamewithoutMediaCell.displayName = "JobDestinationWithBusinessNamewithoutMediaCell";

export const ReadyDropByCell = React.memo(({ row }: any) => (
  <>
    <Text fontSize="md" isTruncated w={"fit-content"}>
      {row?.original?.job?.job_category?.name ?? "-"}
    </Text>
    <Text isTruncated fontSize="md" w={"fit-content"}>
      R: {formatTime(row?.original?.job?.ready_at)}
    </Text>
    <Text isTruncated fontSize="md" w={"fit-content"}>
      D: {formatTime(row?.original?.job?.drop_at)}
    </Text>
  </>
));
ReadyDropByCell.displayName = "ReadyDropByCell";

export const ReadyDropByCellExport = ({ row }: any) =>
  `${row?.original?.job?.job_category?.name ?? "-"}\n
    R: ${formatTime(row?.original?.job?.ready_at)}\n
    D: ${formatTime(row?.original?.job?.drop_at)}`;

export const NotesCell = React.memo(({ row }: any) => {
  const current = row?.original?.job?.customer_notes ?? "";
  const [display, setDisplay] = React.useState(current);

  React.useEffect(() => {
    setDisplay(current);
  }, [current]);

  // FIX: useCallback — every render-ல் new function உருவாகாது
  const handleSaved = useCallback((val: string) => setDisplay(val), []);

  return (
    <Flex gap={2} align="center">
      <Text fontSize="md" maxW="200px" noOfLines={3}>
        {display || "-"}
      </Text>
      <EditableFieldPopover
        row={row}
        field="customer_notes"
        triggerAriaLabel="Edit customer notes"
        onSaved={handleSaved}
      />
    </Flex>
  );
});
NotesCell.displayName = "NotesCell";

export const ItemsTypeCell = React.memo(({ row }: any) => {
  const items = row?.original?.job?.job_items;
  return (
    <div>
      {items?.map((item: any) => (
        <Text fontSize="md" key={`items-type-${item?.id}`} mb={2}>
          {item.item_type.name}
        </Text>
      ))}
    </div>
  );
});
ItemsTypeCell.displayName = "ItemsTypeCell";

export const ItemsTypeCellExport = ({ row }: any) => {
  const items = row?.original?.job?.job_items;
  return items?.map((item: any) => [`${item.item_type.name}  \n`]);
};

export const ItemsDimensionCell = React.memo(({ row }: any) => {
  const items = row?.original?.job?.job_items || [];
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? items : items.slice(0, 2);

  // FIX: useCallback
  const toggleShow = useCallback(() => setShowAll((s) => !s), []);

  return (
    <VStack align="stretch" spacing={1} w="100%">
      {visibleItems.map((item: any) => (
        <Grid
          key={`items-dimension-${item?.id}`}
          templateColumns="120px 50px 40px 80px 80px"
          columnGap={4}
          fontSize="md"
        >
          <Text>
            {(item.dimension_height * 100).toFixed(0)}x
            {(item.dimension_width * 100).toFixed(0)}x
            {(item.dimension_depth * 100).toFixed(0)}
          </Text>
          <Text>{item?.item_type?.name}</Text>
          <Text textAlign="right">{item.quantity}</Text>
          <Text textAlign="right">{item.weight}kg</Text>
          <Text textAlign="right">{item.volume?.toFixed(2)}cbm</Text>
        </Grid>
      ))}
      {items.length > 2 && (
        <Button
          size="xs"
          variant="link"
          colorScheme="blue"
          onClick={toggleShow}
          alignSelf="flex-start"
        >
          {showAll ? "Less" : `+${items.length - 2} More`}
        </Button>
      )}
    </VStack>
  );
});
ItemsDimensionCell.displayName = "ItemsDimensionCell";

export const BulkItemsDimensionCell = React.memo(({ row }: any) => {
  const items = row?.original?.job?.job_items ?? [];
  if (items.length === 0) return <Text fontSize="xs">-</Text>;

  const first = items[0];
  const firstLabel = `${first.dimension_width}x${first.dimension_height}x${first.dimension_depth}`;
  const remaining = items.length - 1;

  return (
    <Box
      style={{
        height: "20px",        // ✅ fixed height — every row's Dimensions cell is identical
        overflow: "hidden",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <Text fontSize="xs">{firstLabel}</Text>
      {remaining > 0 && (
        <Popover trigger="hover" placement="top">
          <PopoverTrigger>
            <Text fontSize="xs" color="blue.500" cursor="pointer">
              +{remaining} More
            </Text>
          </PopoverTrigger>
          <PopoverContent w="auto" p={2}>
            <PopoverBody>
              {items.slice(1).map((item: any, i: number) => (
                <Text key={i} fontSize="xs">
                  {item.dimension_width}x{item.dimension_height}x{item.dimension_depth}
                </Text>
              ))}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </Box>
  );
});
BulkItemsDimensionCell.displayName = "BulkItemsDimensionCell";

export const ItemsDimensionCellExport = ({ row }: any) => {
  const items = row?.original?.job?.job_items;
  return items?.map((item: any) => [
    `${(item.quantity * 100)?.toFixed(2)}x `,
    `${(item.weight * 100)?.toFixed(2)}cm x `,
    `${(item.dimension_height * 100)?.toFixed(2)}cm x `,
    `${(item.dimension_width * 100)?.toFixed(2)}cm x `,
    `${(item.dimension_depth * 100)?.toFixed(2)}cm  \n`,
  ]);
};

export const ItemsQuantityCell = React.memo(({ row }: any) => {
  const items = row?.original?.job?.job_items;
  return (
    <div>
      {items?.map((item: any) => (
        <Text key={`items-quantity-${item?.id}`} mb={2}>
          {item?.quantity}
        </Text>
      ))}
    </div>
  );
});
ItemsQuantityCell.displayName = "ItemsQuantityCell";

export const ItemsQuantityCellExport = ({ row }: any) => {
  const items = row?.original?.job?.job_items;
  return items?.map((item: any) => [`${item?.quantity}  \n`]);
};

export const ItemsWeightCell = React.memo(({ row }: any) => {
  const items = row?.original?.job?.job_items;
  return (
    <div>
      {items?.map((item: any) => (
        <Text key={`items-weight-${item?.id}`} mb={2}>
          {item?.weight}kg
        </Text>
      ))}
    </div>
  );
});
ItemsWeightCell.displayName = "ItemsWeightCell";

export const ItemsWeightCellExport = ({ row }: any) => {
  const items = row?.original?.job?.job_items;
  return items?.map((item: any) => [`${item?.weight}kg  \n`]);
};

export const ItemsCbmCell = React.memo(({ row }: any) => {
  const items = row?.original?.job?.job_items;
  return (
    <div>
      {items?.map((item: any) => (
        <Text key={`items-cbm-${item?.id}`} mb={2}>
          {item.volume?.toFixed(2)}cbm
        </Text>
      ))}
    </div>
  );
});
ItemsCbmCell.displayName = "ItemsCbmCell";

export const ItemsExtrasCell = React.memo(({ row }: any) => (
  <Text
    minW="140px"
    fontSize="26px"
    whiteSpace="nowrap"
    fontWeight="800"
    letterSpacing="1.5px"
    textAlign="center"
    color="white"
    textShadow="2px 2px 0 rgba(0,0,0,0.95), 4px 4px 6px rgba(0,0,0,0.65)"
  >
    {row?.original?.job?.extras || "-"}
  </Text>
));
ItemsExtrasCell.displayName = "ItemsExtrasCell";

export const DriverCell = React.memo(({ row }: any) => (
  <Text fontSize="md">{row?.original?.job?.driver?.full_name || "-"}</Text>
));
DriverCell.displayName = "DriverCell";

export const ItemsCbmCellExport = ({ row }: any) => {
  const items = row?.original?.job?.job_items;
  return items?.map((item: any) => [`${item.volume?.toFixed(2)}cbm  \n`]);
};

export const BookedByCell = React.memo(({ row }: any) => {
  const name = row?.original?.job?.company?.name || "-";
  return (
    <Text fontSize="md" maxW="150px" minW="100px">
      {name}
    </Text>
  );
});
BookedByCell.displayName = "BookedByCell";

export const JobTypeCell = React.memo<{
  row: { original: { job: { job_type?: { name: string } } } };
}>(({ row }) => {
  const type = row.original.job?.job_type?.name || "-";

  const getTypeColors = (type: string) => {
    switch (type.toLowerCase()) {
      case "standard": return { color: "white", bg: "purple.500" };
      case "urgent": return { color: "white", bg: "red.500" };
      case "express": return { color: "white", bg: "orange.500" };
      default: return { color: "black", bg: "gray.200" };
    }
  };

  const { color, bg } = getTypeColors(type);
  return (
    <Badge color={color} bg={bg} fontWeight="bold" px={2} py={1} borderRadius="md" textTransform="capitalize">
      {type}
    </Badge>
  );
});
JobTypeCell.displayName = "JobTypeCell";

export const StatusCell = React.memo(({ row }: any) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled": return "blue.500";
      case "unassigned": return "gray.500";
      case "in transit": return "green.400";
      case "en route for pickup": return "orange.400";
      case "assigned": return "purple.400";
      default: return "black";
    }
  };
  return (
    <Text color={getStatusColor(row?.original?.job?.job_status?.name)} fontWeight="bold">
      {row?.original?.job?.job_status?.name || "-"}
    </Text>
  );
});
StatusCell.displayName = "StatusCell";

export const ReadyAtCell = React.memo(({ row }: any) => (
  <Flex direction="column" gap={1} minWidth="150px">
    <Text fontSize="md" fontWeight="500">
      Created: {formatDate(row?.original?.job?.created_at) || "-"}
    </Text>
    <Text fontSize="md">
      Scheduled: {formatDate(row?.original?.job?.drop_at) || "-"}
    </Text>
  </Flex>
));
ReadyAtCell.displayName = "ReadyAtCell";

export const LastFreeAtCell = React.memo(({ row }: any) => (
  <Text fontSize="md" maxW="150px" minW="150px">
    {row?.original?.job?.last_free_at || "-"}
  </Text>
));
LastFreeAtCell.displayName = "LastFreeAtCell";

export const PickupBusinessNameCell = React.memo(({ row }: any) => {
  const pickupDest = row?.original?.job?.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  return (
    <Text fontSize="md" maxW="150px" minW="100px">
      {pickupDest?.address_business_name || "-"}
    </Text>
  );
});
PickupBusinessNameCell.displayName = "PickupBusinessNameCell";

export const PickupAddressCell = React.memo(({ row }: any) => {
  const pickup = row?.original?.job?.job_destinations?.find(
    (d: any) => d.is_pickup === true,
  );
  if (!pickup) return <>-</>;
  return (
    <Text whiteSpace="pre-line" textTransform="capitalize" fontSize="md" minWidth={"170px"}>
      {pickup.address_city}, {pickup.address_postal_code} {pickup.address_state}
    </Text>
  );
});
PickupAddressCell.displayName = "PickupAddressCell";

export const CustomerReferenceCell = React.memo(({ row }: any) => (
  <Text fontSize="md" maxW="150px" noOfLines={2}>
    {row?.original?.job?.reference_no || "-"}
  </Text>
));
CustomerReferenceCell.displayName = "CustomerReferenceCell";

export const CategoryCell = React.memo(({ row }: any) => (
  <Text fontSize="md" maxW="100px">
    {row?.original?.job?.job_category?.name || "-"}
  </Text>
));
CategoryCell.displayName = "CategoryCell";

export const DeliveryCell = React.memo(({ row }: any) => {
  const job = row?.original?.job;
  const labels: JobLabel[] = Array.isArray(job?.meta) ? job.meta : [];
  const canRemove = !!job?.preallocation_driver_id;

  // ✅ FIX: useContext instead of useMutation per row
  // BEFORE: 100 rows × useMutation(REMOVE_PRE_ALLOCATE_DRIVER) = 100 Apollo registrations
  // AFTER:  1 shared mutation via RemoveDriverContext → faster, less memory
  const { removeDriver, loadingId } = useContext(RemoveDriverContext);
  const loading = loadingId === String(job?.id);

  const getBadgeStyle = (color?: string) => ({
    bg: color?.startsWith("#") ? color : color || "gray",
    color: "#fff",
    boxShadow: `0 0 0 1px ${color || "gray"}`,
  });

  const jobIcons = [
    { condition: job?.is_inbound_connect, label: "Inbound Connect", icon: faInfinity },
    { condition: job?.is_paperwork_required, label: "Paperwork Required", icon: faPager },
    { condition: job?.is_hand_unloading, label: "Handling", icon: faHandHolding },
    { condition: job?.is_dangerous_goods, label: "Dangerous goods", icon: faWarning },
    { condition: job?.is_tailgate_required, label: "Tail lift", icon: faTruckRampBox },
  ];

  const handleRemove = useCallback(() => {
    removeDriver(job);
  }, [job, removeDriver]);

  return (
    <>
      {labels.length > 0 && (
        <VStack align="start" spacing="4px" mb="10px">
          {labels.map((label) => (
            <Badge
              key={label?.id}
              fontSize="12px"
              px="8px"
              py="2px"
              borderRadius="4px"
              whiteSpace="nowrap"
              {...getBadgeStyle(label.color)}
            >
              {label.name}
            </Badge>
          ))}
        </VStack>
      )}
      <Flex direction="column" w="100%" maxW="150px">
        <Flex align="center" justify="space-between" w="100%">
          {canRemove && (
            <Tooltip label="Remove Job from Driver">
              <IconButton
                aria-label="Remove Job"
                icon={<CloseIcon />}
                size="xs"
                color="red.500"
                variant="ghost"
                isLoading={loading}
                onClick={handleRemove}
              />
            </Tooltip>
          )}
          <Text ml="2" noOfLines={1}>
            {job?.name || "-"}
          </Text>
        </Flex>
        <Flex justify={canRemove ? "flex-end" : "flex-start"} gap={1} mt="1" ml="2">
          {jobIcons
            .filter((item) => item.condition)
            .map((item, index) => (
              <Tooltip key={index} label={item.label}>
                <FontAwesomeIcon
                  icon={item.icon}
                  className="!text-[var(--chakra-colors-red-400)] p-1"
                  size="sm"
                />
              </Tooltip>
            ))}
        </Flex>
      </Flex>
    </>
  );
});
DeliveryCell.displayName = "DeliveryCell";

export const DeliveryCellBulkAssign = React.memo(({ row }: any) => {
  const job = row?.original?.job;
  return (
    <Flex align="center" justify="space-between" maxW="150px">
      <Text mr="2" fontSize="md" noOfLines={1}>
        {job?.name || "-"}
      </Text>
    </Flex>
  );
});
DeliveryCellBulkAssign.displayName = "DeliveryCellBulkAssign";

export const AdminNotesCell = React.memo(({ row }: any) => {
  const current = row?.original?.job?.admin_notes ?? "";
  const [display, setDisplay] = React.useState(current);

  React.useEffect(() => {
    setDisplay(current);
  }, [current]);

  // FIX: useCallback
  const handleSaved = useCallback((val: string) => setDisplay(val), []);

  return (
    <Flex gap={2} align="center">
      <Text fontSize="md" maxW="200px" noOfLines={2}>
        {display || "-"}
      </Text>
      <EditableFieldPopover
        row={row}
        field="admin_notes"
        multiline
        triggerAriaLabel="Edit admin notes"
        onSaved={handleSaved}
      />
    </Flex>
  );
});
AdminNotesCell.displayName = "AdminNotesCell";

export const TimeslotCell = React.memo(({ row, refetchJobs }: any) => (
  <Flex gap={2} align="center">
    <Text
      minW="150px"
      fontSize="28px"
      fontWeight="900"
      letterSpacing="2px"
      textAlign="center"
      color="white"
      textShadow="
        2px 2px 0 rgba(0,0,0,0.85),
        3px 3px 6px rgba(0,0,0,0.6)
      "
    >
      {row?.original?.job?.timeslot || "-"}
    </Text>
    <EditableFieldPopover
      row={row}
      field="timeslot"
      triggerAriaLabel="Edit timeslot"
      refetchJobs={refetchJobs}
    />
  </Flex>
));
TimeslotCell.displayName = "TimeslotCell";

export const TotalQuantityCell = React.memo(({ row }: any) => (
  <Text fontSize="md" maxW="100px">
    {row?.original?.job?.total_quantity || "-"}
  </Text>
));
TotalQuantityCell.displayName = "TotalQuantityCell";

export const TotalWeightCell = React.memo(({ row }: any) => (
  <Text fontSize="md" maxW="120px">
    {row?.original?.job?.total_weight || "-"}
  </Text>
));
TotalWeightCell.displayName = "TotalWeightCell";

export const TotalVolumeCell = React.memo(({ row }: any) => (
  <Text fontSize="md" maxW="120px">
    {row?.original?.job?.total_volume || "-"}
  </Text>
));
TotalVolumeCell.displayName = "TotalVolumeCell";

export const Charges = React.memo(({ row }: any) => {
  const charges = row?.original?.job?.price_summary?.charges || [];
  return (
    <>
      {charges.length > 0 ? (
        charges.map((item: any, index: number) => (
          <Text key={index} fontSize="md" w="180px">
            {item.name} - ${item.total}
          </Text>
        ))
      ) : (
        <Text fontSize="md">0</Text>
      )}
    </>
  );
});
Charges.displayName = "Charges";

export const SubTotal = React.memo(({ row }: any) => {
  const subTotal = Number(row?.original?.job?.price_summary?.sub_total || 0);
  const tax = Number(row?.original?.job?.price_summary?.tax || 0);
  const total = Number(row?.original?.job?.price_summary?.total || 0);
  const driverPay = Number(row?.original?.job?.driver_pay || 0);
  const driverId = row?.original?.job?.driver_id;
  const isAllZero = subTotal === 0 && tax === 0 && total === 0;
  return (
    <>
      <Text fontSize="md" w="250px">
        {isAllZero ? "Invoice: 0" : `Invoice: ${subTotal}+${tax}= $${total}`}
      </Text>
      {driverId !== null && driverId !== undefined && (
        <Text fontSize="md" w="250px">Driver Pay: $ {driverPay}</Text>
      )}
    </>
  );
});
SubTotal.displayName = "SubTotal";

export const Tax = React.memo(({ row }: any) => (
  <Text fontSize="md" maxW="150px">
    {row?.original?.job?.price_summary?.tax || "0"}
  </Text>
));
Tax.displayName = "Tax";

export const TotalPrice = React.memo(({ row }: any) => (
  <Text fontSize="md" maxW="160px">
    {row?.original?.job?.price_summary?.total || "0"}
  </Text>
));
TotalPrice.displayName = "TotalPrice";

export const SuburbAreaCell = React.memo(({ row }: any) => {
  const area = row?.original?.job?.suburb_area || "";
  const bgColor = row?.original?.job?.area_color || "#751010";
  return (
    <>
      <Badge bg={bgColor} color="white" maxW="100px" px={2} py={1} borderRadius="md" textTransform="capitalize">
        {area}
      </Badge>
      <Text fontSize="xs" mt={1}>
        {row?.original?.job?.driver?.full_name || ""}
      </Text>
    </>
  );
});
SuburbAreaCell.displayName = "SuburbAreaCell";

export const FromQuadCell = React.memo(({ row }: any) => (
  <Text mt={1} fontSize="md" fontWeight="bold">
    {row?.original?.job?.pickup_quad || ""}
  </Text>
));
FromQuadCell.displayName = "FromQuadCell";

export const ToQuadCell = React.memo(({ row }: any) => (
  <Text mt={1} fontSize="md" fontWeight="bold">
    {row?.original?.job?.delivery_quad || ""}
  </Text>
));
ToQuadCell.displayName = "ToQuadCell";

// ─────────────────────────────────────────────
// MEDIA CELL MAP & HELPERS (unchanged)
// ─────────────────────────────────────────────

const MEDIA_CELL: Record<string, { with: any; without: any }> = {
  "pick_up_destination.address_formatted,pick_up_destination.address_business_name": {
    with: PickupAddressWithTimeCell,
    without: PickupAddressWithTimewithoutMediaCell,
  },
  "job_destinations.address,job_destinations.address_business_name": {
    with: JobDestinationWithBusinessNameCell,
    without: JobDestinationWithBusinessNamewithoutMediaCell,
  },
};

function applyMediaCells(cols: any[], withMedia: boolean): any[] {
  return cols.map((col) => {
    const media = MEDIA_CELL[col?.id];
    if (!media) return col;
    return { ...col, Cell: withMedia ? media.with : media.without };
  });
}

function uniqueById(cols: any[]): any[] {
  const seen = new Set<string>();
  return cols.filter((c) => (seen.has(c?.id) ? false : (seen.add(c?.id), true)));
}

// ─────────────────────────────────────────────
// tableColumn definition (unchanged structure)
// ─────────────────────────────────────────────

export const tableColumn = (refetchJobs: () => void) => [
  {
    id: "name",
    Header: "Delivery ID",
    Cell: ({ row }: any) => <DeliveryCell row={row} />,
    accessor: (row: any) => row?.job?.id || 0,
    enableSorting: true,
    sortType: "basic",
  },
  { id: "suburb_area,area_color", Header: "Quad", Cell: SuburbAreaCell, accessor: (row: any) => row?.job?.suburb_area || "", enableSorting: true },
  { id: "pickup_quad", Header: "From Quad", Cell: FromQuadCell },
  { id: "delivery_quad", Header: "To Quad", Cell: ToQuadCell },
  { id: "job_type.name", Header: "Type", Cell: JobTypeCell },
  { id: "pick_up_destination.address_formatted", Header: "Pickup From", Cell: PickupAddressCell },
  {
    id: "pick_up_destination.address_formatted,pick_up_destination.address_business_name",
    Header: "Pickup Address and Name ",
    Cell: PickupAddressWithTimewithoutMediaCell,
    CellExport: PickupAddressWithTimeCellExport,
    accessor: (row: any) => row?.job?.pick_up_destination?.address_formatted || "",
    enableSorting: true,
  },
  { id: "pick_up_destination.address_business_name", Header: "Pickup Company", Cell: PickupBusinessNameCell },
  { id: "job_destinations.address", Header: "Delivery To", width: "100px", Cell: JobDestinationsCell, CellExport: JobDestinationsCellExport },
  { id: "job_destinations.address_business_name", Header: "Del. Company ", Cell: JobDestinationBusinessNameCell, CellExport: JobDestinationBusinessNameCellExport },
  { id: "total_quantity", Header: "Pcs/Qty", Cell: TotalQuantityCell },
  { id: "total_weight", Header: "Weight", Cell: TotalWeightCell },
  { id: "total_volume", Header: "CBM", Cell: TotalVolumeCell },
  { id: "price_summary.charges", Header: "Charges", Cell: Charges },
  { id: "price_summary.sub_total", Header: "Total", Cell: SubTotal },
  { id: "price_summary.tax", Header: "Tax", Cell: Tax },
  { id: "price_summary.total", Header: "Total Price", Cell: TotalPrice },
  {
    id: "job_destinations.address,job_destinations.address_business_name",
    Header: "Delivery Address and Name",
    Cell: JobDestinationWithBusinessNamewithoutMediaCell,
    CellExport: JobDestinationWithBusinessNameCellExport,
  },
  { id: "reference_no", Header: "Customer Ref.", Cell: CustomerReferenceCell },
  { id: "job_category.name", Header: "category", Cell: CategoryCell },
  { id: "company.name", Header: "Company", Cell: BookedByCell },
  { id: "ready_at", Header: "Date", Cell: ReadyAtCell },
  { id: "job_category.name,ready_at,drop_at", Header: "Ready By / Drop by", Cell: ReadyDropByCell, CellExport: ReadyDropByCellExport },
  {
    id: "timeslot",
    Header: "Timeslot",
    Cell: ({ row }: any) => <TimeslotCell row={row} refetchJobs={refetchJobs} />,
  },
  { id: "last_free_at", Header: "Last Free Day", Cell: LastFreeAtCell },
  { id: "job_items.dimensions", Header: "Dimensions", Cell: ItemsDimensionCell, CellExport: ItemsDimensionCellExport },
  { id: "customer_notes", Header: "Client notes", Cell: NotesCell },
  { id: "admin_notes", Header: "Admin Notes", accessor: "admin_notes" as const, Cell: AdminNotesCell },
];

// ─────────────────────────────────────────────
// getColumnsPre — FIX: refetchJobs dep added in useMemo (caller side in jobs.tsx)
// ─────────────────────────────────────────────

export const getColumnsPre = (
  isAdmin: boolean,
  withMedia: boolean,
  refetchJobs?: () => void,
  dynamicTableUsers?: DynamicTableUser[],
) => {
  const base: any[] = [
    {
      id: "selection",
      // ✅ FIX: null — PreJobPaginationTable renders its own optimistic checkbox.
      // IndeterminateCheckbox called row.getToggleRowSelectedProps() which caused
      // ALL 100 rows to re-render on every single click (2500+ re-renders).
      Header: () => <></>,
      Cell: () => <></>,
    },
  ];

  if (!dynamicTableUsers || dynamicTableUsers.length === 0) {
    const cols = uniqueById([...base, ...tableColumn(refetchJobs)]);
    return applyMediaCells(cols, withMedia);
  }

  let columns = [
    ...base,
    ...outputDynamicTable(dynamicTableUsers, tableColumn(refetchJobs)),
  ];
  columns = applyMediaCells(columns, withMedia);
  columns = uniqueById(columns);
  return columns;
};


export const bulkassigntableColumn = [
  { id: "name", Header: "Delivery ID", Cell: DeliveryCellBulkAssign },
  { id: "suburb_area,area_color", Header: "Quad", Cell: SuburbAreaCell },
  { id: "job_category.name,ready_at,drop_at", Header: "Ready By / Drop by", Cell: ReadyDropByCell, CellExport: ReadyDropByCellExport },
  { id: "pick_up_destination.address_formatted,pick_up_destination.address_business_name", Header: "Pickup Address and Name ", Cell: PickupAddressWithTimewithoutMediaCell, CellExport: PickupAddressWithTimeCellExport },
  { id: "job_destinations.address,job_destinations.address_business_name", Header: "Delivery Address and Name", Cell: JobDestinationWithBusinessNamewithoutMediaCell, CellExport: JobDestinationWithBusinessNameCellExport },
  { id: "job_items.dimensions", Header: "Dimensions", Cell: BulkItemsDimensionCell, CellExport: ItemsDimensionCellExport },
];

export const getBulkAssignColumns = (
  _isAdmin: boolean,
  _isCustomer: boolean,
  _dynamicTableUsers?: DynamicTableUser[],
) => {
  const orderCol = {
    id: "order",
    Header: "",
    Cell: ({ _row }: any) => (
      <div>
        <Icon as={MdMenu} h="16px" w="16px" me="8px" />
      </div>
    ),
  };

  // ✅ FIX: this modal is for reordering only, not full detail viewing —
  // per Sam's approval it's fixed at these 6 essential columns for
  // everyone, not user-customizable. Previously this ran the list through
  // outputDynamicTable(dynamicTableUsers, ...), which re-applied each
  // user's PREVIOUSLY SAVED column preferences (from before the reduction,
  // when there were ~28 columns) — so the header row kept showing the old
  // full list regardless of how far bulkassigntableColumn itself was
  // trimmed. Always returning the fixed set here guarantees the header
  // matches bulkassigntableColumn exactly, for every user.
  return [orderCol, ...bulkassigntableColumn];
};