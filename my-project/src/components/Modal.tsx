import type { AnimationEvent, ReactNode } from "react";

type ModalProps = {
  labelledBy: string;
  children: ReactNode;
  className: string;
  isClosing?: boolean;
  onCloseComplete?: () => void;
};

export default function Modal({
  labelledBy,
  children,
  className,
  isClosing = false,
  onCloseComplete,
}: ModalProps) {
  const handleAnimationEnd = (event: AnimationEvent<HTMLElement>) => {
    if (event.target === event.currentTarget && isClosing) {
      onCloseComplete?.();
    }
  };

  return (
    <div className={`app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${isClosing ? "is-closing" : ""}`}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onAnimationEnd={handleAnimationEnd}
        className={`app-modal-panel ${isClosing ? "is-closing" : ""} ${className}`}
      >
        {children}
      </section>
    </div>
  );
}
