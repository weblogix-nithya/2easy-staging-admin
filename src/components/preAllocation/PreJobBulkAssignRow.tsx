import { Td, Text, Tr } from "@chakra-ui/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDate } from "helpers/helper";

export function JobBulkAssignRow(props: {
  columns: any[];
  item: any;
  isDragOverlay?: boolean;
  sortId?: string | number; // ✅ NEW: explicit id override for cases where item has no top-level id
}) {
  const { columns, item, isDragOverlay = false, sortId } = props;

  // ✅ Use sortId if provided, else fallback to item.id
  const resolvedId = sortId ?? item?.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: resolvedId,
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
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