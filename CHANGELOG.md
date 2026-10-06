# SabiNote Frontend Changelog

All notable changes to the SabiNote web application are documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.1] - 2026-10-06
### Added
- **Global Release Badge & Footer (`ReleaseBadge`, `ReleaseFooter`)**:
  - Live version indicator with pulsing green status dot displaying `v2.0.1 • NERDC-2025.1`.
  - Micro-interactions designed per Emil Kowalski's philosophy (`emil-design-eng`): `:active` `scale(0.97)` with `160ms ease-out`.
  - Integrated into:
    - Landing page footer (`LandingPage.tsx`)
    - Authenticated desktop sidebar footer (`layout.tsx`)
    - Authenticated page layout bottom row (`layout.tsx`)
    - Settings page platform specification card (`settings/page.tsx`)
    - Auth login and register screens (`login/page.tsx`, `register/page.tsx`)
    - Mobile scrollable content containers.
- **Interactive Release Notes & Changelog Modal (`ReleaseNotesModal`)**:
  - Origin-aware centered animation (`zoom-in-95` / `scale(0.95)` to `scale(1)` with `opacity`).
  - Active curriculum baseline overview showing verified 2025 units (6,182 units across Early Years, Primary, JSS, and SSS).
  - Version changelog timeline with tabbed navigation and keyboard escape listener.
- **Authoritative Release Manifest Configuration**:
  - `lib/config/release.manifest.ts` providing typed metadata, release tags, and historical changelog entries.
- **Support for Versioned Curriculum Types**:
  - Frontend type definitions for `CurriculumRelease` and `CurriculumUnit`.

### Changed
- Bumped frontend package version from `0.1.0` to `2.0.1`.
- Cleaned up app layout spacing and footer alignment.

---

## [2.0.0] - 2026-09-28
### Added
- **Authentication & Security Architecture Overhaul**:
  - Revocable token handling and seamless session refresh integration.
  - Correlation ID preservation across Redux RTK Query requests.
- **Redux State Management Upgrades**:
  - Enhanced cache invalidation for lesson notes and resources.

---

## [1.0.0] - 2026-08-15
### Added
- Initial public release of SabiNote web application.
- AI Lesson Note generator interface with real-time markdown editor.
- Wallet top-up via Paystack.
- Teacher dashboard and resource library.
