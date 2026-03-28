"use client";

interface GroupOption {
  id: number;
  groupLabel: string;
  exerciseNames: string[];
}

interface MoveExerciseModalProps {
  open: boolean;
  exerciseName: string;
  currentGroupLabel: string;
  groups: GroupOption[];
  onMove: (targetGroupLabel: string) => Promise<void>;
  onClose: () => void;
  moving: boolean;
}

export function MoveExerciseModal({
  open,
  exerciseName,
  currentGroupLabel,
  groups,
  onMove,
  onClose,
  moving,
}: MoveExerciseModalProps) {
  if (!open) return null;

  const otherGroups = groups.filter((g) => g.groupLabel !== currentGroupLabel);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* Sheet */}
      <div className="relative bg-[var(--bg-card)] rounded-t-3xl p-6 pb-10">
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <p className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wide">Move exercise</p>
        <h2 className="text-lg font-bold capitalize mb-1">{exerciseName}</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-5">
          Currently in Group {currentGroupLabel}
        </p>

        <div className={`space-y-1 ${moving ? "opacity-50 pointer-events-none" : ""}`}>
          {/* New Group option */}
          <button
            onClick={() => onMove("new")}
            className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-[var(--bg-secondary)] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue)]/15 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--accent-blue)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">New Group</p>
              <p className="text-xs text-[var(--text-secondary)]">Move to its own group</p>
            </div>
          </button>

          {otherGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => onMove(g.groupLabel)}
              className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-[var(--bg-secondary)] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-[var(--text-secondary)]">{g.groupLabel}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Group {g.groupLabel}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {g.exerciseNames.join(", ")}
                </p>
              </div>
            </button>
          ))}

          {otherGroups.length === 0 && (
            <p className="text-xs text-[var(--text-secondary)] text-center py-3">
              No other groups — move to a new group above
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
