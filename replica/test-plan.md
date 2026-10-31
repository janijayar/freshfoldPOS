# Test Plan — freshfold POS Clone

Generated from `replica/features.csv` — covers all must/should/could screens.

---

## Flow Definitions

Based on the core POS workflow and supporting features:

| Flow ID | Name | Screens (S-IDs) | Priority |
|---------|------|-----------------|----------|
| F01 | Staff Login | S01 | must |
| F02 | Open Shift → Sell → Close Shift | S17, S08, S17 | must |
| F03 | Process Sale (cash, card, split) | S08 | must |
| F04 | Hold/Recall Ticket | S08, S35 | must |
| F05 | View Receipt | S07 | must |
| F06 | View Dashboard | S02 | must |
| F07 | Manage Inventory | S09, S10, S11 | should |
| F08 | Adjust Inventory | S12 | should |
| F09 | View Sales Reports | S03 | should |
| F10 | View Shift Reports | S04 | should |
| F11 | Manage Customers | S18, S19, S20 | should |
| F12 | Manage Employees | S15, S16 | should |
| F13 | Configure Store | S21, S22, S23, S24 | should |
| F14 | Multi-Location Ops | S31, S32 | should |
| F15 | Organization Settings | S29 | could |
| F16 | User Management | S30 | could |

---

## Test Cases per Flow

### F01 — Staff Login (S01)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F01-H1 | Happy | Enter valid email/password → Submit | Redirect to Dashboard, user session established |
| F01-H2 | Happy | Enter valid credentials → Check "Remember me" → Submit | Session persists across browser close |
| F01-E1 | Edge | Empty email field → Submit | Inline error: "Email is required" |
| F01-E2 | Edge | Empty password field → Submit | Inline error: "Password is required" |
| F01-E3 | Edge | Very long email (256+ chars) → Submit | Validation error, no crash |
| F01-E4 | Edge | Emoji in email field → Submit | Validation error |
| F01-E5 | Edge | Two tabs open, login in one → Refresh other | Second tab shows authenticated state |
| F01-E6 | Edge | Back button after login → Back to login | Redirects to Dashboard (no back to login) |
| F01-E7 | Edge | Refresh mid-login (during API call) | No duplicate requests, clean state |
| F01-E8 | Edge | Slow network (3s delay) → Submit | Loading skeleton shown, then success |
| F01-E9 | Edge | Offline → Submit | Error state: "No internet connection" |
| F01-E10 | Edge | Expired session → Access /dashboard | Redirect to /login with "Session expired" |
| F01-E11 | Edge | Mobile width (390px) | Layout stacks, inputs full width |
| F01-E12 | Edge | Keyboard only: Tab through fields → Enter | Focus moves correctly, form submits |
| F01-E13 | Edge | Screen reader: Labels announced | Email/Password inputs have associated labels |
| F01-N1 | Negative | Wrong password → Submit | Error: "Invalid email or password" |
| F01-N2 | Negative | Non-existent email → Submit | Error: "Invalid email or password" (no enumeration) |
| F01-N3 | Negative | Locked account → Submit | Error: "Account suspended" |
| F01-N4 | Negative | SQL injection attempt in email | Sanitized, no error leakage |

---

### F02 — Open Shift → Sell → Close Shift (S17, S08, S17)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F02-H1 | Happy | Open Shift → Enter starting cash → Open | Shift appears in list as "Open", starting cash recorded |
| F02-H2 | Happy | Add items to cart → Pay cash → Complete | Sale recorded, receipt generated |
| F02-H3 | Happy | Close Shift → Enter counted cash → Close | Shift marked "Closed", cash reconciliation shown |
| F02-E1 | Edge | Open shift with $0 starting cash | Allowed, shows $0 |
| F02-E2 | Edge | Very long cashier name (60 chars) | Truncated with ellipsis in UI |
| F02-E3 | Edge | Two registers open shifts simultaneously | Both tracked independently |
| F02-E4 | Edge | Back button during shift open | Stays on shift page, no data loss |
| F02-E5 | Edge | Refresh during open shift | Shift remains open, data persisted |
| F02-E6 | Edge | Slow network during close shift | Loading state, then success |
| F02-E7 | Edge | Offline during sale | Queued offline, synced when online |
| F02-E8 | Edge | Mobile width (390px) | POS grid stacks, cart sidebar slides |
| F02-E9 | Edge | Keyboard only: Navigate POS grid | Arrow keys move between products, Enter adds to cart |
| F02-E10 | Edge | Screen reader: Cart announced | Cart updates announced via live region |
| F02-N1 | Negative | Close shift with cash discrepancy > $5 | Warning shown, requires confirmation |
| F02-N2 | Negative | Close shift without opening one | Error: "No open shift" |
| F02-N3 | Negative | Double-click "Open Shift" | Only one shift created |

