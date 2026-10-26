## UI Pro Max Stack Guidelines
**Stack:** react | **Query:** conditional modal focus
**Source:** stacks/react.csv | **Found:** 1 results

### Result 1
- **Category:** Accessibility
- **Guideline:** Manage focus properly
- **Description:** Handle focus for modals dialogs
- **Do:** Focus trap in modals return focus on close
- **Don't:** No focus management
- **Code Good:** useEffect to focus input
- **Code Bad:** Modal without focus trap
- **Severity:** High
- **Docs URL:** https://react.dev/reference/react/useRef
- **Applies To:** react 19.2.x
- **Status:** active
- **Verified At:** 2026-08-13
