import type { Metadata } from "next";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "AutoCare+",
  description: "Vehicle maintenance and service tracking for owners.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-grayLight text-textPrimary">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
