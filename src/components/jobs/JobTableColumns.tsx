import { useMutation } from "@apollo/client";
import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import {
  Flex,
  Icon,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import IndeterminateCheckbox from "components/table/IndeterminateCheckbox";
import { DynamicTableUser } from "graphql/dynamicTableUser";
import { UPDATE_JOB_MUTATION } from "graphql/job";
import {
  formatAddress,
  formatDate,
  formatTime,
  outputDynamicTable,
} from "helpers/helper";
import React, { useState } from "react";
import { MdMenu } from "react-icons/md";
// import { useDispatch } from "react-redux";
// import { setIsShowRightSideBar,  } from "store/rightSideBarSlice";
import { RootState } from "store/store";

export const isAdmin = (state: RootState) => state.user.isAdmin;
export const isCustomer = (state: RootState) => state.user.isCustomer;

// export const getJobRowProps = (row: any) => {
//   return {
//     style: {
//       cursor: 'pointer',
//     },
//     bg: row.original.job_status?.id == 1 ? 'yellow.50' : 
//         [6, 7].includes(Number(row.original.job_status?.id)) ? 'green.50' : 
//         'white',
//     // _hover: { bg: 'gray.100' }
//   };
// };

export const PickupAddressBusinessNameCell = ({ row }: any) => (
  <>
    <Text mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
      {formatAddress(row.original.pick_up_destination)}
    </Text>
    <Text>{row.original.pick_up_destination.address_business_name || "-"}</Text>
  </>
);
export const JobDestinationsCell = ({ row }: any) => {
  // Add null check and default empty array
  const destinations = row?.original?.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );

  return (
    <>
      <Text isTruncated w={"fit-content"}>
        {filteredDestinations.length > 0
          ? `${filteredDestinations[0].address_line_1}, ${filteredDestinations[0].address_city}, ${filteredDestinations[0].address_postal_code}`
          : "-"}
      </Text>
      {filteredDestinations.length > 1 && ( // Only show View All if there are more deliveries
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
                <>
                  <Text color="black" mb="5" key={index}>
                    Address {index + 1}: {formatAddress(destination)}
                  </Text>
                </>
              ))}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};
export const JobDestinationsCellExport = ({ row }: any) => {
  const filteredDestinations = row.original.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );

  return formatAddress(filteredDestinations[0]);
};
export const JobDestinationBusinessNameCell = ({ row }: any) => {
  // Add null check and default empty array
  const destinations = row?.original?.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );

  return (
    <>
      <Text>{filteredDestinations[0]?.address_business_name || "-"}</Text>
    </>
  );
};
export const JobDestinationBusinessNameCellExport = ({ row }: any) => {
  const filteredDestinations = row.original.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );
  return filteredDestinations[0]?.address_business_name || "-";
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
      {/* {normalMedia.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {normalMedia.map((media: any, index: number) => (
            <Link key={index} href={media.downloadable_url} isExternal>
              <img
                src={media.downloadable_url}
                alt={media.name || "Delivery evidence"}
                style={{
                  width: "50px",
                  height: "50px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
            </Link>
          ))}
        </Flex>
      )} */}
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
export const ReadyDropByCell = ({ row }: any) => (
  <>
    <Text isTruncated w={"fit-content"}>
      {row.original.job_category?.name ?? "-"}
    </Text>
    <Text isTruncated w={"fit-content"}>
      R: {formatTime(row.original.ready_at)}
    </Text>
    <Text isTruncated w={"fit-content"}>
      D: {formatTime(row.original.drop_at)}
    </Text>
  </>
);
export const ReadyDropByCellExport = ({ row }: any) =>
  `${row.original.job_category?.name ?? "-"}\n
    R: ${formatTime(row.original.ready_at)}\n
    D: ${formatTime(row.original.drop_at)}`;
