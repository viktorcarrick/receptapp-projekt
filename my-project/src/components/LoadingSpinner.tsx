type LoadingSpinnerProps = {
  label: string;
  className?: string;
};

export default function LoadingSpinner({ label, className = "" }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 py-8 text-app-muted ${className}`}
    >
      <span className="app-loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
