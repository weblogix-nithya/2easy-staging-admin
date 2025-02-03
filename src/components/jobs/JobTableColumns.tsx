import {
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import IndeterminateCheckbox from "components/table/IndeterminateCheckbox";
import { DynamicTableUser } from "graphql/dynamicTableUser";
import { formatAddress, formatTime, outputDynamicTable } from "helpers/helper";
import React from "react";
import { MdMenu } from "react-icons/md";
import { RootState } from "store/store";
export const isAdmin = (state: RootState) => state.user.isAdmin;
export const isCustomer = (state: RootState) => state.user.isCustomer;
export const PickupAddressBusinessNameCell = ({ row }: any) => (
  <>
    <Text mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
      {formatAddress(row.original.pick_up_destination)}
    </Text>
    <Text>{row.original.pick_up_destination.address_business_name || "-"}</Text>
  </>
);
export const JobDestinationsCell = ({ row }: any) => {
  const filteredDestinations = row.original.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );

  return (
    <>
      <Text mb="2" flexWrap={"nowrap"}>
        {formatAddress(filteredDestinations[0])}
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
  const filteredDestinations = row.original.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );
  return (
    <>
      <Text mb="2" flexWrap={"nowrap"}>
        {filteredDestinations[0]?.address_business_name || "-"}
      </Text>
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
  const filteredDestinations = row.original.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );
  return (
    <>
      <Text mb="2" flexWrap={"nowrap"}>
        {formatAddress(filteredDestinations[0])}
      </Text>
      <Text>{filteredDestinations[0]?.address_business_name || "-"}</Text>
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

export const tableColumn = [
  {
    id: "name",
    Header: "Delivery ID",
    accessor: "name" as const,
    // width: "100px",
  },
  {
    id: "bookedBy",
    Header: "Booked By",
    accessor: "company.name" as const,
  },
  {
    id: "reference_no",
    Header: "Customer Reference",
    accessor: "reference_no" as const,
  },
  {
    id: "job_category.name",
    Header: "category",
    accessor: "job_category.name" as const,
    // width: "100px",
  },
  {
    id: "job_type.name",
    Header: "Type",
    accessor: "job_type.name" as const,
    // width: "100px",
  },
  {
    id: "job_status.name",
    Header: "Status",
    accessor: "job_status.name" as const,
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
    // width: "150px",
  },
  {
    id: "pick_up_destination.address_formatted,pick_up_destination.address_business_name",
    Header: "Pickup Address and Name",
    accessor:
      "pick_up_destination.address_formatted,pick_up_destination.address_business_name" as const,
    // width: "200px",
  },
  {
    id: "pick_up_destination.address_business_name",
    Header: "Pickup Business Name",
    accessor: "pick_up_destination.address_business_name" as const,
  },
  {
    id: "job_destinations.address",
    Header: "Delivery Address",
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
];

export const getColumns = (
  isAdmin: boolean,
  isCustomer: boolean,
  dynamicTableUsers?: DynamicTableUser[],
  isPending?: boolean,
  isCompleted?: boolean,
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
        isView: isCustomer && (isCompleted || isPending),
        isEdit: isAdmin,
        isTracking: isCustomer && !(isCompleted || isPending), // only display when Tab is In Progress in Customer Portal.
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
    isView: isCustomer && (isCompleted || isPending),
    isEdit: isAdmin,
    isTracking: isCustomer && !(isCompleted || isPending), // only display when Tab is In Progress in Customer Portal.
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
