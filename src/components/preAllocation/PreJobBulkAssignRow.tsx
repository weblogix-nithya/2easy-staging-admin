import { Reorder, useDragControls } from "framer-motion";
import { formatDate } from "helpers/helper";
import React, { memo } from "react";
// import { MdDragIndicator } from "react-icons/md";

interface JobBulkAssignRowProps {
  columns: any[];
  item: any;
  gridTemplateColumns: string;
}

const ROW_HEIGHT = "50px";

const CELL_BASE_STYLE: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: "0.75rem",
  borderBottom: "1px solid #EDF2F7",
  textAlign: "left",
  height: ROW_HEIGHT,
  maxHeight: ROW_HEIGHT,
  minHeight: ROW_HEIGHT,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
};

const CELL_CONTENT_WRAPPER_STYLE: React.CSSProperties = {
  minWidth: 0,
  width: "100%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

function renderCell(column: any, item: any): React.ReactNode {
  const CellComponent = column?.Cell;
  if (CellComponent) return <CellComponent row={item} />;
  if (column?.type === "date") {
    const value = item?.original?.job?.[column?.accessor];
    return value ? formatDate(value, "DD/MM/YYYY") : "-";
  }
  return item?.original?.job?.[column?.accessor] ?? "-";
}

export const JobBulkAssignRow = memo(function JobBulkAssignRow({
  columns,
  item,
  gridTemplateColumns,
}: JobBulkAssignRowProps) {
  const dragControls = useDragControls();

  const firstColumn = columns[0];
  const restColumns = columns.slice(1);

  return (
    <Reorder.Item
      as="div"
      value={item}
      dragListener={false}
      dragControls={dragControls}
      layout="position"
      transition={{ duration: 0.15, ease: "easeOut" }}
      dragTransition={{ power: 0, timeConstant: 0 }}
      style={{
        display: "grid",
        gridTemplateColumns,
        background: "white",
        position: "relative",
        height: ROW_HEIGHT,
        minHeight: ROW_HEIGHT,
        maxHeight: ROW_HEIGHT,
        boxSizing: "border-box",
        willChange: "transform",
      }}
      whileDrag={{
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        backgroundColor: "#EBF8FF",
        zIndex: 10,
      }}
    >
      <div
        style={{
          ...CELL_BASE_STYLE,
          position: "sticky",
          left: 0,
          background: "white",
          zIndex: 2,
          boxShadow: "2px 0 4px -2px rgba(0,0,0,0.15)",
        }}
      >
        <div
          onPointerDown={(e) => dragControls.start(e)}
          style={{
            cursor: "grab",
            touchAction: "none",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "28px",
            width: "100%",
          }}
        >
          {/* <MdDragIndicator
            style={{ color: "#999", fontSize: "18px", flexShrink: 0 }}
          /> */}
          {renderCell(firstColumn, item)}
        </div>
      </div>

      {restColumns.map((column) => (
        <div key={column?.id} style={CELL_BASE_STYLE}>
          <div style={CELL_CONTENT_WRAPPER_STYLE}>
            {renderCell(column, item)}
          </div>
        </div>
      ))}
    </Reorder.Item>
  );
});

JobBulkAssignRow.displayName = "JobBulkAssignRow";

export default JobBulkAssignRow;