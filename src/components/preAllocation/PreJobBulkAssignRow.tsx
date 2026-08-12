import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDate } from "helpers/helper";
import React, { memo, useMemo } from "react";
import { MdDragIndicator } from "react-icons/md";

interface JobBulkAssignRowProps {
  columns: any[];
  item: any;
  isDragOverlay?: boolean;
  sortId?: string | number;
  // ✅ NEW: true while ANY row in the list is being dragged (not just this
  // one). Lets non-active rows switch to cheap plain-text rendering for the
  // duration of the drag, instead of their full rich Cell components.
  isAnyDragActive?: boolean;
}

interface RowCellsProps {
  columns: any[];
  item: any;
  useLightweight: boolean;
}

// ✅ PERF FIX: plain <td>/<tr> instead of Chakra's <Td>/<Tr>. Every Chakra
// component runs through emotion's styled-system on each render — resolving
// theme tokens into actual CSS then diffing/injecting a class. That's a
// meaningfully heavier render path than a plain DOM element with an inline
// style object, and this cell content re-renders on every drag animation
// frame for every row. Visual output is preserved by hand-matching Chakra's
// Table `size="sm"` look (padding, border, font-size) directly below.
//
// ✅ PERF FIX: `contain: "layout style paint"` tells the browser this
// element's internal layout/paint/style changes can't affect anything
// outside its own box, so it can skip recalculating the rest of the page
// when this cell changes. Costs nothing visually, free performance win on
// any frequently-updating grid of elements like this one.
const CELL_BASE_STYLE: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: "0.75rem", // matches Chakra's "xs" font size used previously
  borderBottom: "1px solid #EDF2F7", // Chakra gray.100
  textAlign: "left",
  verticalAlign: "middle",
  contain: "layout style paint",
};

// Plain-text fallback for when a column's real value can be derived
// directly from the row without invoking its (potentially heavy) custom
// Cell renderer — used only for the lightweight-during-drag path below.
//
// ✅ FIX: was reading `item?.original?.[column.accessor]` only — but the
// actual job fields live one level deeper, at `item.original.job.*` (that's
// what the real Cell components read). Since almost every column here has
// a Cell defined, this fallback path was previously dead code and the bug
// went unnoticed; the lightweight-mode change above was the first thing to
// actually exercise it, which is why every non-dragged row went blank
// ("-") for the duration of a drag. Checking the nested job path first
// fixes it while still falling back for any column that genuinely does
// keep its value at the top level of `original`.
function getPlainTextValue(column: any, item: any): React.ReactNode {
  const accessor = column?.accessor;
  const value =
    item?.original?.job?.[accessor] ?? item?.original?.[accessor];

  if (column?.type === "date") {
    return value ? formatDate(value, "DD/MM/YYYY") : "-";
  }
  return value ?? "-";
}

const RowCells = memo(function RowCells({
  columns,
  item,
  useLightweight,
}: RowCellsProps) {
  return (
    <>
      {columns.map((column) => {
        const CellComponent = column?.Cell;

        const bgColor =
          column?.id === "total_weight"
            ? (item?.original?.job?.weight_color ?? undefined)
            : column?.id === "total_volume"
              ? (item?.original?.job?.volume_color ?? undefined)
              : undefined;

        // ✅ PERF FIX: while another row in the list is being dragged, this
        // row doesn't need its full rich content (badges, popovers,
        // formatted components) — it's just sitting there, possibly
        // shifting position. Falling back to plain text for the duration
        // of the drag cuts real render cost across every non-active row,
        // then restores full content the instant the drag ends.
        const content: React.ReactNode =
          CellComponent && !useLightweight ? (
            <CellComponent row={item} />
          ) : (
            getPlainTextValue(column, item)
          );

        return (
          <td
            key={column?.id}
            style={{
              ...CELL_BASE_STYLE,
              backgroundColor: bgColor,
            }}
          >
            {content}
          </td>
        );
      })}
    </>
  );
});

RowCells.displayName = "RowCells";

