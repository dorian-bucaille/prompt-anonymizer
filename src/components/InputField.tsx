import React from "react";
import { InfoIcon } from "./InfoIcon";

type Props = {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  tooltip?: string;
  disabled?: boolean;
};

export const InputField: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  tooltip,
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const numeric = rawValue === "" ? 0 : parseFloat(rawValue);
    onChange(Number.isFinite(numeric) ? numeric : 0);
  };

  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
        <span>{label}</span>
        {tooltip ? <InfoIcon title={tooltip} tooltipId={`${id}-tip`} disabled={disabled} /> : null}
      </div>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className="input w-full"
          value={Number.isFinite(value) ? value : 0}
          onChange={handleChange}
          min={min}
          max={max}
          step={step ?? 1}
          aria-describedby={tooltip && !disabled ? `${id}-tip` : undefined}
          style={suffix ? { paddingRight: "7rem" } : undefined}
          disabled={disabled}
        />
        {suffix ? (
          <span
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-gray-500 dark:text-gray-400"
            aria-hidden="true"
          >
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
};
