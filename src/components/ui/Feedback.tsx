export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="state-card" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="page-loader" role="status">
      <img className="page-loader-mark" src="/images/ministry%20of%20env.svg" alt="" />
      <span className="page-loader-ring" aria-hidden="true" />
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
