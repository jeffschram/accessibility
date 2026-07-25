import type { Metadata } from "next";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("Component types"),
  description: "The reusable component library and its check templates.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
