import { Td, Text, Tr } from "@chakra-ui/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDate } from "helpers/helper";
import React from "react";
import { MdDragIndicator } from "react-icons/md";

interface JobBulkAssignRowProps {
  columns: any[];
  item: any;
  isDragOverlay?: boolean;
  sortId?: string | number;
}

export const JobBulkAssignRow = React.memo(function JobBulkAssignRow({
  columns,
  item,
  isDragOverlay = false,
  sortId,
}: JobBulkAssignRowProps) {
  const resolvedId = String(sortId ?? item?.original?.job?.id ?? item?.id ?? "");

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

  const rowStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.15 : 1,
    position: "relative",
    zIndex: isDragging ? 1 : "auto",
    background: isDragging ? "#f0f8ff" : undefined,
  };

  // ✅ FIX: DragOverlay — native <tr><td>, NOT Chakra <Tr><Td>
  // Chakra Tr calls useTableStyles() which requires <Table> context.
  // DragOverlay renders in document.body portal — no Table context → crash.
  if (isDragOverlay) {
    return (
      <tr
        style={{
          background: "#EBF8FF",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          opacity: 0.95,
          cursor: "grabbing",
        }}
      >
        {/* ✅ Lightweight overlay — only show job name, not all 25 heavy cells */}
        <td
          colSpan={columns.length}
          style={{
            padding: "8px 12px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1d2d53",
          }}
        >
          🚚 {item?.original?.job?.name ?? "Job"}
        </td>
      </tr>
    );
  }

  return (
    <Tr ref={setNodeRef} style={rowStyle}>
      {columns.map((column, colIndex) => {
        const CellComponent = column.Cell;
        const isWeight = column.id === "total_weight";
        const isVolume = column.id === "total_volume";
        const bgColor = isWeight
          ? (item.original?.job?.weight_color ?? undefined)
          : isVolume
            ? (item.original?.job?.volume_color ?? undefined)
            : undefined;

        const content = CellComponent ? (
          <CellComponent row={item} />
        ) : column?.type === "date" ? (
          <Text fontSize="xs">
            {item.original?.[column.accessor]
              ? formatDate(item.original[column.accessor], "DD/MM/YYYY")
              : "-"}
          </Text>
        ) : (
          <Text fontSize="xs">{item.original?.[column.accessor] ?? "-"}</Text>
        );

        // ✅ FIX: drag handle on FIRST column only — not every cell
        // BEFORE: {...attributes} {...listeners} on ALL 25 cells = 25x event overhead
        // AFTER:  drag grip icon on first cell only = clean, fast drag
        if (colIndex === 0) {
          return (
            <Td key={column.id} bg={bgColor} style={{ padding: "4px 8px", width: "40px" }}>
              <div
                {...attributes}
                {...listeners}
                style={{
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "none",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <MdDragIndicator style={{ color: "#999", fontSize: "18px", flexShrink: 0 }} />
                {content}
              </div>
            </Td>
          );
        }

        return (
          <Td key={column.id} bg={bgColor} style={{ padding: "4px 8px" }}>
            {content}
          </Td>
        );
      })}
    </Tr>
  );
});

JobBulkAssignRow.displayName = "JobBulkAssignRow";