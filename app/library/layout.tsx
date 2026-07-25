import type { Metadata } from "next";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("Library"),
  description: "Reusable WCAG criteria, component types, and check templates.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
