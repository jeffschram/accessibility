import type { Metadata } from "next";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("WCAG and task guidance"),
  description: "Guidance topics and references for manual accessibility testing.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
