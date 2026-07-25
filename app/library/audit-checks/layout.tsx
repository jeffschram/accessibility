import type { Metadata } from "next";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("Audit checks"),
  description: "Check templates instantiated onto audit components.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
