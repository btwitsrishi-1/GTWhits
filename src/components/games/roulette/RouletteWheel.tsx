"use client";

import { useRef, useEffect, useCallback } from "react";
import { WHEEL_ORDER, getNumberColor } from "@/lib/games/roulette";

interface RouletteWheelProps {
  winningNumber: number | null;
  isSpinning: boolean;
  onSpinComplete: () => void;
}

const SEGMENT_COUNT = 37;
const SEGMENT_ANGLE = (2 * Math.PI) / SEGMENT_COUNT;

export default function RouletteWheel({
  winningNumber,
  isSpinning,
  onSpinComplete,
}: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const ballAngleRef = useRef(0);
  const ballRadiusRef = useRef(0);

  const drawWheel = useCallback(
    (ctx: CanvasRenderingContext2D, size: number, rotation: number, ballAngle: number, ballRadius: number) => {
      const cx = size / 2;
      const cy = size / 2;
      const outerR = size / 2 - 10;
      const innerR = outerR * 0.65;
      const textR = (outerR + innerR) / 2;

      ctx.clearRect(0, 0, size, size);

      // Outer ring shadow
      ctx.beginPath();
      ctx.arc(cx, cy, outerR + 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#0a1a24";
      ctx.fill();

      // Draw segments
      for (let i = 0; i < SEGMENT_COUNT; i++) {
        const startAngle = rotation + i * SEGMENT_ANGLE - Math.PI / 2;
        const endAngle = startAngle + SEGMENT_ANGLE;
        const num = WHEEL_ORDER[i];
        const color = getNumberColor(num);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle =
          color === "green" ? "#00A651" : color === "red" ? "#C62828" : "#212121";
        ctx.fill();

        ctx.strokeStyle = "#B8860B";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Number text
        const midAngle = startAngle + SEGMENT_ANGLE / 2;
        ctx.save();
        ctx.translate(
          cx + Math.cos(midAngle) * textR,
          cy + Math.sin(midAngle) * textR
        );
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.floor(size / 30)}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(num), 0, 0);
        ctx.restore();
      }

      // Inner circle
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
      ctx.fillStyle = "#1A2C38";
      ctx.fill();
      ctx.strokeStyle = "#B8860B";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center decoration
      ctx.beginPath();
      ctx.arc(cx, cy, innerR * 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = "#213743";
      ctx.fill();
      ctx.strokeStyle = "#B8860B";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ball
      if (ballRadius > 0) {
        const ballX = cx + Math.cos(ballAngle) * ballRadius;
        const ballY = cy + Math.sin(ballAngle) * ballRadius;

        ctx.beginPath();
        ctx.arc(ballX, ballY, size / 50, 0, 2 * Math.PI);
        ctx.fillStyle = "#E0E0E0";
        ctx.fill();
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ball shine
        ctx.beginPath();
        ctx.arc(ballX - 1, ballY - 1, size / 100, 0, 2 * Math.PI);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }

      // Fixed marker at top
      ctx.beginPath();
      ctx.moveTo(cx, 5);
      ctx.lineTo(cx - 8, 20);
      ctx.lineTo(cx + 8, 20);
      ctx.closePath();
      ctx.fillStyle = "#B8860B";
      ctx.fill();
    },
    []
  );

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    drawWheel(ctx, size, rotationRef.current, 0, 0);
  }, [drawWheel]);

  // Spin animation
  useEffect(() => {
    if (!isSpinning || winningNumber === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const outerR = size / 2 - 10;

    // Find the target segment index in WHEEL_ORDER
    const targetIndex = WHEEL_ORDER.indexOf(winningNumber);
    const targetAngle = -targetIndex * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;

    // Spin at least 5 full rotations + land on target
    const totalRotation = 5 * 2 * Math.PI + (targetAngle - rotationRef.current);
    const startRotation = rotationRef.current;
    const duration = 4000; // 4 seconds
    const startTime = performance.now();

    // Ball starts from outer, spirals inward
    const ballStartRadius = outerR - 5;
    const ballEndRadius = outerR * 0.78;

    function animate(time: number) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for wheel
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + totalRotation * eased;
      rotationRef.current = currentRotation;

      // Ball moves opposite direction and spirals in
      const ballProgress = Math.min(elapsed / (duration * 0.85), 1);
      const ballEased = 1 - Math.pow(1 - ballProgress, 2);
      const currentBallAngle = -currentRotation * 1.3 - Math.PI / 2;
      const currentBallRadius =
        ballStartRadius - (ballStartRadius - ballEndRadius) * ballEased;

      ballAngleRef.current = currentBallAngle;
      ballRadiusRef.current = currentBallRadius;

      drawWheel(ctx!, size, currentRotation, currentBallAngle, currentBallRadius);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Snap ball to final position
        const finalAngle = currentRotation + targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - Math.PI / 2;
        drawWheel(ctx!, size, currentRotation, finalAngle, ballEndRadius);
        onSpinComplete();
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpinning, winningNumber, drawWheel, onSpinComplete]);

  return (
    <canvas
      ref={canvasRef}
      width={340}
      height={340}
      className="w-[340px] h-[340px] max-w-full"
    />
  );
}
