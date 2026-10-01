export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="state-card" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-card state-error" role="alert">
      <p>{message}</p>
      {onRetry ? <button className="btn-primary" type="button" onClick={onRetry}>Try again</button> : null}
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="state-card">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

const statusLabel: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  draft: "Draft",
  completed: "Completed",
  ongoing: "Ongoing",
  Ongoing: "Ongoing",
  Completed: "Completed",
  Pending: "Pending",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = status.toLowerCase() === "ongoing" ? "active" : status.toLowerCase();
  return <span className={`badge badge-${tone}`}>{statusLabel[status] ?? status}</span>;
}
