"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, router, user]);

  return (
    <>
      <Header />
      <Sidebar />
      <main className="bg-gray-100 w-[calc(100%-16rem)] h-[calc(100%-3.5rem)] fixed top-14 left-64 p-8 flex overflow-y-auto">
        {children}
      </main>
    </>
  );
}
