import { Td, Text, Tr } from "@chakra-ui/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDate } from "helpers/helper";

export function JobBulkAssignRow(props: {
  columns: any[];
  item: any;
  isDragOverlay?: boolean;
}) {
  const { columns, item, isDragOverlay = false } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item?.id,
    disabled: isDragOverlay,
  });

  const style = {
    // ✅ CSS.Translate (not Transform) — prevents row from shrinking/distorting while dragging
    transform: CSS.Translate.toString(transform),
    transition,
    // ✅ Hide the original row placeholder while dragging (DragOverlay takes its place)
    opacity: isDragging ? 0 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 0 : "auto",
  };

  const overlayStyle = {
    background: "#EBF8FF",
    boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
    opacity: 0.97,
    cursor: "grabbing",
  };

  return (
    <Tr
      key={item?.original?.id}
      ref={setNodeRef}
      style={isDragOverlay ? overlayStyle : style}
    >
      {columns.map((column) => {
        const CellComponent = column.Cell;
        const isWeight = column.id === "total_weight";
        const isVolume = column.id === "total_volume";
        const bgColor = isDragOverlay
          ? undefined
          : isWeight
            ? item.original?.job?.weight_color ?? "transparent"
            : isVolume
              ? item.original?.job?.volume_color ?? "transparent"
              : undefined;

        return (
          <Td key={column.id} bg={bgColor}>
            {/* ✅ Drag handle only on real rows, not on the overlay copy */}
            <div
              style={{ cursor: isDragOverlay ? "grabbing" : "grab" }}
              {...(!isDragOverlay ? { ...attributes, ...listeners } : {})}
            >
              {CellComponent ? (
                <CellComponent row={item} />
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