const PALLET_SIZE = 120; // 120cm
const TRUCK_WIDTH = 240; // 2 pallets wide (2 * 120)
const TRUCK_LENGTH = 840; // 7 pallets long (7 * 120)

interface Box {
    id: number;
    length: number;
    width: number;
    height: number;
}

interface Orientation {
    horizontal: number;
    vertical: number;
    rotated: boolean;
}

interface Placement {
    box: Box;
    position: { x: number; y: number };
    orientation: Orientation;
}


/**
 * Calculate final CBM considering:
 *  - Raw CBM
 *  - Pallet-based CBM
 *  - Weight-based CBM (if company weight is given)
 */
export function calculateFinalWeightCBM(
    job_category_id: any,
    jobItems: any[],
    companyWeight: number
): { totalCBM: number; totalWeight: number } {
    const rawCBM = jobItems.reduce(
        (total, item) => total + (item.volume || 0),
        0
    );
    const totalWeight = jobItems.reduce(
        (total, item) => total + (item.quantity || 0) * (item.weight || 0),
        0
    );
    let finalWeightCBM = rawCBM;
    if (job_category_id == 1) {
        const palletData = jobItems.map((item) => ({
            quantity: item.quantity,
            dimension_width: item.dimension_width,
            dimension_depth: item.dimension_height,
            dimension_height: item.dimension_depth,
        }));

        const PALLET_CBM = 1.728;
        const palletSpacesUsed = calculatePalletSpacesOccupiedFromData(palletData);
        const palletCBM = palletSpacesUsed * PALLET_CBM;
        const finalCBM = Math.max(rawCBM, palletCBM);

        finalWeightCBM = finalCBM;
        // console.log("Company weight:", companyWeight);
        if (totalWeight > 0 && companyWeight) {
            const weightCBM = totalWeight / companyWeight;
            // console.log("Calculating weight-based CBM", weightCBM);
            finalWeightCBM = Math.max(finalCBM, weightCBM);
        }
    }
    // console.log("Final CBM:", finalWeightCBM);
    // console.log("Total Weight:", totalWeight);

    return {
        totalCBM: finalWeightCBM ? finalWeightCBM : 0,
        totalWeight: totalWeight ? totalWeight : 0
    };
}


/**
 * Calculate pallet spaces occupied from job item dimensions & quantities.
 * @param data Array of items with quantity & dimensions (in meters)
 * @returns Number of pallet spaces occupied
 */

export function calculatePalletSpacesOccupiedFromData(data: any[]): number {
    const boxes: Box[] = [];
    let boxId = 1;

    data.forEach((item) => {
        const qty = Number(item.quantity || 0);
        const length = Number(item.dimension_depth || 0) * 100; // convert to cm
        const width = Number(item.dimension_width || 0) * 100;
        const height = Number(item.dimension_height || 0) * 100;

        if (qty > 0 && length > 0 && width > 0 && height > 0) {
            for (let i = 0; i < qty; i++) {
                boxes.push({ id: boxId++, length, width, height });
            }
        }
    });

    if (boxes.length === 0) return 0;

    const placements: Placement[] = [];
    const sortedBoxes = [...boxes].sort(
        (a, b) => b.length * b.width - a.length * a.width
    );

    for (const box of sortedBoxes) {
        const orientations: Orientation[] = [
            { horizontal: box.width, vertical: box.length, rotated: false },
            { horizontal: box.length, vertical: box.width, rotated: true },
        ];

        let placed = false;

        for (const orientation of orientations) {
            if (orientation.horizontal > TRUCK_WIDTH) continue;

            for (let y = 0; y <= TRUCK_LENGTH - orientation.vertical && !placed; y++) {
                for (let x = 0; x <= TRUCK_WIDTH - orientation.horizontal && !placed; x++) {
                    if (!hasConflict({ x, y }, orientation, placements)) {
                        placements.push({ box, position: { x, y }, orientation });
                        placed = true;
                    }
                }
            }

            if (placed) break;
        }
    }

    const occupiedSpaces = new Set<number>();

    placements.forEach((placement) => {
        const touchedSpaces = calculateTouchedSpaces(
            placement.position,
            placement.orientation,
            PALLET_SIZE
        );
        touchedSpaces.forEach((space) => occupiedSpaces.add(space));
        // console.log("Touched spaces:", touchedSpaces);
    });

    // console.log("Occupied spaces:", occupiedSpaces);

    return occupiedSpaces.size;
}

function hasConflict(
    position: { x: number; y: number },
    orientation: Orientation,
    existingPlacements: Placement[]
): boolean {
    for (const placement of existingPlacements) {
        const existing = placement.position;
        const existingOrient = placement.orientation;

        const noOverlap =
            position.x + orientation.horizontal <= existing.x ||
            existing.x + existingOrient.horizontal <= position.x ||
            position.y + orientation.vertical <= existing.y ||
            existing.y + existingOrient.vertical <= position.y;

        if (!noOverlap) return true; // 
    }

    return false;
}


function calculateTouchedSpaces(
    position: { x: number; y: number },
    orientation: Orientation,
    palletSize: number
): Set<number> {
    const touchedSpaces = new Set<number>();

    const startCol = Math.floor(position.x / palletSize);
    const endCol = Math.floor((position.x + orientation.horizontal - 1) / palletSize);
    const startRow = Math.floor(position.y / palletSize);
    const endRow = Math.floor((position.y + orientation.vertical - 1) / palletSize);

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            if (row < 7 && col < 2) {
                const spaceNumber = row * 2 + col + 1;
                touchedSpaces.add(spaceNumber);
            }
        }
    }

    return touchedSpaces;
}
