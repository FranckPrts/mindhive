import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "@apollo/client";
import styled from "styled-components";

import { UserContext } from "./Authorized";
import Button from "../DesignSystem/Button";
import { surfaceForRoute } from "../../lib/surfaces";
import { CREATE_TICKET, SET_TICKET_STATUS } from "../Mutations/Ticket";
import { GET_TICKETS_FOR_SURFACE } from "../Queries/Ticket";

/**
 * File a ticket against the page you are looking at.
 *
 * Mounted once in `_app.js` beside `<HelpCenter />`, so it is available on
 * every route without any page knowing about it. Only rendered for viewers
 * holding `canManageTickets` — and the server enforces the same flag on the
 * Ticket list, so hiding the UI is a convenience, not the access control.
 *
 * The anchor is the surface key resolved from `router.pathname`, not the URL:
 * `/dashboard/boards/cmf3x9…` names one user's board, while
 * `dashboard.boards` names the thing that is broken. See lib/surfaces.js.
 */

const TOGGLE_HINT = "Alt+Shift+T";

/** Long edge cap for uploaded captures. A full-page PNG of an AG Grid is
 *  several megabytes; this keeps a legible screenshot near ~200KB. */
const MAX_CAPTURE_EDGE = 1600;
const CAPTURE_QUALITY = 0.7;

