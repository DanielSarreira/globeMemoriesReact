/**
 * Accordion.jsx — collapsible section with header + body.
 *
 * Used in Step 4 to group the sub-editors (Categorias, Línguas,
 * Alojamento, Comida, Transportes, Pontos de Interesse, Itinerário,
 * Pontos Negativos). The header shows the icon, label, count, and
 * an inline "+" action; clicking the header expands the body.
 *
 * Built on the native HTML <details>/<summary> elements for
 * accessibility (keyboard navigation, screen reader support,
 * no-JS fallback) with a custom chevron animation.
 *
 * Props:
 *   - icon:       Lucide icon component (e.g. `BedDouble`)
 *   - title:      section title (e.g. "Acomodações")
 *   - count:      optional number badge (e.g. 3 → "3")
 *   - onAction:   optional click handler for the "+" button
 *   - actionIcon: optional icon for the action button (default Plus)
 *   - defaultOpen: bool, opens the section on mount
 *   - children:   section body
 */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { ChevronRight, Plus } from 'lucide-react';
import './Accordion.css';

const Accordion = ({
  icon: Icon,
  title,
  count,
  onAction,
  actionIcon: ActionIcon = Plus,
  defaultOpen = false,
  children,
}) => {
  const ref = useRef(null);
  // We use <details> so the browser handles the open state. The
  // `open` attribute is set from `defaultOpen` on mount only — the
  // user can then collapse/expand at will and the state is local
  // to the <details> element.
  useEffect(() => {
    if (defaultOpen && ref.current) {
      ref.current.open = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <details ref={ref} className="gm-accordion">
      <summary className="gm-accordion__header">
        <span className="gm-accordion__chevron" aria-hidden="true">
          <ChevronRight size={16} strokeWidth={2} />
        </span>
        {Icon && (
          <span className="gm-accordion__icon" aria-hidden="true">
            <Icon size={18} strokeWidth={1.8} />
          </span>
        )}
        <span className="gm-accordion__title">{title}</span>
        {typeof count === 'number' && count > 0 && (
          <span className="gm-accordion__count">{count}</span>
        )}
        {onAction && (
          <button
            type="button"
            className="gm-accordion__action"
            onClick={(e) => {
              // Prevent the <details> from toggling when clicking
              // the action button.
              e.preventDefault();
              e.stopPropagation();
              onAction();
            }}
            aria-label={`Adicionar ${title}`}
          >
            <ActionIcon size={16} strokeWidth={2} />
          </button>
        )}
      </summary>
      <div className="gm-accordion__body">{children}</div>
    </details>
  );
};

Accordion.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
  onAction: PropTypes.func,
  actionIcon: PropTypes.elementType,
  defaultOpen: PropTypes.bool,
  children: PropTypes.node,
};

export default Accordion;
