/**
 * Page-structure extraction shared by the scanner and the discovery worker.
 *
 * Serialized into the browser by Playwright, so it must stay self-contained:
 * no imports, no closure over module scope.
 */

/**
 * Runs in the page. Captures the structural facts the judgment-call checks need
 * later: heading outline, landmark map, and DOM-order vs visual-order focus
 * sequence for 2.4.3.
 */
export function extractStructure() {
  const landmarkRoles = {
    header: "banner",
    nav: "navigation",
    main: "main",
    aside: "complementary",
    footer: "contentinfo",
    form: "form",
    section: "region",
  };

  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role=heading]")].map(
    (element) => ({
      level: Number(element.getAttribute("aria-level")) || Number(element.tagName[1]) || null,
      text: (element.textContent ?? "").trim().slice(0, 200),
      hidden: element.getAttribute("aria-hidden") === "true",
    }),
  );

  const landmarks = [...document.querySelectorAll("header,nav,main,aside,footer,form,section,[role]")]
    .map((element) => {
      const role =
        element.getAttribute("role") ?? landmarkRoles[element.tagName.toLowerCase()] ?? null;
      if (!role || !Object.values(landmarkRoles).includes(role)) {
        return null;
      }
      return {
        role,
        label:
          element.getAttribute("aria-label") ??
          (element.getAttribute("aria-labelledby")
            ? (document.getElementById(element.getAttribute("aria-labelledby"))?.textContent ?? "").trim()
            : null),
      };
    })
    .filter(Boolean);

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type=hidden])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
    "[contenteditable='true']",
  ].join(",");

  const focusable = [...document.querySelectorAll(focusableSelector)]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        (rect.width > 0 || rect.height > 0)
      );
    })
    .map((element, index) => {
      const rect = element.getBoundingClientRect();
      return {
        domOrder: index,
        tag: element.tagName.toLowerCase(),
        tabindex: element.getAttribute("tabindex"),
        name:
          element.getAttribute("aria-label") ??
          (element.textContent ?? "").trim().slice(0, 80) ??
          null,
        top: Math.round(rect.top + window.scrollY),
        left: Math.round(rect.left + window.scrollX),
      };
    });

  const visualOrder = [...focusable]
    .sort((first, second) => first.top - second.top || first.left - second.left)
    .map((item) => item.domOrder);

  return {
    documentTitle: document.title,
    lang: document.documentElement.lang || null,
    headings,
    landmarks,
    focusable,
    // Index into focusable, sorted top-to-bottom then left-to-right. If this
    // differs from 0..n-1 the DOM focus order diverges from the visual order.
    visualOrder,
    focusOrderMatchesVisualOrder: visualOrder.every((value, index) => value === index),
  };
}