const KINDS = [
  { value: "BUG", label: "Bug" },
  { value: "DESIGN_DRIFT", label: "Design drift" },
  { value: "MISSING", label: "Missing" },
  { value: "COPY", label: "Copy" },
  { value: "IDEA", label: "Idea" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
];

const OPEN_STATUSES = ["OPEN", "ACCEPTED", "IN_PROGRESS"];

/**
 * Surfaces that must never be captured. A screenshot of a participant session,
 * a live class or a student's ballot can contain names and responses, so the
 * overlay refuses rather than capturing and trusting someone to delete it
 * later. Tickets can still be filed here — just without an image.
 */
const NO_CAPTURE_PREFIXES = ["participate."];

function captureForbidden(surfaceKey) {
  return NO_CAPTURE_PREFIXES.some((prefix) => surfaceKey?.startsWith(prefix));
}

/** Downscale and re-encode, so the upload is a screenshot rather than a file. */
async function toUploadableFile(canvas, surfaceKey) {
  const scale = Math.min(1, MAX_CAPTURE_EDGE / Math.max(canvas.width, canvas.height));
  let source = canvas;

  if (scale < 1) {
    const scaled = document.createElement("canvas");
    scaled.width = Math.round(canvas.width * scale);
    scaled.height = Math.round(canvas.height * scale);
    const ctx = scaled.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
    source = scaled;
  }

  const blob = await new Promise((resolve) =>
    source.toBlob(resolve, "image/jpeg", CAPTURE_QUALITY)
  );
  if (!blob) return null;
  return new File([blob], `${surfaceKey}-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export default function TicketOverlay() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [filed, setFiled] = useState(null);
  const [form, setForm] = useState({
    title: "",
    kind: "BUG",
    priority: "NORMAL",
    description: "",
    withScreenshot: true,
  });

  const canManageTickets = useMemo(
    () => !!user?.permissions?.some((permission) => permission?.canManageTickets),
    [user]
  );

  const surface = surfaceForRoute(router.pathname, router.query);
  const surfaceKey = surface?.key ?? null;
  const noCapture = captureForbidden(surfaceKey);

  const { data, refetch } = useQuery(GET_TICKETS_FOR_SURFACE, {
    variables: { surface: surfaceKey },
    skip: !canManageTickets || !surfaceKey,
    fetchPolicy: "cache-and-network",
  });

  const tickets = data?.tickets ?? [];
  const openTickets = tickets.filter((ticket) => OPEN_STATUSES.includes(ticket.status));

  const [createTicket] = useMutation(CREATE_TICKET);
  const [setTicketStatus] = useMutation(SET_TICKET_STATUS);

  // Alt+Shift+T. Alt-based to stay clear of the browser's own chords —
  // Ctrl+Shift+T reopens a closed tab, Cmd+Shift+K is the Firefox console.
  const onKeyDown = useCallback(
    (event) => {
      if (!canManageTickets) return;
      if (event.altKey && event.shiftKey && event.code === "KeyT") {
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
      if (event.key === "Escape") setOpen(false);
    },
    [canManageTickets]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // A ticket belongs to the page it was filed from, so close on navigation
  // rather than carrying a half-written one to a different surface.
  useEffect(() => {
    const close = () => {
      setOpen(false);
      setFiled(null);
    };
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, [router.events]);

  if (!canManageTickets) return null;

  const evidence = () => ({
    url: window.location.href,
    route: router.pathname,
    area: router.query?.area ?? null,
    selector: router.query?.selector ?? null,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    locale: router.locale ?? null,
    roles: user?.permissions?.map((permission) => permission?.name).filter(Boolean) ?? [],
    userAgent: navigator.userAgent,
  });

  async function capture() {
    if (noCapture || !form.withScreenshot) return null;
    try {
      // Loaded on demand: html2canvas is large and most page loads never file
      // a ticket.
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        // The panel itself is not part of the bug.
        ignoreElements: (element) => element.dataset?.mhTicketUi === "true",
      });
      return await toUploadableFile(canvas, surfaceKey);
    } catch (captureError) {
      // A refused or failed capture must never block filing — the written
      // report is the part that matters.
      console.warn("Ticket screenshot capture failed:", captureError);
      return null;
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !surfaceKey) return;
    setSaving(true);
    setError(null);
    try {
      const screenshot = await capture();
      const result = await createTicket({
        variables: {
          surface: surfaceKey,
          title: form.title.trim(),
          kind: form.kind,
          priority: form.priority,
          body: form.description ? { text: form.description } : null,
          evidence: evidence(),
          reporterId: user.id,
          screenshot,
        },
      });
      setFiled({
        id: result?.data?.createTicket?.id,
        withScreenshot: !!screenshot,
      });
      setForm({
        title: "",
        kind: "BUG",
        priority: "NORMAL",
        description: "",
        withScreenshot: true,
      });
      await refetch();
    } catch (submitError) {
      setError(submitError.message || "Could not file the ticket.");
    }
    setSaving(false);
  }

  async function markShipped(id) {
    await setTicketStatus({ variables: { id, status: "SHIPPED" } });
    await refetch();
  }

  const set = (key) => (event) =>
    setForm((current) => ({
      ...current,
      [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  return (
    <>
      <LauncherButton
        type="button"
        data-mh-ticket-ui="true"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-label={
          openTickets.length
            ? `Tickets (${openTickets.length} open here). ${TOGGLE_HINT}`
            : `File a ticket. ${TOGGLE_HINT}`
        }
        title={`Tickets — ${TOGGLE_HINT}`}
      >
        <span aria-hidden="true">⚑</span>
        {openTickets.length > 0 && <Count>{openTickets.length}</Count>}
      </LauncherButton>

      {open && (
        <Panel data-mh-ticket-ui="true" role="dialog" aria-label="File a ticket">
          <PanelHead>
            <div>
              <Eyebrow>Filing against</Eyebrow>
              <SurfaceName>{surface?.label ?? "Unregistered surface"}</SurfaceName>
              <SurfaceKey>{surfaceKey ?? router.pathname}</SurfaceKey>
            </div>
            <CloseButton type="button" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </CloseButton>
          </PanelHead>

          {!surfaceKey && (
            <Notice tone="warn">
              This route has no surface in <code>lib/surfaces.js</code>, so a ticket
              filed here would have nothing stable to point at. Add it to the
              registry first — <code>npm run lint:surfaces</code> will confirm.
            </Notice>
          )}

          {openTickets.length > 0 && (
            <Existing>
              <Eyebrow>Already open here</Eyebrow>
              {openTickets.map((ticket) => (
                <ExistingRow key={ticket.id}>
                  <span>{ticket.title}</span>
                  <RowActions>
                    <Tag>{ticket.status.replace("_", " ").toLowerCase()}</Tag>
                    <LinkButton type="button" onClick={() => markShipped(ticket.id)}>
                      shipped
                    </LinkButton>
                  </RowActions>
                </ExistingRow>
              ))}
            </Existing>
          )}

          {filed ? (
            <Notice tone="ok">
              Filed{filed.withScreenshot ? " with a screenshot" : " without a screenshot"}.{" "}
              <LinkButton type="button" onClick={() => setFiled(null)}>
                File another
              </LinkButton>
            </Notice>
          ) : (
            <form onSubmit={submit}>
              <Field>
                <label htmlFor="mh-ticket-title">What is wrong?</label>
                <input
                  id="mh-ticket-title"
                  value={form.title}
                  onChange={set("title")}
                  placeholder="One line — the card title"
                  autoFocus
                  required
                />
              </Field>

              <Row>
                <Field>
                  <label htmlFor="mh-ticket-kind">Kind</label>
                  <select id="mh-ticket-kind" value={form.kind} onChange={set("kind")}>
                    {KINDS.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <label htmlFor="mh-ticket-priority">Priority</label>
                  <select
                    id="mh-ticket-priority"
                    value={form.priority}
                    onChange={set("priority")}
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </Row>

              <Field>
                <label htmlFor="mh-ticket-description">
                  What should it do instead? <Optional>optional</Optional>
                </label>
                <textarea
                  id="mh-ticket-description"
                  rows={4}
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Steps, the expected behaviour, the design it should match"
                />
              </Field>

              {noCapture ? (
                <Notice tone="warn">
                  Screenshots are disabled on participant-facing surfaces — a capture
                  here could contain a participant&apos;s own responses. Describe what
                  you saw instead.
                </Notice>
              ) : (
                <Checkbox>
                  <input
                    id="mh-ticket-screenshot"
                    type="checkbox"
                    checked={form.withScreenshot}
                    onChange={set("withScreenshot")}
                  />
                  <label htmlFor="mh-ticket-screenshot">
                    Attach a screenshot of this page
                  </label>
                </Checkbox>
              )}

              {error && <Notice tone="error">{error}</Notice>}

              <Actions>
                <Button
                  variant="filled"
                  type="submit"
                  disabled={saving || !form.title.trim() || !surfaceKey}
                >
                  {saving ? "Filing…" : "File ticket"}
                </Button>
                <Button variant="text" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </Actions>
            </form>
          )}
        </Panel>
      )}
    </>
  );
}

/* --- styles ------------------------------------------------------------- */
/* Sits above HelpCenter's launcher rather than beside it, so the two do not
   fight for the same corner. Both are fixed to the bottom right. */

const LauncherButton = styled.button`
  position: fixed;
  right: 24px;
  bottom: 96px;
  z-index: 9998;
  width: 48px;
  height: 48px;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  font-size: 20px;
  background: var(--MH-Theme-Primary-Dark, #336f8a);
  color: var(--MH-Theme-Neutrals-White, #ffffff);
  box-shadow: var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0, 0, 0, 0.1));
  transition: background-color 0.2s;

  &:hover {
    background: var(--MH-Theme-Tertiary-Dark, #0d3944);
  }
  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Accent-Base, #f2be42);
    outline-offset: 2px;
  }
`;

const Count = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 100px;
  background: var(--MH-Theme-Accent-Base, #f2be42);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font: var(--MH-Type-Label-Small);
  line-height: 20px;
`;

const Panel = styled.div`
  position: fixed;
  right: 24px;
  bottom: 156px;
  z-index: 9999;
  width: min(420px, calc(100vw - 48px));
  max-height: min(70vh, 720px);
  overflow-y: auto;
  padding: 20px;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  box-shadow: var(--MH-Theme-Elevation-High, 2px 2px 12px rgba(0, 0, 0, 0.19));

  input,
  select,
  textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 8px;
    font: var(--MH-Type-Body-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
    background: var(--MH-Theme-Neutrals-White, #ffffff);
  }
  textarea {
    resize: vertical;
  }
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: -1px;
  }
`;

const PanelHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;

const Eyebrow = styled.p`
  margin: 0 0 2px;
  font: var(--MH-Type-Label-Small);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const SurfaceName = styled.p`
  margin: 0;
  font: var(--MH-Type-Title-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const SurfaceKey = styled.p`
  margin: 2px 0 0;
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
  word-break: break-all;
`;

const CloseButton = styled.button`
  flex: none;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  padding: 0 4px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

  &:hover {
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  flex: 1;

  label {
    font: var(--MH-Type-Label-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const Optional = styled.span`
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  input {
    width: auto;
  }
  label {
    font: var(--MH-Type-Body-Small);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Existing = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
`;

const ExistingRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
`;

const Tag = styled.span`
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  white-space: nowrap;
`;

const LinkButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  text-decoration: underline;
`;

const NOTICE_TONES = {
  ok: {
    background: "var(--MH-Theme-Success, #e3f4ec)",
    color: "var(--MH-Theme-Success-Dark, #1d6b3a)",
  },
  warn: {
    background: "var(--MH-Theme-Accent-Light, #fdf2d0)",
    color: "var(--MH-Theme-Warning-Dark, #8f1f14)",
  },
  error: {
    background: "var(--MH-Theme-Warning-Light, #edcecd)",
    color: "var(--MH-Theme-Warning-Base, #b9261a)",
  },
};

// Falls back rather than throwing: a mistyped tone should make a notice look
// wrong, not take the whole overlay down with it.
const tone = (props) => NOTICE_TONES[props.tone] ?? NOTICE_TONES.warn;

const Notice = styled.div`
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  font: var(--MH-Type-Body-Small);
  background: ${(props) => tone(props).background};
  color: ${(props) => tone(props).color};

  code {
    font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
    font-size: 0.9em;
  }
`;
