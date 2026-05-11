# Shared Frontend Layer

Shared code used by the four member folders.

- `components/` - common layout, cards, shell, header, and reusable UI.
- `context/` - auth session, theme, user mode, and shared CV state.
- `utils/` - API helpers, JSON helpers, and motion helpers.
- `data/` - shared landing-page content.
- `pages/` - login, not-found, landing, and placeholder pages.

The member folders should import shared code from `../../shared/...`.