export const NotesCell = ({ row }: any) => {
  const notes = row.original.customer_notes ?? null;
  return (
    <>
      <Text
        // minWidth={"300px"}
        maxWidth={"100px"}
        w={"min-content"}
        color="black"
        noOfLines={2}
      >
        {notes ?? "-"}
      </Text>
      {notes && (
        <Popover placement="bottom" closeOnBlur={false}>
          <PopoverTrigger>
            <Text color="primary.400" cursor="pointer" mt={5}>
              <strong>View note</strong>
            </Text>
          </PopoverTrigger>
          <PopoverContent color="black" bg="black.100" borderColor="black.100">
            <PopoverHeader color="black" pt={4} fontWeight="bold" border="0">
              Notes:
            </PopoverHeader>
            <PopoverArrow bg="black.100" />
            <PopoverCloseButton />
            <PopoverBody>
              <Text color="black" mb="5">
                {notes}
              </Text>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};
export const ItemsTypeCell = ({ row }: any) => {
  const items = row.original.job_items;
  return (
    <div>
      {items.map((item: any) => (
        <Text key={`items-type-${item.id}`} mb={2}>
          {item.item_type.name}
        </Text>
      ))}
    </div>
  );
};
export const ItemsTypeCellExport = ({ row }: any) => {
  const items = row.original.job_items;
  return items.map((item: any) => {
    return [`${item.item_type.name}  \n`];
  });
};
export const ItemsDimensionCell = ({ row }: any) => {
  const items = row.original.job_items;
  return (
    <div>
      {items.map((item: any) => (
        <Text key={`items-dimension-${item.id}`} mb={2} w={"max-content"}>
          {`${(item.dimension_height * 100)?.toFixed(0)}x${(
            item.dimension_width * 100
          )?.toFixed(0)}x${(item.dimension_depth * 100)?.toFixed(0)}`}
        </Text>
      ))}
    </div>
  );
};
export const ItemsDimensionCellExport = ({ row }: any) => {
  const items = row.original.job_items;
  return items.map((item: any) => {
    return [
      `${(item.dimension_height * 100)?.toFixed(2)}cm x `,
      `${(item.dimension_width * 100)?.toFixed(2)}cm x `,
      `${(item.dimension_depth * 100)?.toFixed(2)}cm  \n`,
    ];
  });
};
export const ItemsQuantityCell = ({ row }: any) => {
  const items = row.original.job_items;
  return (
    <div>
      {items.map((item: any) => (
        <Text key={`items-quantity-${item.id}`} mb={2}>
          {item?.quantity}
        </Text>
      ))}
    </div>
  );
};
export const ItemsQuantityCellExport = ({ row }: any) => {
  const items = row.original.job_items;
  return items.map((item: any) => {
    return [`${item?.quantity}  \n`];
  });
};
export const ItemsWeightCell = ({ row }: any) => {
  const items = row.original.job_items;
  return (
    <div>
      {items.map((item: any) => (
        <Text key={`items-weight-${item.id}`} mb={2}>
          {item?.weight}kg
        </Text>
      ))}
    </div>
  );
};
export const ItemsWeightCellExport = ({ row }: any) => {
  const items = row.original.job_items;
  return items.map((item: any) => {
    return [`${item?.weight}kg  \n`];
  });
};
export const ItemsCbmCell = ({ row }: any) => {
  const items = row.original.job_items;
  return (
    <div>
      {items.map((item: any) => (
        <Text key={`items-cbm-${item.id}`} mb={2}>
          {item.volume?.toFixed(2)}cbm
        </Text>
      ))}
    </div>
  );
};
export const ItemsCbmCellExport = ({ row }: any) => {
  const items = row.original.job_items;
  return items.map((item: any) => {
    return [`${item.volume?.toFixed(2)}cbm  \n`];
  });
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
        {formatAddress(pickupDest)}
      </Text>
      <Text>{pickupDest?.address_business_name || "-"}</Text>
      {/* {normalMedia.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {normalMedia.map((media: any, index: number) => (
            <Link key={index} href={media.downloadable_url} isExternal>
              <img
                src={media.downloadable_url}
                alt={media.name || "Pickup evidence"}
                style={{
                  width: "50px",
                  height: "50px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
            </Link>
          ))}
        </Flex>
      )} */}
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
export const BookedByCell = ({ row }: any) => {
  // console.log(row, "roww");
  return (
    <>
      <Text>{row.company?.name}</Text>
    </>
  );
};
// export const BookedByCellExport = ({ row }: any) => {
//   const pickupDest = row.original.job_destinations?.find(
//     (dest: any) => dest.is_pickup === true,
//   );
//   const collectionTime = pickupDest?.updated_at
//     ? `Collection time: ${formatDate(
//         pickupDest.updated_at,
//         "HH:mm, DD/MM/YYYY",
//       )}\n`
//     : "";

//   return `${collectionTime}${formatAddress(
//     row.original.pick_up_destination,
//   )}\n${row.original.pick_up_destination?.address_business_name || "-"}`;
// };
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
    <Text color={getTypeColor(row.original.job_type?.name)} fontWeight="bold">
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
      color={getStatusColor(row.original.job_status?.name)}
      fontWeight="bold"
    >
      {row.original.job_status?.name || "-"}
    </Text>
  );
};

export const CustomerReferenceCell = ({ row }: any) => {
  return <Text maxW="100px">{row.original.reference_no || "-"}</Text>;
};

export const AdminNotesCell = ({ row }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(row.original.admin_notes ?? "");
  const [displayNotes, setDisplayNotes] = useState(
    row.original.admin_notes ?? "",
  );
  const toast = useToast();

  const [updateAdminNotes] = useMutation(UPDATE_JOB_MUTATION, {
    onCompleted: () => {
      setDisplayNotes(notes);
      toast({
        title: "Notes updated",
        status: "success",
        duration: 2000,
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    },
  });

  const handleSave = () => {
    updateAdminNotes({
      variables: {
        input: {
          id: parseInt(row.original.id),
          admin_notes: notes,
          customer_id: row.original.customer_id,
          company_id: row.original.company_id,
          job_type_id: row.original.job_type_id,
        },
      },
    });
  };

  return (
    <Flex gap={2} alignItems="center">
      <Text maxW="200px" noOfLines={2}>
        {displayNotes || "-"}
      </Text>
      <Popover
        isOpen={isEditing}
        onClose={() => {
          setNotes(displayNotes);
          setIsEditing(false);
        }}
      >
        <PopoverTrigger>
          <IconButton
            aria-label="Edit notes"
            icon={<EditIcon />}
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          />
        </PopoverTrigger>
        <PopoverContent p={4}>
          <PopoverArrow />
          <PopoverCloseButton />
          <Flex direction="column" gap={2}>
            <Textarea
              value={notes}
              onChange={(e: any) => setNotes(e.target.value)}
              size="sm"
              rows={4}
              resize="none"
              mb={2}
            />
            <Flex gap={2} justifyContent="flex-end">
              <IconButton
                aria-label="Save notes"
                icon={<CheckIcon />}
                size="sm"
                colorScheme="green"
                onClick={handleSave}
              />
              <IconButton
                aria-label="Cancel editing"
                icon={<CloseIcon />}
                size="sm"
                colorScheme="red"
                onClick={() => {
                  setNotes(displayNotes);
                  setIsEditing(false);
                }}
              />
            </Flex>
          </Flex>
        </PopoverContent>
      </Popover>
    </Flex>
  );
};

// const DeliveryIdCell = ({ row, onMarkerClick }: any) => {
//   const dispatch = useDispatch();
  
//   const handleClick = useCallback(() => {
//     // Only dispatch essential data for initial render
//     // const essentialData = {
//     //   id: row.original.id,
//     //   name: row.original.name,
//     //   status: row.original.job_status,
//     //   type: row.original.job_type
//     // };
//     debugger
//     console.log(row.original, "row.original")
//     console.log('first,',row)
//     dispatch(setRightSideBarJob(row));
//     dispatch(setIsShowRightSideBar(true));
    
//     // Delay full data fetch
//     setTimeout(() => {
//       onMarkerClick?.({ job_id: row.original.id });
//     }, 0);
//   }, [row.original, dispatch, onMarkerClick]);

//   return (
//     <Text
//       cursor="pointer"
//       color="primary.400"
//       onClick={handleClick}
//     >
//       #{row.original.name}
//     </Text>
//   );
// };

export const tableColumn = [
  {
    id: "name",
    Header: "Delivery ID",
    accessor: "name" as const,
    // Cell: DeliveryIdCell
    // width: "100px",
  },
  {
    id: "bookedBy",
    Header: "Booked By",
    accessor: "company.name" as const,
    Cell: BookedByCell, // Use the new cell component
    // CellExport: BookedByCellExport,
  },
  {
    id: "reference_no",
    Header: "Customer Reference",
    // accessor: "reference_no" as const,
    Cell: CustomerReferenceCell,
    width: "150px",
  },
  {
    id: "job_category.name",
    Header: "category",
    accessor: "job_category.name" as const,
    width: "100px",
  },
  {
    id: "job_type.name",
    Header: "Type",
    accessor: "job_type.name" as const,
    Cell: JobTypeCell, // Add this line
    // width: "100px",
  },
  {
    id: "job_status.name",
    Header: "Status",
    accessor: "job_status.name" as const,
    Cell: StatusCell, // Add this line
    // width: "100px",
  },
  {
    id: "ready_at",
    Header: "Date",
    accessor: "ready_at" as const,
    type: "date",
  },
  {
    id: "pick_up_address",
    Header: "Pickup From",
    accessor: "pick_up_address" as const,
    width: "150px",
  },
  {
    id: "pick_up_destination.address_formatted,pick_up_destination.address_business_name",
    Header: "Pickup Address and Name ",
    // accessor:
    //   "pick_up_destination.address_formatted,pick_up_destination.address_business_name" as const,
    width: "200px",
    Cell: PickupAddressWithTimeCell, // Use the new cell component
    CellExport: PickupAddressWithTimeCellExport,
  },
  {
    id: "pick_up_destination.address_business_name",
    Header: "Pickup Business Name",
    accessor: "pick_up_destination.address_business_name" as const,
  },
  {
    id: "job_destinations.address",
    Header: "Delivery Address",
    width: "100px",
    Cell: JobDestinationsCell,
    CellExport: JobDestinationsCellExport,
  },
  {
    id: "job_destinations.address_business_name",
    Header: "Delivery Business Name",
    Cell: JobDestinationBusinessNameCell,
    CellExport: JobDestinationBusinessNameCellExport,
  },
  {
    id: "job_destinations.address,job_destinations.address_business_name",
    Header: "Delivery Address and Name",
    Cell: JobDestinationWithBusinessNameCell,
    CellExport: JobDestinationWithBusinessNameCellExport,
  },
  {
    id: "job_category.name,ready_at,drop_at",
    Header: "Ready By / Drop by",
    Cell: ReadyDropByCell,
    CellExport: ReadyDropByCellExport,
  },
  {
    id: "timeslot",
    Header: "Timeslot",
    accessor: "timeslot" as const,
    // width: "50px",
  },
  {
    id: "last_free_at",
    Header: "Last Free Day",
    accessor: "last_free_at" as const,
    type: "date",
  },
  {
    id: "job_items.item_type",
    Header: "Item Type",
    Cell: ItemsTypeCell,
    CellExport: ItemsTypeCellExport,
  },
  {
    id: "job_items.dimensions",
    Header: "Dimensions",
    Cell: ItemsDimensionCell,
    CellExport: ItemsDimensionCellExport,
  },
  {
    id: "job_items.quantity",
    Header: "Quantity",
    Cell: ItemsQuantityCell,
    CellExport: ItemsQuantityCellExport,
  },
  {
    id: "job_items.weight",
    Header: "Weight",
    Cell: ItemsWeightCell,
    CellExport: ItemsWeightCellExport,
  },
  {
    id: "job_items.volume",
    Header: "CBM",
    Cell: ItemsCbmCell,
    CellExport: ItemsCbmCellExport,
  },
  {
    id: "extras",
    Header: "Extras",
    accessor: "extras" as const,
    // width: "100px",
  },
  {
    id: "customer_notes",
    Header: "Client notes",
    Cell: NotesCell,
  },
  {
    id: "driver.full_name",
    Header: "Driver",
    accessor: "driver.full_name" as const,
    enableSorting: true,
  },
  {
    id: "admin_notes",
    Header: "Admin Notes",
    accessor: "admin_notes" as const,
    Cell: AdminNotesCell,
    show: isCustomer,
  },
];

export const getColumns = (
  isAdmin: boolean,
  isCustomer: boolean,
  dynamicTableUsers?: DynamicTableUser[],
) => {
  if (dynamicTableUsers === undefined || dynamicTableUsers.length === 0) {
    return [
      {
        id: "selection",
        // The header can use the table's getToggleAllRowsSelectedProps method
        // to render a checkbox
        Header: ({ getToggleAllRowsSelectedProps }: any) => (
          <div>
            <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
          </div>
        ),
        // The cell can use the individual row's getToggleRowSelectedProps method
        // to the render a checkbox
        Cell: ({ row }: any) => (
          <div>
            <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
          </div>
        ),
      },
      ...tableColumn,
      {
        id: "actions",
        Header: "Actions",
        accessor: "id" as const,
        width: "150px",
        isView: !isAdmin ? true : false,
        isEdit: isAdmin ? true : false,
        isTracking: isCustomer, // only display when Tab is In Progress in Customer Portal.
      },
    ];
  }

  const dynamicColumns = outputDynamicTable(dynamicTableUsers, tableColumn);

  var columns: any[] = [
    {
      id: "selection",
      // The header can use the table's getToggleAllRowsSelectedProps method
      // to render a checkbox
      Header: ({ getToggleAllRowsSelectedProps }: any) => (
        <div>
          <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
        </div>
      ),
      // The cell can use the individual row's getToggleRowSelectedProps method
      // to the render a checkbox
      Cell: ({ row }: any) => (
        <div>
          <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
        </div>
      ),
    },
  ];

  columns.push(...dynamicColumns);

  columns.push({
    id: "actions",
    Header: "Actions",
    accessor: "id" as const,
    isView: isCustomer,
    isEdit: isAdmin,
    isTracking: isCustomer, // only display when Tab is In Progress in Customer Portal.
  });

  return columns;
};

export const getBulkAssignColumns = (
  isAdmin: boolean,
  isCustomer: boolean,
  dynamicTableUsers?: DynamicTableUser[],
) => {
  if (dynamicTableUsers === undefined || dynamicTableUsers.length === 0) {
    return [
      {
        id: "order",
        Header: "",
        Cell: ({ row }: any) => (
          <div>
            <Icon mt="auto" mb="auto" as={MdMenu} h="16px" w="16px" me="8px" />
          </div>
        ),
      },
      ...tableColumn,
      {
        id: "actions",
        Header: "Actions",
        accessor: "id" as const,
        isView: isCustomer,
        isEdit: isAdmin,
      },
    ];
  }

  const dynamicColumns = outputDynamicTable(dynamicTableUsers, tableColumn);

  var columns: any[] = [
    {
      id: "order",
      Header: "",
      Cell: ({ row }: any) => (
        <div>
          <Icon as={MdMenu} h="16px" w="16px" me="8px" />
        </div>
      ),
    },
  ];

  columns.push(...dynamicColumns);

  return columns;
};
