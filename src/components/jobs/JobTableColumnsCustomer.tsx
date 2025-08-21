import { Flex, Link, Text } from "@chakra-ui/react";
import IndeterminateCheckbox from "components/table/IndeterminateCheckbox";
import { formatAddress, formatDate } from "helpers/helper";
import Image from "next/image";
import React from "react";
import { RootState } from "store/store";

export const isAdmin = (state: RootState) => state.user.isAdmin;
export const isCustomer = (state: RootState) => state.user.isCustomer;

// mmmm
export const DeliveryCell = ({ row }: any) => {
  return <Text maxW="100px">{row?.original?.name || "-"}</Text>;
};
export const BookedByCell = ({ row }: any) => {
  const name = row?.original?.company?.name || "-";
  return (
    <Text maxW="150px" minW="100px">
      {name}
    </Text>
  );
};
export const CustomerReferenceCell = ({ row }: any) => {
  return (
    <Text maxW="100px" noOfLines={2}>
      {" "}
      {row?.original?.reference_no || "-"}
    </Text>
  );
};
export const CategoryCell = ({ row }: any) => {
  return (
    <Text maxW="100px">{row?.original?.job_category?.name || "-"}</Text>
  );
};
export const JobTypeCell: React.FC<{
  row: { original: { job_type?: { name: string } } };
}> = ({ row }) => {
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "standard":
        return "purple.500";
      case "urgent":
        return "red.500";
      case "express":
        return "orange.500";
      default:
        return "purple.500";
    }
  };
  return (
    <Text
      color={getTypeColor(row.original.job_type?.name)}
      fontWeight="bold"
    >
      {row.original.job_type?.name || "-"}
    </Text>
  );
};

export const StatusCell = ({ row }: any) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "blue.500";
      case "unassigned":
        return "gray.500";
      case "in transit":
        return "green.400";
      case "en route for pickup":
        return "orange.400";
      case "assigned":
        return "purple.400";
      default:
        return "black";
    }
  };

  return (
    <Text
      color={getStatusColor(row?.original?.job?.job_status?.name)}
      fontWeight="bold"
    >
      {row?.original?.job_status?.name || "-"}
    </Text>
  );
};

export const ReadyAtCell = ({ row }: any) => {
  return (
    <Text maxW="150px" minW="100px">
      {row?.original?.ready_at || "-"}
    </Text>
  );
};
export const JobDestinationWithBusinessNameCell = ({ row }: any) => {
  const destinations = row?.original?.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );
  const showDeliveryTime =
    row.original.job_status_id == 6 || row.original.job_status_id == 7;

  // Only get media if not in status 6 or 7
  const normalMedia =
    filteredDestinations[0]?.media?.filter(
      (item: any) => item.collection_name !== "signatures",
    ) || [];

  return (
    <>
      {filteredDestinations[0]?.updated_at && showDeliveryTime && (
        <Text fontSize="sm" color="red.600" mb={1}>
          Delivery time:{" "}
          {formatDate(filteredDestinations[0].updated_at, "HH:mm, DD/MM/YYYY")}
        </Text>
      )}
      <Text isTruncated w={"fit-content"}>
        {filteredDestinations.length > 0
          ? `${filteredDestinations[0].address_line_1}, ${filteredDestinations[0].address_city}, ${filteredDestinations[0].address_postal_code}`
          : "-"}
      </Text>
      <Text>{filteredDestinations[0]?.address_business_name || "-"}</Text>
      {normalMedia.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
      {normalMedia.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {normalMedia.map((media: any, index: number) => (
            <Link key={index} href={media.downloadable_url} isExternal>
              <Image
                src={media.downloadable_url}
                alt={media.name || "Delivery evidence"}
                width={50}
                height={50}
                style={{
                  objectFit: "cover",
                  borderRadius: "4px",
                  width: "50px", 
                  height: "50px",
                }}
              />
            </Link>
          ))}
        </Flex>
      )}
        </Flex>
      )}
    </>
  );
};
export const JobDestinationWithBusinessNameCellExport = ({ row }: any) => {
  const filteredDestinations = row.original.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );
  const formattedAddress = formatAddress(filteredDestinations[0]);
  const businessName = filteredDestinations[0]?.address_business_name || "-";
  return `${formattedAddress}\n${businessName}`;
};
export const JobDestinationWithBusinessNamewithoutMediaCell = ({
  row,
}: any) => {
  const destinations = row?.original?.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );
  const showDeliveryTime =
    row.original.job_status_id == 6 || row.original.job_status_id == 7;

  return (
    <>
      {filteredDestinations[0]?.updated_at && showDeliveryTime && (
        <Text fontSize="sm" color="red.600" mb={1}>
          Delivery time:{" "}
          {formatDate(filteredDestinations[0].updated_at, "HH:mm, DD/MM/YYYY")}
        </Text>
      )}
      <Text isTruncated w={"fit-content"}>
        {filteredDestinations.length > 0
          ? `${filteredDestinations[0].address_line_1}, ${filteredDestinations[0].address_city}, ${filteredDestinations[0].address_postal_code}`
          : "-"}
      </Text>
      <Text>{filteredDestinations[0]?.address_business_name || "-"}</Text>
    </>
  );
};
export const PickupAddressWithTimeCell = ({ row }: any) => {
  const pickupDest = row.original.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  const showPickupTime =
    row.original.job_status_id == 4 ||
    row.original.job_status_id == 5 ||
    row.original.job_status_id == 6 ||
    row.original.job_status_id == 7;
  const normalMedia =
    pickupDest?.media?.filter(
      (item: any) => item.collection_name !== "signatures",
    ) || [];
  return (
    <>
      {pickupDest?.updated_at && showPickupTime && (
        <Text fontSize="sm" color="red.600" mb={1}>
          Collection time:{" "}
          {formatDate(pickupDest.updated_at, "HH:mm, DD/MM/YYYY")}
        </Text>
      )}
      <Text mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
        {`${pickupDest?.address_line_1}, ${pickupDest?.address_city}, ${pickupDest?.address_postal_code}`}
      </Text>
      <Text>{pickupDest?.address_business_name || "-"}</Text>
      {normalMedia.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {normalMedia.map((media: any, index: number) => (
            <Link key={index} href={media.downloadable_url} isExternal>
              <Image
                src={media.downloadable_url}
                alt={media.name || "Pickup evidence"}
                width={50}
                height={50}
                style={{
                  objectFit: "cover",
                  borderRadius: "4px",
                  width: "50px", 
                  height: "50px",
                }}
              />
            </Link>
          ))}
        </Flex>
      )}
    </>
  );
};
export const PickupAddressWithTimeCellExport = ({ row }: any) => {
  const pickupDest = row.original.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  const collectionTime = pickupDest?.updated_at
    ? `Collection time: ${formatDate(
        pickupDest.updated_at,
        "HH:mm, DD/MM/YYYY",
      )}\n`
    : "";

  return `${collectionTime}${formatAddress(
    row.original.pick_up_destination,
  )}\n${row.original.pick_up_destination?.address_business_name || "-"}`;
};
export const PickupAddressWithTimewithoutMediaCell = ({ row }: any) => {
  const pickupDest = row.original.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  const showPickupTime =
    row.original.job_status_id == 4 ||
    row.original.job_status_id == 5 ||
    row.original.job_status_id == 6 ||
    row.original.job_status_id == 7;

  return (
    <>
      {pickupDest?.updated_at && showPickupTime && (
        <Text fontSize="sm" color="red.600" mb={1}>
          Collection time:{" "}
          {formatDate(pickupDest.updated_at, "HH:mm, DD/MM/YYYY")}
        </Text>
      )}
      <Text mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
        {`${pickupDest?.address_line_1}, ${pickupDest?.address_city}, ${pickupDest?.address_postal_code}`}
      </Text>
      <Text>{pickupDest?.address_business_name || "-"}</Text>
    </>
  );
};