---

### F03 — Process Sale (S08)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F03-H1 | Happy | Add products → Select Cash → Enter amount → Complete | Sale complete, receipt shown, change calculated |
| F03-H2 | Happy | Add products → Select Card → Tap/Insert → Approved | Sale complete, auth code recorded |
| F03-H3 | Happy | Add products → Split payment (Cash + Card) → Complete | Both payments recorded, totals match |
| F03-H4 | Happy | Apply discount % → Complete | Discount applied, tax recalculated |
| F03-H5 | Happy | Select customer → Add loyalty points → Complete | Points added to customer profile |
| F03-E1 | Edge | Empty cart → Click Pay | Button disabled, no action |
| F03-E2 | Edge | 50+ items in cart | Virtualized list, smooth scroll |
| F03-E3 | Edge | Product with 60-char name | Truncated with tooltip |
| F03-E4 | Edge | Emoji in discount reason | Accepted, shown on receipt |
| F03-E5 | Edge | Two tabs: sale in progress in one, open other | Cart state synced or warning shown |
| F03-E6 | Edge | Double-click "Pay" | Single payment processed |
| F03-E7 | Edge | Back button during payment | Returns to cart, payment cancelled |
| F03-E8 | Edge | Refresh during payment | Payment either completes or rolls back cleanly |
| F03-E9 | Edge | Slow network (5s) during card payment | Loading spinner, no double-charge |
| F03-E10 | Edge | Offline → Cash sale | Queued, synced on reconnect |
| F03-E11 | Edge | Offline → Card sale | Blocked with "Requires connection" |
| F03-E12 | Edge | Mobile width | Product grid → list toggle, cart bottom sheet |
| F03-E13 | Edge | Keyboard: Arrow through products, Enter to add | Full keyboard operation |
| F03-E14 | Edge | Screen reader: Price announced | Each product announces name + price |
| F03-N1 | Negative | Card declined (Stripe test 4000 0000 0000 0002) | Error: "Card declined", cart preserved |
| F03-N2 | Negative | Insufficient cash entered | Error: "Amount less than total" |
| F03-N3 | Negative | Split payment totals don't match | Error: "Payments don't match total" |
| F03-N4 | Negative | Discount > 100% | Validation error |
| F03-N5 | Negative | Gift card balance insufficient | Error: "Insufficient balance", partial allowed |

---

### F04 — Hold/Recall Ticket (S08, S35)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F04-H1 | Happy | Add items → Hold Ticket → Recall from Tickets → Complete | Ticket recalled with all items, sale completes |
| F04-H2 | Happy | Hold multiple tickets → List shows all | All tickets listed with totals |
| F04-H3 | Happy | Void held ticket → Confirm | Ticket removed, inventory restored |
| F04-E1 | Edge | Hold ticket with 60-char customer name | Truncated in list, full in detail |
| F04-E2 | Edge | Hold 20+ tickets | Pagination works |
| F04-E3 | Edge | Recall ticket → Modify → Hold again | New hold created, old voided |
| F04-E4 | Edge | Back button from ticket detail | Returns to list, no data loss |
| F04-E5 | Edge | Refresh ticket list | Latest holds shown |
| F04-E6 | Edge | Offline: Hold ticket | Queued locally |
| F04-E7 | Edge | Mobile width | List stacks, actions in dropdown |
| F04-E8 | Edge | Keyboard: Navigate list, Enter to recall | Full keyboard operation |
| F04-N1 | Negative | Recall non-existent ticket ID | 404 error state |
| F04-N2 | Negative | Void already-completed ticket | Error: "Cannot void completed sale" |

