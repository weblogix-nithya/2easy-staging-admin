import { Td, Text, Tr } from "@chakra-ui/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDate } from "helpers/helper";

export function JobBulkAssignRow(props: { columns: any[]; item: any }) {
  const { columns, item } = props;

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <Tr key={item.original.id} ref={setNodeRef} style={style}>
      {columns.map((column) => {
        const isWeight = column.id === "total_weight";
        const isVolume = column.id === "total_volume";

        const bgColor = isWeight
          ? item.original?.job?.weight_color ?? "transparent"
          : isVolume
            ? item.original?.job?.volume_color ?? "transparent"
            : undefined;

        return (
          <Td key={column.id} bg={bgColor}>
            <div  {...attributes} {...listeners}> {/* className="flex justify-left" */}
              {column.Cell ? (
                column.Cell({ row: item })
              ) : column?.type === "date" ? (
                <Text>
                  {item.original[column.accessor]
                    ? formatDate(item.original[column.accessor], "DD/MM/YYYY")
                    : "-"}
                </Text>
              ) : (
                <Text>{item.original[column.accessor]}</Text>
              )}
            </div>
          </Td>
        );
      })}
    </Tr>

  );
}