const JobBulkAssignRow = memo(function JobBulkAssignRow({
  columns,
  item,
  isDragOverlay = false,
  sortId,
  isAnyDragActive = false,
}: JobBulkAssignRowProps) {
  const resolvedId = String(
    sortId ?? item?.original?.job?.id ?? item?.id ?? "",
  );

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

  // This row goes lightweight when some OTHER row is being dragged — the
  // row actually being dragged keeps its real content (it's the one thing
  // visibly following the cursor / animating, worth the render cost).
  const useLightweight = isAnyDragActive && !isDragging;

  const rowStyle = useMemo<React.CSSProperties>(
    () => ({
      transform: CSS.Translate.toString(transform),
      transition,
      opacity: isDragging ? 0.25 : 1,
      position: "relative",
      zIndex: isDragging ? 3 : "auto",
      contain: "layout style paint",
    }),
    [transform, transition, isDragging],
  );

  /*
   * IMPORTANT:
   * Do not use columns.slice(1) directly in JSX.
   *
   * slice() creates a new array on every render.
   * Keeping this array memoized prevents RowCells from receiving
   * a new columns reference during drag updates.
   */
  const restColumns = useMemo(() => columns.slice(1), [columns]);

  const firstColumn = columns[0];

  // Memoized so it doesn't recompute on every drag animation frame — only
  // the isDragging-dependent styling on the <td> below still updates per
  // frame. Must stay above the isDragOverlay early return (Rules of Hooks —
  // the overlay render path still goes through this same component).
  const { firstBgColor, firstContentFull } = useMemo(() => {
    const bgColor =
      firstColumn?.id === "total_weight"
        ? (item?.original?.job?.weight_color ?? undefined)
        : firstColumn?.id === "total_volume"
          ? (item?.original?.job?.volume_color ?? undefined)
          : undefined;

    const content = firstColumn?.Cell ? (
      <firstColumn.Cell row={item} />
    ) : (
      getPlainTextValue(firstColumn, item)
    );

    return { firstBgColor: bgColor, firstContentFull: content };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstColumn, item]);

  // Same lightweight swap as RowCells, applied to the handle column's own
  // content.
  const firstContent = useLightweight
    ? getPlainTextValue(firstColumn, item)
    : firstContentFull;

  if (isDragOverlay) {
    const job = item?.original?.job;
    return (
      <tr
        style={{
          background: "#EBF8FF",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          opacity: 0.95,
          cursor: "grabbing",
        }}
      >
        <td
          colSpan={columns.length}
          style={{
            padding: "8px 12px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1d2d53",
          }}
        >
          🚚 {job?.reference_no ?? job?.name ?? "Job"}
          {job?.pick_up_address ? (
            <span
              style={{
                fontWeight: 400,
                color: "#4A5568",
                marginLeft: "8px",
              }}
            >
              — {job.pick_up_address}
            </span>
          ) : null}
        </td>
      </tr>
    );
  }

  // ✅ PERF FIX: the handle column's `position: sticky` (kept for the
  // horizontal-scroll UX fix) is disabled to plain `static` positioning for
  // the duration of ANY drag in the list. Sticky elements are more
  // expensive for the browser to repaint/composite than static ones,
  // and during a drag every row in the list repaints on most frames
  // anyway — dropping sticky just for that window removes one more cost
  // without giving up the feature the rest of the time.
  const handleColumnPositioning: React.CSSProperties = isAnyDragActive
    ? { position: "static" }
    : {
      position: "sticky",
      left: 0,
      boxShadow: "2px 0 4px -2px rgba(0,0,0,0.15)",
    };

  return (
    <tr ref={setNodeRef} style={rowStyle} data-job-id={resolvedId}>
      <td
        style={{
          ...CELL_BASE_STYLE,
          backgroundColor: firstBgColor ?? (isDragging ? "#f0f8ff" : "white"),
          minWidth: "40px",
          width: "40px",
          zIndex: isDragging ? 5 : 2,
          ...handleColumnPositioning,
        }}
      >
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
            minHeight: "28px",
          }}
        >
          <MdDragIndicator
            style={{
              color: "#999",
              fontSize: "18px",
              flexShrink: 0,
            }}
          />

          {firstContent}
        </div>
      </td>

      <RowCells
        columns={restColumns}
        item={item}
        useLightweight={useLightweight}
      />
    </tr>
  );
});

JobBulkAssignRow.displayName = "JobBulkAssignRow";

export { JobBulkAssignRow };
export default JobBulkAssignRow;