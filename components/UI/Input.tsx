import React from "react";
import { RegisterOptions, UseFormRegister } from "react-hook-form";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    register: UseFormRegister<any>;
    rules?: RegisterOptions;
    appearance?: "primary" | "error";
};

export default function Input({
    placeholder = "",
    type = "",
    id,
    register,
    rules,
    appearance,
}: InputProps) {
    return (
        <input
            {...register(id || "", rules)}
            id={id}
            type={type || "text"}
            placeholder={placeholder || ""}
            className={
                appearance === "error"
                    ? "w-full px-4 py-2 border border-gray-300 rounded-xl outline-none ring-1 focus:ring-2 ring-error"
                    : "w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            }
        />
    );
}
