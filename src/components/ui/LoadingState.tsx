import { Wrench } from "lucide-react";

type LoadingStateMode = "fullPage" | "container" | "inline";

interface LoadingStateProps {
  mode?: LoadingStateMode;
  label?: string;
  className?: string;
}

const modeClassMap: Record<LoadingStateMode, string> = {
  fullPage: "min-h-[60vh] w-full",
  container: "min-h-[180px] w-full rounded-xl border border-grayBorder bg-containerBg",
  inline: "min-h-0 w-auto",
};

const iconClassMap: Record<LoadingStateMode, string> = {
  fullPage: "h-10 w-10",
  container: "h-8 w-8",
  inline: "h-4 w-4",
};

export function LoadingState({
  mode = "container",
  label = "Loading...",
  className = "",
}: LoadingStateProps) {
  const isInline = mode === "inline";

  return (
    <div
      className={`flex items-center justify-center ${modeClassMap[mode]} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={`flex ${isInline ? "flex-row items-center gap-2" : "flex-col items-center gap-3"}`}>
        <div className="rounded-full bg-redPrimary/12 p-2.5">
          <Wrench
            className={`${iconClassMap[mode]} text-redPrimary autocare-wrench-spin`}
          />
        </div>
        <span className={`text-textSecondary ${isInline ? "text-xs" : "text-sm"}`}>{label}</span>
      </div>
    </div>
  );
}