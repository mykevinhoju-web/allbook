/** Approximate half-width of a timeline label as % of the bar (w-24 on ~260px bar). */
const LABEL_HALF_WIDTH_PERCENT = 18;
/** Bookings within this % gap share one vertical stack. */
const CLUSTER_GAP_PERCENT = 6;
const ROW_HEIGHT_REM = 2.35;

export interface TimelineMarkerInput {
  id: string;
  percent: number;
}

export interface TimelineLabelLayout {
  id: string;
  percent: number;
  labelLeft: number;
  row: number;
}

function clampPercent(value: number, halfWidth: number): number {
  return Math.max(halfWidth, Math.min(100 - halfWidth, value));
}

function intervalsOverlap(
  aCenter: number,
  aHalf: number,
  bCenter: number,
  bHalf: number,
): boolean {
  return Math.abs(aCenter - bCenter) < aHalf + bHalf;
}

function rowRangesOverlap(
  aStart: number,
  aCount: number,
  bStart: number,
  bCount: number,
): boolean {
  return aStart < bStart + bCount && aStart + aCount > bStart;
}

interface Cluster {
  items: TimelineMarkerInput[];
  centerPercent: number;
}

function clusterMarkers(markers: TimelineMarkerInput[]): Cluster[] {
  const sorted = [...markers].sort((a, b) => a.percent - b.percent);
  const clusters: Cluster[] = [];

  for (const marker of sorted) {
    const last = clusters[clusters.length - 1];
    const lastItem = last?.items[last.items.length - 1];

    if (lastItem && marker.percent - lastItem.percent < CLUSTER_GAP_PERCENT) {
      last.items.push(marker);
      last.centerPercent =
        last.items.reduce((sum, item) => sum + item.percent, 0) /
        last.items.length;
    } else {
      clusters.push({
        items: [marker],
        centerPercent: marker.percent,
      });
    }
  }

  return clusters;
}

/** Place labels so nearby dots share a vertical stack and clusters do not overlap. */
export function layoutTimelineLabels(
  markers: TimelineMarkerInput[],
): TimelineLabelLayout[] {
  if (markers.length === 0) return [];

  const halfWidth = LABEL_HALF_WIDTH_PERCENT;
  const clusters = clusterMarkers(markers);
  const placedClusters: {
    centerPercent: number;
    startRow: number;
    rowCount: number;
  }[] = [];

  const layouts: TimelineLabelLayout[] = [];

  for (const cluster of clusters) {
    const rowCount = cluster.items.length;
    const labelLeft = clampPercent(cluster.centerPercent, halfWidth);

    let startRow = 0;
    while (
      placedClusters.some(
        (placed) =>
          rowRangesOverlap(startRow, rowCount, placed.startRow, placed.rowCount) &&
          intervalsOverlap(
            labelLeft,
            halfWidth,
            placed.centerPercent,
            halfWidth,
          ),
      )
    ) {
      startRow += 1;
    }

    cluster.items.forEach((item, index) => {
      layouts.push({
        id: item.id,
        percent: item.percent,
        labelLeft,
        row: startRow + index,
      });
    });

    placedClusters.push({
      centerPercent: labelLeft,
      startRow,
      rowCount,
    });
  }

  return layouts;
}

export function timelineLabelAreaHeightRem(layouts: TimelineLabelLayout[]): number {
  if (layouts.length === 0) return 2.5;
  const maxRow = Math.max(...layouts.map((layout) => layout.row));
  return (maxRow + 1) * ROW_HEIGHT_REM;
}

export const TIMELINE_LABEL_ROW_HEIGHT_REM = ROW_HEIGHT_REM;
