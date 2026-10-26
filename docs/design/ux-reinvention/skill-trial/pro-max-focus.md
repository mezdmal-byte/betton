## UI Pro Max Search Results
**Domain:** ux | **Query:** focus not obscured
**Source:** ux-guidelines.csv | **Found:** 2 results

### Result 1
- **Category:** Accessibility
- **Issue:** Focus Not Obscured (Enhanced)
- **Platform:** Web
- **Description:** WCAG 2.2 AAA requires keyboard focus to remain fully visible
- **Do:** Keep the entire focused component unobscured by author-created content
- **Don't:** Present this enhanced AAA criterion as an AA requirement or allow persistent UI to hide any part of focus
- **Code Example Good:** close persistent overlay before focus moves behind it
- **Code Example Bad:** sticky footer covers half the focused button
- **Severity:** Medium

### Result 2
- **Category:** Accessibility
- **Issue:** Focus Not Obscured (Minimum)
- **Platform:** Web
- **Description:** WCAG 2.2 AA requires keyboard focus to remain at least partially visible
- **Do:** Offset sticky UI with scroll-padding and dismiss or move persistent overlays
- **Don't:** Let headers footers banners or chat widgets fully cover focus
- **Code Example Good:** scroll-padding-top: var(--header-height)
- **Code Example Bad:** fixed overlay covers :focus
- **Severity:** High
