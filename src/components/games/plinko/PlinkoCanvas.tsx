"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PlinkoRows } from "@/lib/games/plinko";

interface PlinkoCanvasProps {
  rows: PlinkoRows;
  path: number[] | null;
  isDropping: boolean;
  onBallLanded: () => void;
}

const PEG_RADIUS = 4;
const BALL_RADIUS = 7;
const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 500;

const PEG_COLOR = "#557086";
const BALL_COLOR = "#FF9500";

interface PegPosition {
  x: number;
  y: number;
  row: number;
  col: number;
}

/**
 * Calculate all peg positions for the board.
 */
function calculatePegPositions(rows: PlinkoRows): PegPosition[] {
  const pegs: PegPosition[] = [];
  const horizontalSpacing = CANVAS_WIDTH / (rows + 2);
  const verticalSpacing = (CANVAS_HEIGHT - 80) / (rows + 1);
  const startY = 40;

  for (let row = 0; row <= rows; row++) {
    const pegsInRow = row + 3;
    const rowWidth = (pegsInRow - 1) * horizontalSpacing;
    const startX = (CANVAS_WIDTH - rowWidth) / 2;

    for (let col = 0; col < pegsInRow; col++) {
      pegs.push({
        x: startX + col * horizontalSpacing,
        y: startY + row * verticalSpacing,
        row,
        col,
      });
    }
  }
  return pegs;
}

/**
 * Pre-calculate the exact ball positions at each peg row based on the path.
 * The ball navigates through the peg grid: at each row, it goes either
 * left or right of the peg it's approaching.
 *
 * The key insight: In row `r`, there are `r + 3` pegs.
 * The ball enters at position `col` (between pegs `col` and `col+1` or at peg `col`).
 * - If direction is 0 (left): ball goes to the left of the next peg → position stays `col`
 * - If direction is 1 (right): ball goes to the right → position becomes `col + 1`
 *
 * The ball's X position between rows is the midpoint between pegs[col] and pegs[col+1]
 * in the next row.
 */
function calculateBallPath(
  rows: PlinkoRows,
  path: number[]
): { x: number; y: number }[] {
  const horizontalSpacing = CANVAS_WIDTH / (rows + 2);
  const verticalSpacing = (CANVAS_HEIGHT - 80) / (rows + 1);
  const startY = 40;

  const positions: { x: number; y: number }[] = [];

  // Starting position: centered above the first row of pegs
  positions.push({ x: CANVAS_WIDTH / 2, y: 10 });

  // Track the ball's column position (which gap between pegs it's in)
  // In row 0, there are 3 pegs. The ball starts between peg 1 and peg 1 (center).
  let col = 0; // This represents which "slot" the ball is in relative to the row

  // Before row 0: the ball is at the center
  // Row 0 has 3 pegs. The ball approaches the middle peg (index 1).
  // After hitting, it goes left (col stays at 1 in next row context) or right.

  // Actually, let's think of it differently:
  // The ball starts centered, which is between peg 1 and peg 1 of row 0 (at the center peg).
  // At each row, the ball bounces off a peg and goes either left or right.
  //
  // Better model:
  // - Start column index = 1 (middle of row 0's 3 pegs)
  // - At row i, the ball is at peg position `col` of that row
  // - direction 0: ball deflects to the left gap → in next row, it's at peg `col`
  // - direction 1: ball deflects to the right gap → in next row, it's at peg `col + 1`

  col = 1; // Starting at the center peg of row 0 (which has 3 pegs: indices 0, 1, 2)

  for (let i = 0; i < rows; i++) {
    const pegsInRow = i + 3;
    const rowWidth = (pegsInRow - 1) * horizontalSpacing;
    const startX = (CANVAS_WIDTH - rowWidth) / 2;

    // Ball hits peg at (col) in this row
    const pegX = startX + col * horizontalSpacing;
    const pegY = startY + i * verticalSpacing;

    // Position just above the peg (where ball arrives before bouncing)
    positions.push({ x: pegX, y: pegY - PEG_RADIUS - BALL_RADIUS });

    // Determine next column based on direction
    const direction = path[i]; // 0 = left, 1 = right
    if (direction === 1) {
      col = col + 1;
    }
    // If direction is 0, col stays the same for the next row

    // Add an intermediate position showing the bounce direction
    const nextPegsInRow = i + 4; // next row has one more peg
    const nextRowWidth = (nextPegsInRow - 1) * horizontalSpacing;
    const nextStartX = (CANVAS_WIDTH - nextRowWidth) / 2;
    const nextPegX = nextStartX + col * horizontalSpacing;
    const midY = pegY + verticalSpacing * 0.4;

    // Slight offset to show the ball deflecting left or right
    const bounceOffsetX = (direction === 1 ? 1 : -1) * horizontalSpacing * 0.3;
    positions.push({ x: pegX + bounceOffsetX, y: midY });
  }

  // Final position: where the ball lands in the slot area
  // The ball ends up at column `col` in what would be row `rows`
  const finalPegsInRow = rows + 3;
  const finalRowWidth = (finalPegsInRow - 1) * horizontalSpacing;
  const finalStartX = (CANVAS_WIDTH - finalRowWidth) / 2;
  const finalPegX = finalStartX + col * horizontalSpacing;

  // Last row of pegs
  const lastPegY = startY + rows * verticalSpacing;
  positions.push({ x: finalPegX, y: lastPegY - PEG_RADIUS - BALL_RADIUS });

  // Landing position at the bottom
  positions.push({ x: finalPegX, y: CANVAS_HEIGHT - 25 });

  return positions;
}

