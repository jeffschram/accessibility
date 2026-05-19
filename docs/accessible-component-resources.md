# Accessible Component Resources

A short reference list of working examples and implementation resources for complex UI components that can support WCAG AA work. Treat these as starting points: final conformance still depends on implementation details, content, contrast, responsive behavior, keyboard support, focus states, and assistive technology testing.

## W3C/WAI Resources

- [WAI-ARIA Authoring Practices Guide: Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
  - Main APG pattern catalog for accessible widgets and interaction models.
- [WAI APG Example Index](https://www.w3.org/WAI/ARIA/apg/example-index/)
  - Working examples for accordions, comboboxes, dialogs, menus, carousels, tabs, treeviews, sliders, grids, and more.
- [Disclosure Navigation Menu](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)
  - Recommended pattern for most website dropdown navigation. It intentionally avoids the ARIA `menu` role because typical site navigation is not an application menu.
- [WAI Fly-out Menus Tutorial](https://www.w3.org/WAI/tutorials/menus/flyout/)
  - HTML, CSS, and JavaScript examples for fly-out/dropdown navigation, including `aria-expanded`, keyboard behavior, hover behavior, and separate button toggles.
- [APG Carousel Pattern](https://w3c.github.io/wai-website/ARIA/apg/patterns/carousel/)
  - Pattern guidance for carousel semantics, rotation controls, live regions, pause behavior, tab order, and `aria-roledescription`.
- [Auto-Rotating Carousel with Previous/Next Buttons](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-1-prev-next/)
  - Working W3C carousel example with source links for CSS and JavaScript.
- [Auto-Rotating Carousel with Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-2-tablist/)
  - Working W3C carousel example using a tab-style slide picker.
- [Full WAI Carousel Code](https://www.w3.org/WAI/tutorials/carousels/examples/carousel/)
  - Full-code WAI carousel example from the WAI tutorials.

## Production-Oriented References

- [Radix UI Navigation Menu](https://www.radix-ui.com/primitives/docs/components/navigation-menu)
  - React primitive for accessible dropdown site navigation. It follows the APG distinction between website navigation and ARIA application menus.
- [React Aria Menu](https://react-aria.adobe.com/Menu)
  - React components for application-style menus, submenus, command menus, selectable menus, sections, and separators.
- [AcceDe Web Carousels](https://www.accede-web.com/en/guidelines/rich-interface-components/carousels/)
  - Practical carousel guidance based partly on the W3C APG carousel pattern, adapted for modern carousel layouts including multi-slide views.

## Notes

- Prefer semantic HTML first, then add ARIA only where it supplies missing name, role, state, or relationship information.
- For website navigation dropdowns, start with disclosure patterns rather than `role="menu"` unless the component truly behaves like an application menu.
- For carousels, avoid auto-rotation when possible. If auto-rotation exists, provide a visible pause/start control, stop rotation on focus and hover, respect reduced motion, and avoid live-region announcements while rotation is active.
- Automated checks are useful, but they cannot prove WCAG AA conformance for these components. Keyboard testing and screen reader testing are still needed.
