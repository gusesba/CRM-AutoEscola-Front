"use client";

import { Suspense } from "react";
import NovaVenda from "./NovaVenda";

export default function NovaVendaPage() {
  return (
    <Suspense>
      <NovaVenda />
    </Suspense>
  );
}
