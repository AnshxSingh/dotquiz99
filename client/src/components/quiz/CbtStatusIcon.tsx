import React from "react";

export type CbtStatus = 
  | "not_visited"
  | "not_answered"
  | "answered"
  | "marked_for_review"
  | "answered_marked_for_review";

interface CbtStatusIconProps {
  status: CbtStatus;
  number?: number | string;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

export function CbtStatusIcon({
  status,
  number,
  isActive = false,
  size = "md",
  onClick,
  className = "",
}: CbtStatusIconProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm font-semibold",
    lg: "w-12 h-12 text-base font-bold",
  }[size];

  // Colors and shapes matching real NTA / TCS iON CBT exam palette
  let shapeClass = "";
  let bgClass = "";
  let borderClass = isActive ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-yellow-400/20" : "";
  let showGreenBadge = false;

  switch (status) {
    case "answered":
      // Green Pointed Pentagon (Answered)
      bgClass = "bg-green-600 hover:bg-green-500 text-white";
      shapeClass = "rounded-t-md rounded-b-[45%]";
      break;
    case "not_answered":
      // Orange/Red Inverted trapezoid (Not Answered)
      bgClass = "bg-orange-600 hover:bg-orange-500 text-white";
      shapeClass = "rounded-b-md rounded-t-[45%]";
      break;
    case "marked_for_review":
      // Purple Circle (Marked for Review)
      bgClass = "bg-purple-600 hover:bg-purple-500 text-white";
      shapeClass = "rounded-full";
      break;
    case "answered_marked_for_review":
      // Purple Circle with Green square badge (Answered & Marked for Review)
      bgClass = "bg-purple-600 hover:bg-purple-500 text-white";
      shapeClass = "rounded-full";
      showGreenBadge = true;
      break;
    case "not_visited":
    default:
      // Grey Box (Not Visited)
      bgClass = "bg-slate-700/80 hover:bg-slate-600 border border-slate-500/50 text-slate-200";
      shapeClass = "rounded-md";
      break;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center transition-all duration-150 select-none ${sizeClasses} ${bgClass} ${shapeClass} ${borderClass} ${className}`}
      style={{
        boxShadow: isActive ? "0 0 12px rgba(250, 204, 21, 0.6)" : undefined,
      }}
    >
      <span>{number}</span>
      {showGreenBadge && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-slate-900 rounded-xs shadow-sm flex items-center justify-center"
          title="Answered & Marked for Review"
        >
          <span className="w-1 h-1 bg-white rounded-full" />
        </span>
      )}
    </button>
  );
}

export function CbtLegendItem({
  status,
  label,
  count,
}: {
  status: CbtStatus;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <div className="relative shrink-0">
        <CbtStatusIcon status={status} size="sm" number={count !== undefined ? count : ""} />
      </div>
      <span className="leading-tight select-none">
        {label}
        {count !== undefined && <span className="font-semibold text-white ml-1">({count})</span>}
      </span>
    </div>
  );
}
