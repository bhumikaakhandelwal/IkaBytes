import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Dropdown styled like the rest of SkillMatch (replaces the browser's plain <select>).
 *
 * Keyboard: Enter / Space / ↓ open it · ↑ ↓ move · Home / End · Enter selects ·
 * Esc closes · typing a letter jumps to the first matching option.
 *
 * Props:
 *   value, onChange(value)
 *   options: [{ value, label }]  (or plain strings)
 *   placeholder: shown when value is empty
 *   ariaLabel: accessible name when there is no visible label
 *   invalid: red border (e.g. a required field left empty)
 */
export default function Select({
  value, onChange, options, placeholder = 'Select…', ariaLabel, invalid = false, disabled = false, className = '',
}) {
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const typed = useRef({ text: '', at: 0 });
  const id = useId();

  const selectedIndex = items.findIndex((o) => o.value === value);
  const selected = items[selectedIndex];

  // Close when clicking anywhere else
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keep the highlighted option visible while using the keyboard
  useEffect(() => {
    if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openList = () => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (index) => {
    const item = items[index];
    if (item) onChange(item.value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(items.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(items.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); }
    else if (e.key.length === 1) {
      // Type-ahead: jump to the first option starting with the typed letters
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + e.key.toLowerCase(), at: now };
      const hit = items.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <div className={`sm-select ${open ? 'is-open' : ''} ${invalid ? 'is-invalid' : ''} ${disabled ? 'is-disabled' : ''} ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`sm-select-trigger ${selected ? '' : 'is-placeholder'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
        disabled={disabled}
        onClick={(e) => { e.preventDefault(); if (open) setOpen(false); else openList(); }}
        onKeyDown={onKeyDown}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={17} className="sm-select-chevron" />
      </button>

      {open && (
        <ul className="sm-select-list" role="listbox" id={`${id}-list`} ref={listRef} aria-label={ariaLabel}>
          {items.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`${i === active ? 'is-active' : ''} ${o.value === value ? 'is-selected' : ''}`}
              onMouseEnter={() => setActive(i)}
              // preventDefault keeps focus on the button and stops a surrounding <label> from re-opening the list
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); choose(i); }}
            >
              <span>{o.label}</span>
              {o.value === value && <Check size={15} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
