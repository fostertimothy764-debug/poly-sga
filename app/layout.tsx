import type { Metadata, Viewport } from "next";
import "./globals.css";
import Shell from "@/components/shell";
import { getGrade } from "@/lib/grade";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Poly SGA — Baltimore Polytechnic Institute",
  description:
    "Student Government Association of Baltimore Polytechnic Institute. Announcements, events, and your voice — all in one place.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f8f7",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [grade, session] = await Promise.all([getGrade(), getSession()]);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Shell grade={grade} officerName={session?.name ?? null} officerRole={session?.role ?? null}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