---

### F05 — View Receipt (S07)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F05-H1 | Happy | Complete sale → Click receipt → View details | All line items, payments, taxes shown |
| F05-H2 | Happy | Print receipt → Print dialog opens | Print-optimized layout |
| F05-H3 | Happy | Download PDF → File downloads | Valid PDF with all data |
| F05-H4 | Happy | Email receipt → Sent to customer | Success toast, email queued |
| F05-E1 | Edge | Receipt with 20+ line items | All items scrollable |
| F05-E2 | Edge | Receipt with split payments | All payment methods shown |
| F05-E3 | Edge | Receipt with discount + tax | Calculations shown clearly |
| F05-E4 | Edge | Mobile width | Single column, print button sticky |
| F05-E5 | Edge | Keyboard: Tab through actions | All actions reachable |
| F05-N1 | Negative | Access invalid receipt ID | 404: "Receipt not found" |
| F05-N2 | Negative | Print with no printer | Browser print dialog handles |

---

### F06 — View Dashboard (S02)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F06-H1 | Happy | Login → Dashboard loads | Stats cards, recent orders, low stock alerts |
| F06-H2 | Happy | Click "View All" on recent orders → Orders page | Navigates to orders list |
| F06-E1 | Edge | Dashboard with no data (new org) | Empty states with CTAs |
| F06-E2 | Edge | 100+ recent orders | Pagination/virtualization |
| F06-E3 | Edge | Slow network | Skeletons for each widget |
| F06-E4 | Edge | Offline → Refresh | Cached data shown with stale badge |
| F06-E5 | Edge | Mobile width | Cards stack, charts resize |
| F06-E6 | Edge | Keyboard: Tab through widgets | Focus order logical |
| F06-N1 | Negative | API returns 500 | Error state per widget, retry button |

---

### F07 — Manage Inventory (S09, S10, S11)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F07-H1 | Happy | List products → Search "latte" → Filter category | Results filtered correctly |
| F07-H2 | Happy | Click product → View details → Edit → Save | Changes persisted |
| F07-H3 | Happy | New Product → Fill form → Save | Product appears in list |
| F07-H4 | Happy | Create variant product → Add sizes/colors | Variants table populated |
| F07-E1 | Edge | Product name 60 chars | Truncated in list, full in detail |
| F07-E2 | Edge | Emoji in product name | Displayed correctly |
| F07-E3 | Edge | 500+ products | Pagination, search debounced |
| F07-E4 | Edge | Sort by price/name/stock | Sort toggles work |
| F07-E5 | Edge | Two tabs: edit same product | Second tab warns or syncs |
| F07-E6 | Edge | Back button from edit | Returns to list, unsaved warning |
| F07-E7 | Edge | Refresh during edit | Form retains data |
| F07-E8 | Edge | Mobile width | Table → cards, tabs horizontal scroll |
| F07-E9 | Edge | Keyboard: Table navigation | Arrow keys, Enter to edit |
| F07-E10 | Edge | Screen reader: Table headers announced | Scope=col on headers |
| F07-N1 | Negative | Duplicate SKU → Save | Error: "SKU already exists" |
| F07-N2 | Negative | Required fields empty → Save | Inline validation errors |
| F07-N3 | Negative | Negative price/stock | Validation error |
| F07-N4 | Negative | Delete product with sales history | Soft delete only, or blocked |

---

### F08 — Adjust Inventory (S12)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F08-H1 | Happy | New Adjustment → Select product → Enter qty → Save | Stock updated, adjustment logged |
| F08-H2 | Happy | Transfer between locations → Receive | Both locations updated |
| F08-H3 | Happy | Stock count → Enter counted vs expected → Save | Discrepancy logged |
| F08-E1 | Edge | Large quantity (999999) | Accepted, no overflow |
| F08-E2 | Edge | Negative adjustment (shrinkage) | Allowed with reason required |
| F08-E3 | Edge | Filter by type/location/date | Results update |
| F08-E4 | Edge | Mobile width | Form stacks, date picker native |
| F08-N1 | Negative | Adjust non-existent product | Error |
| F08-N2 | Negative | Transfer to same location | Blocked |

