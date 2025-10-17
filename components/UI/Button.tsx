import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    size?: "full" | "md";
    variant?: "primary" | "error";
};

export default function Button({
    size = "full",
    variant = "primary",
    className = "",
    children,
    disabled,
    ...props
}: ButtonProps) {
    const sizeStyle = size === "full" ? "w-full" : "";

    const baseStyle = "text-sm px-4 py-2 rounded transition duration-300";
    const disabledStyle =
        variant == "error"
            ? "bg-error-disabled text-white cursor-not-allowed"
            : "bg-terciary text-white cursor-not-allowed";

    const variantStyle = (() => {
        if (disabled) return disabledStyle;

        switch (variant) {
            case "error":
                return "bg-error text-white hover:bg-error-light cursor-pointer";
            case "primary":
            default:
                return "bg-primary text-white hover:bg-secondary cursor-pointer";
        }
    })();

    const finalClassName = `${sizeStyle} ${baseStyle} ${variantStyle} ${className}`.trim();

    return (
        <button className={finalClassName} disabled={disabled} {...props}>
            {children}
        </button>
    );
}
