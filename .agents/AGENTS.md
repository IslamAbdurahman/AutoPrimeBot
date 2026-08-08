# AutoPrimeBot Workspace Guidelines

## Localization & Internationalization (MANDATORY)

- **NEVER hardcode raw UI text strings** in React components. Always use the `t('key', 'default_fallback')` translation hook from `react-i18next`.
- Whenever adding new UI elements, buttons, badges, table columns, or status texts, **ALWAYS add the corresponding translation keys to all 4 locale files**:
  1. `resources/js/i18n/locales/ru.json` (Russian)
  2. `resources/js/i18n/locales/uz.json` (Uzbek - Latin)
  3. `resources/js/i18n/locales/krill.json` (Uzbek - Cyrillic)
  4. `resources/js/i18n/locales/en.json` (English)
- Ensure parameters in dynamic strings use interpolation (e.g. `t('instructors.scheduled_drivings', 'dars belgilangan')`).

## Layout & Component Rules

- **Page Titles & Actions**: Keep page `h1` titles and primary action buttons (e.g. `+ Add`) inline on the same horizontal flex row across all admin pages. Do not add subheader description paragraphs under page titles.
- **Mobile Responsive Grids**: On mobile modal forms, pair related input fields (e.g., Group + Search, Autodrome + Date, Start Time + End Time) side-by-side using 2-column grid rows (`grid grid-cols-2 gap-3`).
- **Instructor Privacy Scoping**: Student ratings, reviews, star badges, and reason tags must stay hidden from users with the `instructor` role across all admin pages (drivings list, student details, etc.).
