const FLAG_LABELS: Record<string, string> = {
  pause: "Pause",
  tempo: "Tempo",
  close_grip: "Close Grip",
  wide_grip: "Wide Grip",
  deficit: "Deficit",
  sumo: "Sumo",
  overhead: "Overhead",
  incline: "Incline",
  decline: "Decline",
  seated: "Seated",
  standing: "Standing",
  single_leg: "Single Leg",
  single_arm: "Single Arm",
  alternating: "Alt",
  with_dumbbell: "DB",
  with_kettlebell: "KB",
  with_band: "Band",
  with_cable: "Cable",
  with_plate: "Plate",
  with_sled: "Sled",
};

export function VariantBadge({ flag }: { flag: string }) {
  const label = FLAG_LABELS[flag] || flag.replace(/_/g, " ");
  return (
    <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]">
      {label}
    </span>
  );
}

export function VariantBadges({ flags }: { flags: string[] }) {
  if (!flags.length) return null;
  return (
    <span className="inline-flex gap-1 ml-1">
      {flags.map((f) => (
        <VariantBadge key={f} flag={f} />
      ))}
    </span>
  );
}