export const getCompanyColumns = (
  isAdmin: boolean,
  isCustomer: boolean,
  withMedia: boolean,
) => {
  return [
    // Selection checkbox column
    {
      id: "selection",
      Header: ({ getToggleAllRowsSelectedProps }: any) => (
        <div>
          <IndeterminateCheckbox
            {...getToggleAllRowsSelectedProps()}
            onClick={(e) => {
              console.log("Checkbox clicked in header");
              e.stopPropagation(); // Prevent propagation to ensure it only affects the checkbox
            }}
          />
        </div>
      ),
      // Row checkbox
      Cell: ({ row }: any) => (
        <div onClick={(e) => e.stopPropagation()}>
          <IndeterminateCheckbox
            {...row.getToggleRowSelectedProps()}
            onClick={(e) => {
              console.log(`Row ${row.id} checkbox clicked`);
              e.stopPropagation(); // Prevent propagation to ensure it only affects the checkbox
            }}
          />
        </div>
      ),
    },
    // Columns for company-related data
    {
      id: "name",
      Header: "Delivery ID",
      Cell: DeliveryCell, // Your custom component for the cell
    },
    {
      id: "company.name",
      Header: "Booked By",
      Cell: BookedByCell,
    },
    {
      id: "reference_no",
      Header: "Customer Reference",
      Cell: CustomerReferenceCell,
    },
    {
      id: "job_category.name",
      Header: "Category",
      Cell: CategoryCell,
    },
    {
      id: "job_type.name",
      Header: "Type",
      Cell: JobTypeCell,
    },
    {
      id: "job_status.name",
      Header: "Status",
      Cell: StatusCell,
    },
    {
      id: "ready_at",
      Header: "Date",
      Cell: ReadyAtCell,
    },
    // "Pick-up From" and "Delivery Address" change based on the withMedia state
    {
      id: "pick_up_destination.address_formatted",
      Header: "Pickup From",
      Cell: withMedia
        ? PickupAddressWithTimeCell // with media
        : PickupAddressWithTimewithoutMediaCell, // without media
    },
    {
      id: "job_destinations.address",
      Header: "Delivery Address",
      Cell: withMedia
        ? JobDestinationWithBusinessNameCell // with media
        : JobDestinationWithBusinessNamewithoutMediaCell, // without media
    },
    {
      id: "actions",
      Header: "Actions",
      accessor: "id" as const,
      isView: isCustomer,
      isEdit: isAdmin,
      isTracking: isCustomer,
    },
  ];
};
