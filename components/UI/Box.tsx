import React from "react";

export default function Box({ children }: React.PropsWithChildren) {
    return (
        <div className="p-6 font-[var(--font-sans)] text-[var(--color-foreground)] bg-[var(--color-background)]">
            <div className="rounded-2xl shadow-[0_4px_24px_0_rgba(0,0,0,0.3)] p-4 w-full overflow-visible bg-white dark:bg-[var(--color-background)]">
                {children}
            </div>
        </div>
    );
}
