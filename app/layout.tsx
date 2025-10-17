import "./globals.css";

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
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
