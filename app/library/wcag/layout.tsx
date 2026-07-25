import type { Metadata } from "next";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("WCAG criteria"),
  description: "WCAG 2.2 criteria reference with plain-language summaries.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
