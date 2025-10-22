import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <Sidebar />
      <main className="bg-gray-100 w-[calc(100%-16rem)] h-[calc(100%-3.5rem)] fixed top-14 left-64 p-8 flex items-center justify-center">
        {children}
      </main>
    </>
  );
}
