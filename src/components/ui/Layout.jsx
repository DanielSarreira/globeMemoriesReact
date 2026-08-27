import React from "react";

/* ════════════════════════════════════════════════════════════════
   Globe Memories — Global Layout System v3
   Standardized spacing, content widths, and rhythm.
   Every page should compose with these primitives.

   IMPORTANT: The page-level rhythm (max-width 1080px, padding,
   gap) is owned by `.gm-app__content > *` in `src/styles/layout.css`.
   PageContainer is a thin compatibility wrapper — it forwards
   className but does NOT define its own max-width, padding or
   margin, so the global container is the single source of truth.
   ════════════════════════════════════════════════════════════════ */

/**
 * PageContainer — a thin wrapper that just adds a hookable class.
 *
 * The actual page width, padding, gap and rhythm come from
 * `.gm-app__content > *` (see `src/styles/layout.css`). The
 * `size` prop is preserved for backwards compatibility but is
 * intentionally a no-op — every size now resolves to the same
 * 1080px so the user never sees different widths between pages.
 */
export const PageContainer = ({ size = "lg", children, className = "", as: As = "div", ...rest }) => {
  // We intentionally do NOT add a size class — the global layout
  // system in layout.css now owns the page rhythm, and adding
  // gm-layout--* here would re-introduce per-page width overrides.
  return (
    <As className={className.trim() || undefined} {...rest}>
      {children}
    </As>
  );
};

/**
 * PageHeader — sticky glass header with optional tabs and actions.
 * Standardizes the pattern used by Notifications, Settings, Q&A, Users.
 */
export const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  tabs,
  actions,
  children,
}) => {
  return (
    <div className="gm-pagehead">
      <div className="gm-pagehead__inner">
        <div className="gm-pagehead__left">
          {Icon && (
            <div className="gm-pagehead__icon">
              <Icon size={20} strokeWidth={1.75} />
            </div>
          )}
          <div>
            {title && <h1 className="gm-pagehead__title">{title}</h1>}
            {subtitle && <p className="gm-pagehead__sub">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="gm-pagehead__actions">{actions}</div>}
        {tabs && <div className="gm-pagehead__tabs">{tabs}</div>}
        {children}
      </div>
    </div>
  );
};

/**
 * Section — vertical spacing group inside a page.
 *
 * Usage:
 *   <Section>
 *     <SectionHeader title="…" count={…} />
 *     <Grid>{…}</Grid>
 *   </Section>
 */
export const Section = ({ children, className = "", as: As = "div", tight = false, ...rest }) => (
  <As className={`gm-section ${tight ? "gm-section--tight" : ""} ${className}`.trim()} {...rest}>
    {children}
  </As>
);

/**
 * SectionHeader — title + optional count + optional action slot.
 */
export const SectionHeader = ({ title, count, icon: Icon, action, children }) => (
  <header className="gm-section-head">
    {title && (
      <h2 className="gm-section-head__title">
        {Icon && <Icon size={16} strokeWidth={1.75} />}
        {title}
        {typeof count === "number" && <span className="gm-section-head__count">{count}</span>}
      </h2>
    )}
    {action && <div className="gm-section-head__action">{action}</div>}
    {children}
  </header>
);

/**
 * Grid — standardized responsive grid.
 *
 * Usage:
 *   <Grid min={280} gap="md">{…}</Grid>   — auto-fit, min width
 *   <Grid cols={3} gap="md">{…}</Grid>     — fixed columns
 */
export const Grid = ({ children, cols, min, gap = "md", className = "" }) => {
  const style = {};
  if (typeof min === "number") {
    style.gridTemplateColumns = `repeat(auto-fill, minmax(${min}px, 1fr))`;
  } else if (typeof cols === "number") {
    style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  }
  return (
    <div className={`gm-grid gm-grid--${gap} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
};

/**
 * Stack — vertical flex with consistent gap.
 *
 * Usage:
 *   <Stack gap="md">…</Stack>
 */
export const Stack = ({ children, gap = "md", as: As = "div", className = "", ...rest }) => (
  <As className={`gm-stack gm-stack--${gap} ${className}`.trim()} {...rest}>
    {children}
  </As>
);

/**
 * Row — horizontal flex with consistent gap.
 */
export const Row = ({ children, gap = "md", as: As = "div", className = "", align = "center", justify = "flex-start", wrap = false, ...rest }) => (
  <As
    className={`gm-row gm-row--${gap} ${wrap ? "gm-row--wrap" : ""} ${className}`.trim()}
    style={{ alignItems: align, justifyContent: justify }}
    {...rest}
  >
    {children}
  </As>
);

/**
 * Spacer — vertical breathing space.
 */
export const Spacer = ({ size = "md" }) => <div className={`gm-spacer gm-spacer--${size}`} aria-hidden="true" />;

export default PageContainer;
