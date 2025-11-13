import React from "react";
import { InfoIcon } from "./InfoIcon";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tooltip?: string;
};

export const TextField: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  tooltip,
}) => {
  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
        <span>{label}</span>
        {tooltip ? <InfoIcon title={tooltip} tooltipId={`${id}-tip`} /> : null}
      </div>
      <input
        id={id}
        type="text"
        className="input w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-describedby={tooltip ? `${id}-tip` : undefined}
      />
    </label>
  );
};
