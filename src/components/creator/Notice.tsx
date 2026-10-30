"use client";

export type NoticeState = { kind: "ok" | "err" | "warn"; text: string } | null;

export default function Notice({ notice, onClose }: { notice: NoticeState; onClose?: () => void }) {
  if (!notice) return null;
  const cls = notice.kind === "ok" ? "ads-notice--ok" : notice.kind === "warn" ? "ads-notice--warn" : "ads-notice--err";
  return (
    <div className={`ads-notice ${cls} cr-notice`} role="status">
      <span>{notice.text}</span>
      {onClose && (
        <button type="button" className="ads-linkbtn" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
