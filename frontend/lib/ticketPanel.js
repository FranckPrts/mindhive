/**
 * How the Help Center asks the ticket overlay to open.
 *
 * The two are siblings in `_app.js` with no parent between them, so the choices
 * were a context provider threaded through the app shell or a window event.
 * The event wins here because the overlay is *already* an app-global control
 * listening to a global signal — the Alt+Shift+T chord — so this is the same
 * mechanism it uses, not a second one.
 *
 * The event name lives here rather than as a string literal in two files, which
 * is the only way this kind of coupling stays greppable.
 */

export const OPEN_TICKET_PANEL = "mh:open-ticket-panel";

/** Ask the overlay to open. Safe to call before it has mounted — nothing listens, nothing breaks. */
export function openTicketPanel() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_TICKET_PANEL));
}

/** Subscribe. Returns the unsubscribe function, shaped for a useEffect cleanup. */
export function onOpenTicketPanel(handler) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(OPEN_TICKET_PANEL, handler);
  return () => window.removeEventListener(OPEN_TICKET_PANEL, handler);
}
