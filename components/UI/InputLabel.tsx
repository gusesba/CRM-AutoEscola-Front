import React from "react";
import Label, { LabelProps } from "./Label";
import Input, { InputProps } from "./Input";

type InputLabelProps = InputProps &
    LabelProps & {
        errorMesage?: string;
    };

export default function InputLabel({
    id,
    type,
    placeholder,
    text,
    register,
    rules,
    errorMesage,
}: InputLabelProps) {
    return (
        <div>
            <Label htmlFor={id} text={text} />
            <Input
                id={id}
                type={type}
                placeholder={placeholder}
                register={register}
                rules={rules}
                appearance={errorMesage ? "error" : "primary"}
            />
            {errorMesage && <p className="text-error text-sm mt-1">{errorMesage}</p>}
        </div>
    );
}
