import React from "react";
import { RegisterOptions, UseFormRegister } from "react-hook-form";

type Option = {
    label: string;
    value: string;
};

interface SelectLabelProps {
    id: string;
    label: string;
    options: Option[];
    register: UseFormRegister<any>;
    rules?: RegisterOptions;
    errorMessage?: string;
}

export default function SelectLabel({
    id,
    label,
    options,
    register,
    rules,
    errorMessage,
}: SelectLabelProps) {
    return (
        <div className="flex flex-col">
            <label htmlFor={id} className="mb-1 font-medium">
                {label}
            </label>
            <select
                id={id}
                {...register(id, rules)}
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
                    errorMessage
                        ? "border-gray-300 ring-1 ring-error"
                        : "border-gray-300 focus:ring-primary"
                }`}
            >
                <option value=""></option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {errorMessage && <span className="text-sm text-red-500 mt-1">{errorMessage}</span>}
        </div>
    );
}
