import type { Metadata } from "next";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("Keyboard audit workspace"),
  description: "Modality-based manual test scripts for keyboard and assistive technology passes.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
