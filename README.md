# Accessibility

Accessibility audit tracker.

This project is planned as a React/Next.js webapp using shadcn/ui for the component system and Convex for application data. It establishes a structured accessibility audit workflow, tracks audit progress, acknowledges the limits of automated checks, and guides manual WCAG testing with references and explanations so users can learn why each task matters.

## Planning

- [Development Spec](docs/dev-spec.md)
- [User Walkthrough](docs/user-walkthrough.md)
- [Audit Process](docs/audit-process.md)
- [WCAG 2.2 Reference](docs/wcag-2.2-reference.md)
- [Report Template](docs/report-template.md)
- [Automation Roadmap](docs/automation-roadmap.md)
- [Accessible Component Resources](docs/accessible-component-resources.md)

Keep project documentation in this `docs/` folder. The workspace root has a small pointer only, so docs do not drift between two locations.

## Development

```bash
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run lint
npm run build
npm run convex:dev
npm run scan:url -- http://localhost:3000
```
