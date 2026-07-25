import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

/**
 * The last item is always treated as the current page: it is rendered as text
 * rather than a link and carries aria-current, so screen reader users are told
 * where they are instead of being offered a link to the page they are on.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-slate-600">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li className="flex min-w-0 items-center gap-1" key={`${item.label}-${index}`}>
              {index > 0 ? (
                <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              ) : null}
              {item.href && !isCurrent ? (
                <Link
                  className="truncate font-medium text-sky-700 hover:text-sky-900"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className="truncate font-medium text-slate-950"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
