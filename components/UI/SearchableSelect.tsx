"use client";
import React, { useEffect, useRef, useState } from "react";
import { RegisterOptions, UseFormRegister, Path } from "react-hook-form";

interface Option {
    label: string;
    value: any;
}

interface SearchableSelectProps<T extends Record<string, any>> {
    id: Path<T>;
    label?: string;
    options: Option[];
    register: UseFormRegister<T>;
    rules?: RegisterOptions<T>;
    errorMessage?: string;
    defaultValue?: string;
}

export default function SearchableSelect<T extends Record<string, any>>({
    id,
    label,
    options,
    register,
    rules,
    errorMessage,
    defaultValue,
}: SearchableSelectProps<T>) {
    const defaultOption = options.find((opt) => opt.value === defaultValue) || null;
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState(defaultOption?.label || "");
    const [selected, setSelected] = useState<Option | null>(defaultOption);
    const [filtered, setFiltered] = useState<Option[]>(options);

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setFiltered(
            options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase())),
        );
    }, [search, options]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (opt: Option) => {
        setSelected(opt);
        setSearch(opt.label);
        setIsOpen(false);
        const fakeEvent = {
            target: {
                name: id,
                value: opt.value,
            },
        };
        register(id, rules).onChange(fakeEvent as any);
    };

    return (
        <div className="flex flex-col gap-1 w-full" ref={ref}>
            {label && (
                <label htmlFor={id} className="font-medium text-sm text-gray-700">
                    {label}
                </label>
            )}

            <div className="relative w-full">
                <input
                    type="text"
                    id={id}
                    value={search}
                    onFocus={() => setIsOpen(true)}
                    autoComplete="off"
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                    placeholder="Digite para buscar..."
                    className={`w-full px-4 py-2 border rounded-xl transition-all outline-none ${
                        errorMessage
                            ? "border-red-500 focus:ring-2 focus:ring-red-300"
                            : "border-gray-300 focus:ring-2 focus:ring-primary"
                    }`}
                />
                {isOpen && (
                    <div className="absolute z-20 w-full bg-gray-50 border border-gray-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto transition-all">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-500">Nenhum resultado</div>
                        ) : (
                            filtered.map((opt) => (
                                <div
                                    key={opt.value}
                                    className="px-4 py-2 text-sm hover:bg-primary hover:text-white cursor-pointer transition-colors"
                                    onClick={() => handleSelect(opt)}
                                >
                                    {opt.label}
                                </div>
                            ))
                        )}
                    </div>
                )}
                {/* Campo oculto para integração com react-hook-form */}
                <input type="hidden" {...register(id, rules)} value={selected?.value || ""} />
            </div>

            {errorMessage && <span className="text-sm text-red-500 mt-1">{errorMessage}</span>}
        </div>
    );
}
