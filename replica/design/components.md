# freshfold POS — Component Specs

Based on recon screens and codebase analysis.

---

## Button

| | |
|---|---|
| **variants** | primary, secondary, outline, ghost, danger |
| **sizes** | sm (32px), md (40px), lg (48px), icon (32x32/40x40) |
| **states** | default, hover, active, focus-visible (2px ring, accent), disabled, loading |
| **tokens** | bg: accent/surface/border/transparent, text: on-accent/text/border, radius: md, font: sm/600 |
| **a11y** | real `<button>`, visible focus ring, loading keeps label for screen readers, `aria-disabled` when disabled |
| **used on** | S01, S02, S03-S06, S07, S08, S09, S10, S11, S12, S15, S16, S17, S18, S19, S20, S21, S22, S23, S24, S35 |

---

## Input

| | |
|---|---|
| **variants** | text, email, password, number, search |
| **sizes** | md (40px), lg (48px) |
| **states** | default, focus (2px ring, accent), error (border danger), disabled, loading |
| **tokens** | bg: surface, border: border-input, focus: border-focus, text: text, placeholder: text-muted, radius: md, font: base/400 |
| **a11y** | associated `<label>` with `htmlFor`, `aria-invalid`, `aria-describedby` for errors, `autoComplete` hints |
| **used on** | S01, S08, S09, S11, S12, S18, S21, S22, S23, S24 |

---

## Select

| | |
|---|---|
| **variants** | single, multi (future) |
| **sizes** | md (40px) |
| **states** | default, open, focus, disabled, error |
| **tokens** | bg: surface, border: border-input, focus: border-focus, radius: md, font: base/400 |
| **a11y** | native `<select>` or Radix Select with proper `role="combobox"`, keyboard navigation, `aria-label` |
| **used on** | S08, S09, S11, S21, S22, S23, S24 |

---

## Dialog

| | |
|---|---|
| **variants** | default, alert, form, full-screen (mobile) |
| **sizes** | sm (400px), md (500px), lg (700px), full |
| **states** | open, closed, loading |
| **tokens** | bg: surface, border: border, radius: lg, shadow: lg, overlay: rgba(0,0,0,0.5) |
| **a11y** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, ESC to close, return focus to trigger |
| **used on** | S01, S08, S11, S21, S22, S23, S24, S35 |

---

## Table

| | |
|---|---|
| **variants** | default, sortable, selectable, striped |
| **states** | loading (skeleton), empty, error, sticky header |
| **tokens** | bg: surface, header: bg, border: border, text: text, hover: bg, radius: md |
| **a11y** | `<table>` with `<thead>`/`<tbody>`, `<th scope="col">`, sortable headers with `aria-sort`, keyboard navigation |
| **used on** | S02, S03-S06, S09, S15, S17, S18, S31, S32 |

---

## Card

| | |
|---|---|
| **variants** | default, stat, product, elevated |
| **states** | default, hover, loading (skeleton), interactive |
| **tokens** | bg: surface/surface-elevated, border: border, radius: lg, shadow: sm/card |
| **a11y** | proper heading hierarchy, interactive cards use `<button>` or `<a>` |
| **used on** | S02, S03-S06, S08, S09, S10, S15, S18, S31 |

---

## Badge

| | |
|---|---|
| **variants** | default, success, warning, danger, secondary, info |
| **sizes** | sm (20px), md (24px) |
| **states** | default, dot indicator |
| **tokens** | bg: success-muted/warning-muted/danger-muted/info-muted/accent-muted/surface, text: success/warning/danger/info/accent/text-muted, radius: pill, font: xs/600 |
| **a11y** | color not sole indicator, text conveys meaning |
| **used on** | S08, S09, S17, S18, S20, S31 |

---

## Tabs

| | |
|---|---|
| **variants** | default, pills, underline |
| **states** | active, inactive, disabled, focus |
| **tokens** | bg: transparent, active: accent/accent-muted, text: text/text-muted/on-accent, radius: md, font: sm/600 |
| **a11y** | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, keyboard navigation (arrows), `aria-orientation` |
| **used on** | S10, S11, S19, S21, S23, S24, S29, S30 |

---

## DropdownMenu

| | |
|---|---|
| **variants** | default, with icons, with separators |
| **states** | open, closed, loading, disabled items |
| **tokens** | bg: surface, border: border, radius: md, shadow: lg, item padding: 8px 12px |
| **a11y** | `role="menu"`, `role="menuitem"`, keyboard navigation (arrows, Enter, ESC), focus management |
| **used on** | S15, S18, S31 |

---

## Toast

| | |
|---|---|
| **variants** | success, error, warning, info |
| **states** | visible, hiding, paused (on hover) |
| **tokens** | bg: success/danger/warning/info, text: on-accent/on-danger/on-warning/on-info, radius: md, shadow: lg |
| **a11y** | `role="alert"`, `aria-live="polite"`, auto-dismiss with pause on hover, screen reader friendly |
| **used on** | All |