/**
 * Ease function for smooth animation
 */
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function PlinkoCanvas({ rows, path, isDropping, onBallLanded }: PlinkoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pegsRef = useRef<PegPosition[]>([]);
  const animRef = useRef<number>(0);
  const ballPosRef = useRef<{ x: number; y: number } | null>(null);
  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const landedRef = useRef(false);
  const pathPositionsRef = useRef<{ x: number; y: number }[]>([]);
  const animStartRef = useRef(0);
  const isDroppingRef = useRef(false);

  // Calculate peg positions when rows change
  const pegs = calculatePegPositions(rows);
  pegsRef.current = pegs;

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw pegs
    for (const peg of pegsRef.current) {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = PEG_COLOR;
      ctx.fill();
    }

    // Draw trail
    const trail = trailRef.current;
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].alpha -= 0.025;
      if (trail[i].alpha <= 0) {
        trail.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(trail[i].x, trail[i].y, BALL_RADIUS * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 149, 0, ${trail[i].alpha})`;
      ctx.fill();
    }

    // Draw ball
    const ball = ballPosRef.current;
    if (ball) {
      // Add trail point
      trail.push({ x: ball.x, y: ball.y, alpha: 0.4 });

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = BALL_COLOR;
      ctx.fill();

      // Ball glow
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS + 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 149, 0, 0.2)";
      ctx.fill();
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  // Setup draw loop
  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  // Animate ball along pre-calculated path
  useEffect(() => {
    if (!path || !isDropping) {
      if (!isDropping) {
        isDroppingRef.current = false;
      }
      return;
    }

    let cancelled = false;
    isDroppingRef.current = true;
    landedRef.current = false;
    trailRef.current = [];
    ballPosRef.current = null;

    // Pre-calculate the exact positions the ball should follow
    const positions = calculateBallPath(rows, path);
    pathPositionsRef.current = positions;

    // Total animation duration scales with number of rows
    // More rows = more bounces = longer animation
    const totalDuration = 1800 + rows * 100; // ~2-3.5 seconds depending on rows
    const startTime = performance.now();
    animStartRef.current = startTime;

    function animateBall(now: number) {
      if (cancelled || !isDroppingRef.current) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      if (positions.length < 2) return;

      // Check completion FIRST before any interpolation
      if (progress >= 1) {
        ballPosRef.current = positions[positions.length - 1];
        if (!landedRef.current) {
          landedRef.current = true;
          onBallLanded();
        }
        return;
      }

      // Map progress to position along the path
      const totalSegments = positions.length - 1;
      const exactSegment = progress * totalSegments;
      const segmentIndex = Math.min(
        Math.floor(exactSegment),
        totalSegments - 1
      );
      const segmentProgress = exactSegment - segmentIndex;

      // Apply easing per segment for natural bouncy feel
      const easedProgress = easeInOutCubic(segmentProgress);

      const from = positions[segmentIndex];
      const to = positions[segmentIndex + 1];

      // Guard against undefined positions
      if (!from || !to) {
        ballPosRef.current = positions[positions.length - 1];
        if (!landedRef.current) {
          landedRef.current = true;
          onBallLanded();
        }
        return;
      }

      const x = lerp(from.x, to.x, easedProgress);
      const y = lerp(from.y, to.y, easedProgress);

      ballPosRef.current = { x, y };

      requestAnimationFrame(animateBall);
    }

    requestAnimationFrame(animateBall);

    return () => {
      cancelled = true;
    };
  }, [path, isDropping, rows, onBallLanded]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full max-w-[560px] h-auto"
      style={{ imageRendering: "auto" }}
    />
  );
}