---

### F09-F14 — Reports (S03, S04, S05, S06)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F09-H1 | Happy | Select date range → View sales by category | Table populated, totals correct |
| F09-H2 | Happy | Switch tab: By Staff → By Location | Data refreshes per tab |
| F09-H3 | Happy | Export CSV → File downloads | Valid CSV with visible columns |
| F09-E1 | Edge | Date range: 1 year | Loads within 3s |
| F09-E2 | Edge | Empty date range (no sales) | Empty state with message |
| F09-E3 | Edge | Mobile width | Tables horizontal scroll |
| F09-E4 | Edge | Keyboard: Tab through filters | All filters reachable |
| F09-N1 | Negative | Invalid date range (end < start) | Validation error |

---

### F11 — Manage Customers (S18, S19, S20)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F11-H1 | Happy | List → Search → Filter by tier | Results filtered |
| F11-H2 | Happy | View detail → See order history, loyalty | All tabs load |
| F11-H3 | Happy | Add loyalty points manually → Save | Points updated, history logged |
| F11-E1 | Edge | Customer with 60-char name | Truncated in list |
| F11-E2 | Edge | 1000+ customers | Pagination, search debounced |
| F11-E3 | Edge | Mobile width | Table → cards |
| F11-N1 | Negative | Merge duplicate customers | Confirmation required |

---

### F12 — Manage Employees (S15, S16)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F12-H1 | Happy | List → Filter by role/status | Results filtered |
| F12-H2 | Happy | View schedule → Clock in/out → View shifts | Time recorded |
| F12-E1 | Edge | Employee with overlapping shifts | Warning shown |
| F12-E2 | Edge | Overtime calculation | Highlighted in reports |
| F12-E3 | Edge | Mobile width | Calendar stacks |
| F12-N1 | Negative | Clock in without open shift | Error |

---

### F13 — Configure Store (S21, S22, S23, S24)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F13-H1 | Happy | Store Settings → Change currency/timezone → Save | Persisted, affects POS |
| F13-H2 | Happy | Register Settings → Add printer → Test print | Test receipt prints |
| F13-H3 | Happy | Payment Settings → Enter Stripe keys → Test mode | Connection verified |
| F13-H4 | Happy | Tax Settings → Add rate → Apply to product | Tax calculated on sale |
| F13-E1 | Edge | Business hours: Overnight (10pm-6am) | Handled correctly |
| F13-E2 | Edge | Multiple tax rates (state+city) | Compound calculated |
| F13-E3 | Edge | Mobile width | Forms stack, tabs scroll |
| F13-N1 | Negative | Invalid Stripe key | Error shown, not saved |
| F13-N2 | Negative | Tax rate > 100% | Validation error |

---

### F14 — Multi-Location (S31, S32)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F14-H1 | Happy | List locations → Set default → Switch | Context changes |
| F14-H2 | Happy | Consolidated report → View all locations | Combined totals |
| F14-E1 | Edge | Location with no registers | Warning badge |
| F14-E2 | Edge | Delete location with data | Blocked or cascade confirmed |
| F14-N1 | Negative | Set inactive location as default | Error |

---

### F15 — Organization Settings (S29)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F15-H1 | Happy | General tab → Update org name/logo → Save | Updated in header |
| F15-H2 | Happy | Billing tab → View subscription → Change plan | Redirects to Stripe portal |
| F15-H3 | Happy | Security tab → Enable MFA → Save | MFA required next login |
| F15-H4 | Happy | Notifications tab → Toggle emails → Save | Preferences applied |
| F15-E1 | Edge | Logo upload: 5MB PNG | Accepted, preview shown |
| F15-E2 | Edge | Logo upload: 20MB → Rejected | Error: "File too large" |
| F15-N1 | Negative | Invalid domain for white-label | Validation error |

---

### F16 — User Management (S30)