---

## Skeleton

| | |
|---|---|
| **variants** | card, table-row, list-item, stat, text |
| **states** | loading (pulse animation) |
| **tokens** | bg: border, animation: pulse (1.5s ease-in-out) |
| **a11y** | `aria-hidden="true"`, `aria-busy="true"` on parent |
| **used on** | All |

---

## EmptyState

| | |
|---|---|
| **variants** | default, illustration, action |
| **states** | empty, with action button |
| **tokens** | bg: surface, text: text-muted, icon: text-muted/50, radius: lg, padding: 32px |
| **a11y** | proper heading, descriptive text, action button if applicable |
| **used on** | S02, S08, S09, S17, S18, S31 |

---

## ErrorState

| | |
|---|---|
| **variants** | network, server, not-found, permission |
| **states** | error, with retry action |
| **tokens** | bg: surface, text: text, icon: danger/warning, radius: lg, padding: 32px |
| **a11y** | `role="alert"`, descriptive text, retry button if recoverable |
| **used on** | All |

---

## Avatar

| | |
|---|---|
| **variants** | default, with fallback, with status |
| **sizes** | xs (24px), sm (32px), md (40px), lg (48px), xl (64px) |
| **states** | default, loading, error |
| **tokens** | bg: accent-muted, text: accent, fallback: initials, border: border, radius: full |
| **a11y** | `alt=""` for images, fallback text for initials |
| **used on** | S08, S18, S19, S30 |

---

## CurrencyDisplay

| | |
|---|---|
| **variants** | inline, tabular, large |
| **states** | default, negative, positive |
| **tokens** | font: mono, tabular-nums, color: text/danger/success, size: base/lg/xl |
| **a11y** | currency symbol + amount, screen reader reads full amount |
| **used on** | S02, S03-S06, S08, S17, S31, S32 |

---

## FormField (compound)

| | |
|---|---|
| **parts** | Label, Input/Select, Error, Hint |
| **states** | default, focus, error, disabled, required |
| **tokens** | gap: 6px, label: sm/500/text, hint: xs/text-muted, error: sm/danger |
| **a11y** | Label associated with Input, error linked via `aria-describedby`, required marked |
| **used on** | S01, S08, S11, S21, S22, S23, S24 |

---

## CurrencySelector (custom for S21)

| | |
|---|---|
| **variants** | dropdown, radio group |
| **states** | default, focus, disabled |
| **tokens** | inherits Select/Button tokens |
| **a11y** | grouped with `role="radiogroup"` or Select, `aria-label="Currency"`, keyboard nav |
| **used on** | S21 (Store Settings → General) |

---

## ProductCard (POS specific)

| | |
|---|---|
| **variants** | grid (default), list, out-of-stock |
| **states** | default, hover, active, disabled (out of stock), popular badge |
| **tokens** | bg: surface, border: border, radius: lg, padding: 12px, image: cover |
| **a11y** | `role="button"`, `aria-label="Add {name} to cart"`, `aria-disabled` when out of stock |
| **used on** | S08 |

---

## CartItem (POS specific)

| | |
|---|---|
| **variants** | default, with variant, with discount |
| **states** | default, quantity 1 (no minus), editing quantity |
| **tokens** | bg: surface, border: border, radius: md, gap: 12px |
| **a11y** | quantity buttons with `aria-label`, remove button with `aria-label`, name + sku as text |
| **used on** | S08 |

---

## PaymentDialog (POS specific)

| | |
|---|---|
| **variants** | cash, card, gift_card, split |
| **states** | method selection, cash amount entry, card terminal waiting, gift card entry, split entry |
| **tokens** | inherits Dialog, method buttons: secondary (selected) / outline (unselected) |
| **a11y** | `role="dialog"`, method buttons as `role="radio"` group, cash input labeled, focus trap |
| **used on** | S08 |

---

## ShiftReconciliation (S17 specific)

| | |
|---|---|
| **variants** | open, close, detail |
| **states** | counting, discrepancy, reconciled |
| **tokens** | inherits FormField, Card, Table |
| **a11y** | step-by-step flow with `aria-live` for totals, keyboard accessible |
| **used on** | S17 |

---

## ReceiptView (S07 specific)

| | |
|---|---|
| **variants** | thermal (print), A4, preview |
| **states** | loading, ready, printing |
| **tokens** | font: mono, size: sm, line: tight, width: 320px (thermal) / 100% (A4) |
| **a11y** | semantic HTML for receipt structure, print button with `aria-label` |
| **used on** | S07 |

---

## DataTable (Reports specific)

| | |
|---|---|
| **variants** | default, with totals row, with expandable rows |
| **states** | loading, empty, error, sorted, filtered, paginated |
| **tokens** | inherits Table, sticky header, totals row: bg: bg, font: bold |
| **a11y** | sortable headers, filter inputs labeled, pagination with `aria-label`, export button |
| **used on** | S03, S04, S05, S06, S32 |