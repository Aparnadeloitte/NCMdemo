import type { StateProjectStatus } from "@/types/domain";

const labels = ["State Admin", "Technical Review", "MoEFCC Review", "Approval"] as const;

export function WorkflowTracker({ status }: { status: StateProjectStatus }) {
  const steps = labels.map((label) => {
    if (label === "State Admin") {
      return { label, detail: status === "draft" ? "Pending" : "Submitted", done: status !== "draft" };
    }
    if (label === "Approval") {
      if (status === "approved") return { label, detail: "Approved", done: true };
      if (status === "rejected") return { label, detail: "Rejected", done: false, rejected: true };
      return { label, detail: "Pending", done: false };
    }
    return { label, detail: "Pending", done: false };
  });

  return (
    <ol className="workflow" aria-label="Approval workflow">
      {steps.map((item) => (
        <li key={item.label} className={`workflow-step${item.done ? " done" : ""}${"rejected" in item && item.rejected ? " rejected" : ""}`}>
          <span className="workflow-dot" aria-hidden="true" />
          <span>
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}
