"use client";

export type NoticeState = { kind: "ok" | "err" | "warn"; text: string } | null;

export default function Notice({ notice, onClose }: { notice: NoticeState; onClose?: () => void }) {
  if (!notice) return null;
  const cls = notice.kind === "ok" ? "ui-notice--ok" : notice.kind === "warn" ? "ui-notice--warn" : "ui-notice--err";
  return (
    <div className={`ui-notice ${cls} cr-notice`} role="status">
      <span>{notice.text}</span>
      {onClose && (
        <button type="button" className="ui-linkbtn" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
