"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";

export type RiffleChartState = "closed" | "peek" | "expanded";

export interface RiffleChartProps {
  patientName: string;
  room: string;
  status: string;
  /** When true, shows a pulsing bronze border — chart is ready for the doctor. */
  doorSlot?: boolean;
  state?: RiffleChartState;
  defaultState?: RiffleChartState;
  onStateChange?: (next: RiffleChartState) => void;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

function nextState(current: RiffleChartState): RiffleChartState {
  if (current === "closed") return "peek";
  if (current === "peek") return "expanded";
  return "closed";
}

const doorPulse = {
  boxShadow: [
    "0 0 0 2px #e3b448, 0 0 10px 2px rgba(227, 180, 72, 0.45)",
    "0 0 0 3px #e3b448, 0 0 22px 6px rgba(227, 180, 72, 0.7)",
    "0 0 0 2px #e3b448, 0 0 10px 2px rgba(227, 180, 72, 0.45)",
  ],
};

export function RiffleChart({
  patientName,
  room,
  status,
  doorSlot = false,
  state: controlled,
  defaultState = "closed",
  onStateChange,
  children,
  className = "",
  id,
  "aria-label": ariaLabel,
}: RiffleChartProps) {
  const [uncontrolled, setUncontrolled] = useState<RiffleChartState>(defaultState);
  const current = controlled ?? uncontrolled;

  const setCurrent = useCallback(
    (next: RiffleChartState) => {
      if (controlled === undefined) setUncontrolled(next);
      onStateChange?.(next);
    },
    [controlled, onStateChange],
  );

  const onTabClick = () => setCurrent(nextState(current));

  const tabLabel =
    ariaLabel ??
    `Patient chart for ${patientName}, ${current === "closed" ? "collapsed" : current === "peek" ? "peek" : "expanded"}`;

  const showPanel = current !== "closed";
  const showExpanded = current === "expanded";

  return (
    <motion.div
      layout
      id={id}
      className={`relative max-w-md rounded-t-lg rounded-b-md ${className}`}
      animate={
        doorSlot
          ? doorPulse
          : { boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
      }
      transition={
        doorSlot
          ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.2 }
      }
    >
      <div className="relative overflow-hidden rounded-t-lg rounded-b-md bg-ancient-vellum shadow-md ring-1 ring-bronze-deep/25">
        <div className="relative px-2 pt-2">
          <div
            aria-hidden
            className="absolute inset-x-6 top-3 z-0 h-11 rounded-t-md bg-bronze-deep/65 shadow-sm"
            style={{ transform: "translateY(8px)" }}
          />
          <div
            aria-hidden
            className="absolute inset-x-4 top-2.5 z-0 h-11 rounded-t-md bg-bronze-deep/80 shadow-sm"
            style={{ transform: "translateY(4px)" }}
          />

          <motion.button
            type="button"
            layout
            onClick={onTabClick}
            aria-expanded={showPanel}
            aria-label={tabLabel}
            className="relative z-10 flex min-h-[44px] w-full cursor-pointer touch-manipulation items-center gap-2 rounded-t-lg border border-bronze-deep/40 bg-linear-to-b from-bronze-burnished to-bronze-deep px-4 py-2 text-left text-ancient-vellum shadow-md outline-none select-none focus-visible:ring-2 focus-visible:ring-bronze-glow focus-visible:ring-offset-2 focus-visible:ring-offset-ancient-vellum"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold tracking-wide">
                {patientName}
              </span>
              {current !== "closed" ? (
                <span className="truncate text-xs text-bronze-glow/95">
                  {room} · {status}
                </span>
              ) : (
                <span className="text-xs text-bronze-glow/80">Tap to open chart</span>
              )}
            </span>
            <motion.span
              aria-hidden
              className="shrink-0 text-bronze-glow"
              animate={{ rotate: current === "expanded" ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              ▼
            </motion.span>
          </motion.button>
        </div>

        <motion.div
          initial={false}
          animate={{
            height: showPanel ? "auto" : 0,
            opacity: showPanel ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="overflow-hidden border-t border-bronze-deep/20"
        >
          <div className="space-y-3 px-4 py-3 text-bronze-deep">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="font-medium text-bronze-deep/70">Name</dt>
              <dd className="font-semibold">{patientName}</dd>
              <dt className="font-medium text-bronze-deep/70">Room</dt>
              <dd>{room}</dd>
              <dt className="font-medium text-bronze-deep/70">Status</dt>
              <dd>{status}</dd>
            </dl>

            {showExpanded ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="border-t border-bronze-deep/15 pt-3 text-sm leading-relaxed"
              >
                {children ?? (
                  <p className="text-bronze-deep/80">
                    Expanded clinical detail slots in here — vitals, orders, and
                    notes stack like rifled chart pages.
                  </p>
                )}
              </motion.div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
