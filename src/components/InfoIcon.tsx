import React from "react";
import { useTranslation } from "react-i18next";

type ButtonElement = React.ElementRef<"button">;
type SpanElement = React.ElementRef<"span">;
type OutsidePointerEvent = globalThis.MouseEvent | globalThis.TouchEvent;

type InfoIconProps = {
  title?: string;
  tooltipId?: string;
  disabled?: boolean;
};

export const InfoIcon: React.FC<InfoIconProps> = ({ title, tooltipId, disabled = false }) => {
  const { t } = useTranslation();
  const generatedId = React.useId();
  const id = tooltipId ?? generatedId;
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<SpanElement | null>(null);
  const isPointerDownRef = React.useRef(false);

  React.useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (event: OutsidePointerEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (
        event.target instanceof globalThis.Node &&
        containerRef.current.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open]);

  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  const handleContainerPointerEnter = (
    event: React.PointerEvent<SpanElement>,
  ) => {
    if (disabled) {
      return;
    }
    if (event.pointerType === "mouse" && !isPointerDownRef.current) {
      setOpen(true);
    }
  };

  const handleContainerPointerLeave = (
    event: React.PointerEvent<SpanElement>,
  ) => {
    if (disabled) {
      return;
    }
    if (event.pointerType === "mouse" && !isPointerDownRef.current) {
      close();
    }
  };

  const handleClick = (event: React.MouseEvent<ButtonElement>) => {
    if (disabled) {
      return;
    }
    event.preventDefault();
    setOpen((previous) => !previous);
  };

  const handlePointerDown = (event: React.PointerEvent<ButtonElement>) => {
    if (disabled) {
      return;
    }
    isPointerDownRef.current = event.pointerType !== "mouse";
  };

  const handlePointerUp = () => {
    if (disabled) {
      return;
    }
    isPointerDownRef.current = false;
  };

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onPointerEnter={handleContainerPointerEnter}
      onPointerLeave={handleContainerPointerLeave}
    >
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/10 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-600/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-300"
        title={title}
        aria-label={t("accessibility.info")}
        aria-describedby={disabled ? undefined : id}
        aria-expanded={disabled ? false : open}
        aria-hidden={disabled || undefined}
        disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        onFocus={() => setOpen(true)}
        onBlur={close}
      >
        ?
      </button>
      <div
        id={id}
        role="tooltip"
        className={`absolute left-1/2 z-10 mt-2 w-48 max-w-xs -translate-x-1/2 rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg transition-opacity duration-150 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={disabled || !open}
      >
        {title}
      </div>
    </span>
  );
};
