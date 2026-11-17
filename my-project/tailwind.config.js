const colors = {
  // Brand colors: navbar green, supporting olive, and the recipe app's tomato-red accent.
  brand: {
    forest: "var(--brand-forest)",
    olive: "var(--brand-olive)",
    tomato: "var(--brand-tomato)",
    "tomato-hover": "var(--brand-tomato-hover)",
    "tomato-bright": "var(--brand-tomato-bright)",
    cream: "var(--brand-cream)",
  },
  // Main page and content colors: canvas, text, table surfaces, borders, and recipe metadata.
  app: {
    canvas: "var(--app-canvas)",
    ink: "var(--app-ink)",
    muted: "var(--app-muted)",
    subtle: "var(--app-subtle)",
    surface: "var(--app-surface)",
    border: "var(--app-border)",
    "border-soft": "var(--app-border-soft)",
    "border-table": "var(--app-border-table)",
    "table-header": "var(--app-table-header)",
    "row-hover": "var(--app-row-hover)",
    "ingredient-surface": "var(--app-ingredient-surface)",
    "time-surface": "var(--app-time-surface)",
    "time-text": "var(--app-time-text)",
  },
  // Action colors: green for create/save, red for destructive actions and error feedback.
  action: {
    create: "var(--action-create)",
    "create-hover": "var(--action-create-hover)",
    danger: "var(--action-danger)",
    "danger-hover": "var(--action-danger-hover)",
    "danger-text": "var(--action-danger-text)",
  },
};

/** Shared application palette used by Tailwind color utilities. */
export default {
  theme: {
    extend: {
      colors,
    },
  },
};
