import styled from "styled-components";

import { describeFigmaUrl } from "../../../lib/figmaUrl";

/**
 * A compact link to where a ticket's intended design lives.
 *
 * Used in the filing panel's open-ticket rows and on the ticket page, so the
 * same link looks the same in both. The Figma mark does the recognising, which
 * is what lets the chip stay small; the file and node it points at are in the
 * tooltip and the accessible name rather than taking up the row.
 *
 * Always opens in a new tab — in the panel you are part-way through filing,
 * and on the ticket page you almost certainly want both side by side.
 *
 * Renders nothing for an empty or non-Figma URL, so callers can pass the field
 * straight through without guarding it.
 */
export default function FigmaLink({ url, detail = false }) {
  const description = describeFigmaUrl(url);
  if (!description) return null;

  return (
    <Chip
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Intended design — ${description}`}
      aria-label={`Intended design in Figma: ${description} — opens in a new tab`}
    >
      <FigmaMark />
      <span>Figma</span>
      {detail && <Detail>{description}</Detail>}
      <span aria-hidden="true">↗</span>
    </Chip>
  );
}

/** Figma's mark, drawn at icon size. Brand colours, so deliberately not tokens. */
function FigmaMark() {
  return (
    <svg width="9" height="13" viewBox="0 0 38 57" aria-hidden="true" focusable="false">
      <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
      <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
      <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
      <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
      <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
    </svg>
  );
}

const Chip = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  padding: 2px 8px;
  border-radius: 100px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font: var(--MH-Type-Label-Small);
  text-decoration: none;
  white-space: nowrap;

  svg {
    flex: none;
  }

  &:hover {
    border-color: var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  }
  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
`;

/* The file and node, on the ticket page where there is room for them. Truncates
   rather than wrapping, so a long file name never breaks the chip onto two
   lines. */
const Detail = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  font: var(--MH-Type-Body-Small);
`;
