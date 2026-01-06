import "./globals.css";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Auto Escola Silva</title>
      </head>
      <body className={`antialiased`}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