| Case | Type | Steps | Expected |
|------|------|-------|----------|
| F16-H1 | Happy | Invite user → Enter email/role → Send | Invitation emailed, user appears as "Invited" |
| F16-H2 | Happy | Edit user → Change role → Save | Permissions updated immediately |
| F16-H3 | Happy | Audit log → Filter by user/action → View | Entries shown with timestamps |
| F16-E1 | Edge | Invite existing email | Error: "Already invited" |
| F16-E2 | Edge | Role permissions matrix → Toggle all | All permissions update |
| F16-E3 | Edge | Mobile width | Tables → cards, matrix stacks |
| F16-E4 | Edge | Keyboard: Matrix navigation | Arrow keys toggle checkboxes |
| F16-N1 | Negative | Remove last owner | Blocked: "At least one owner required" |
| F16-N2 | Negative | Invite with invalid email format | Validation error |

---

## Cross-Cutting Test Cases (Apply to All Flows)

| Case | Description |
|------|-------------|
| X-E1 | **Responsive**: Test at 390px, 768px, 1024px, 1440px |
| X-E2 | **Keyboard**: Full flow using only Tab/Shift+Tab/Enter/Arrow keys |
| X-E3 | **Screen Reader**: NVDA/VoiceOver - all labels, roles, states announced |
| X-E4 | **Color Contrast**: All text meets WCAG AA (4.5:1 body, 3:1 large/UI) |
| X-E5 | **Focus Visible**: Every interactive element has visible focus ring |
| X-E6 | **Offline**: Disconnect network mid-flow → Reconnect → Data syncs |
| X-E7 | **Slow Network**: Throttle to 3G → All loading states show skeletons |
| X-E8 | **Session Expiry**: Wait for token expiry → Action → Redirect to login |
| X-E9 | **Concurrent Tabs**: Same flow in two tabs → No data corruption |
| X-E10 | **Browser Back/Forward**: Navigate mid-flow → State preserved or clean reset |
| X-E11 | **Double Submit**: Rapid clicks on primary actions → Single execution |
| X-E12 | **Long Content**: 60-char names, 500-char descriptions → No layout break |
| X-E13 | **Emoji/Unicode**: 🎉 😀 中文 العربية → Rendered correctly |
| X-E14 | **RTL**: Switch to Arabic → Layout mirrors (if supported) |
| X-E15 | **Zoom**: 200% browser zoom → No horizontal scroll, all usable |

---

## Automation Coverage

| Flow | Playwright Spec | Axe Scan | Console Error Check | 5xx Check |
|------|----------------|----------|---------------------|-----------|
| F01 | ✅ | ✅ | ✅ | ✅ |
| F02 | ✅ | ✅ | ✅ | ✅ |
| F03 | ✅ | ✅ | ✅ | ✅ |
| F04 | ✅ | ✅ | ✅ | ✅ |
| F05 | ✅ | ✅ | ✅ | ✅ |
| F06 | ✅ | ✅ | ✅ | ✅ |
| F07 | ✅ | ✅ | ✅ | ✅ |
| F08 | ✅ | ✅ | ✅ | ✅ |
| F09 | ✅ | ✅ | ✅ | ✅ |
| F10 | ✅ | ✅ | ✅ | ✅ |
| F11 | ✅ | ✅ | ✅ | ✅ |
| F12 | ✅ | ✅ | ✅ | ✅ |
| F13 | ✅ | ✅ | ✅ | ✅ |
| F14 | ✅ | ✅ | ✅ | ✅ |
| F15 | ✅ | ✅ | ✅ | ✅ |
| F16 | ✅ | ✅ | ✅ | ✅ |

---

## Manual Test Checklist (Cannot Automate)

- [ ] Email delivery (invites, receipts)
- [ ] Stripe Terminal hardware pairing
- [ ] Receipt printer hardware test print
- [ ] Cash drawer hardware trigger
- [ ] Barcode scanner hardware scan
- [ ] OAuth/SSO login flows
- [ ] Push notifications (if implemented)
- [ ] Visual regression (screenshot diff)
- [ ] Performance: LCP < 2.5s, INP < 200ms

---

## Bug Tracking

All bugs recorded in `replica/bugs.md` with format:
- ID, Severity (S1-S4), Flow, Steps, Expected, Actual, Evidence, Fix Commit