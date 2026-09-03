import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import styled from "styled-components";

import { GET_TICKETS } from "../../Queries/Ticket";
import { SURFACES, getSurface } from "../../../lib/surfaces";
import BeehiveLoading from "../../DesignSystem/BeehiveLoading";

/**
 * The board, grouped by surface rather than by date.
 *
 * Grouping by surface is the point: it makes the board read as a map of the
 * product instead of a feed. It also surfaces the thing a date-ordered list
 * hides — which parts of the platform have nothing filed against them at all,
 * and which have piled up.
 */

const OPEN_STATUSES = ["OPEN", "ACCEPTED", "IN_PROGRESS"];

const STATUS_LABELS = {
  OPEN: "Open",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  SHIPPED: "Shipped",
  WONTFIX: "Won't fix",
};

const KIND_LABELS = {
  BUG: "Bug",
  DESIGN_DRIFT: "Design drift",
  MISSING: "Missing",
  COPY: "Copy",
  IDEA: "Idea",
};

/** Surface order follows the registry, so the board reads in product order. */
const REGISTRY_ORDER = new Map(SURFACES.map((surface, index) => [surface.key, index]));

export default function TicketsList() {
  const [showResolved, setShowResolved] = useState(false);
  const { data, loading, error } = useQuery(GET_TICKETS, {
    fetchPolicy: "cache-and-network",
  });

  const groups = useMemo(() => {
    const tickets = data?.tickets ?? [];
    const visible = showResolved
      ? tickets
      : tickets.filter((ticket) => OPEN_STATUSES.includes(ticket.status));

    const bySurface = new Map();
    for (const ticket of visible) {
      if (!bySurface.has(ticket.surface)) bySurface.set(ticket.surface, []);
      bySurface.get(ticket.surface).push(ticket);
    }

    return [...bySurface.entries()].sort((a, b) => {
      // Registry order, with anything unregistered last — a ticket on a
      // surface that no longer exists is worth seeing, not hiding.
      const orderA = REGISTRY_ORDER.get(a[0]) ?? Number.MAX_SAFE_INTEGER;
      const orderB = REGISTRY_ORDER.get(b[0]) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }, [data, showResolved]);

  const total = data?.tickets?.length ?? 0;
  const openCount = (data?.tickets ?? []).filter((ticket) =>
    OPEN_STATUSES.includes(ticket.status)
  ).length;

  if (loading && !data) return <BeehiveLoading />;
  if (error) return <Empty>Could not load tickets: {error.message}</Empty>;

  return (
    <Wrapper>
      <Head>
        <div>
          <h1 className="MH-Type-Heading-Base">Tickets</h1>
          <Summary>
            {openCount} open of {total} · {groups.length} of {SURFACES.length} surfaces
            have something filed
          </Summary>
        </div>
        <Toggle>
          <input
            id="mh-show-resolved"
            type="checkbox"
            checked={showResolved}
            onChange={(event) => setShowResolved(event.target.checked)}
          />
          <label htmlFor="mh-show-resolved">Include resolved</label>
        </Toggle>
      </Head>

      {groups.length === 0 ? (
        <Empty>
          Nothing filed yet. Press <kbd>Alt+Shift+T</kbd> on any page, or use the flag
          button in the bottom right, to file a ticket against the surface you are
          looking at.
        </Empty>
      ) : (
        groups.map(([surfaceKey, tickets]) => {
          const surface = getSurface(surfaceKey);
          return (
            <Group key={surfaceKey}>
              <GroupHead>
                <div>
                  <GroupName>{surface?.label ?? "Unregistered surface"}</GroupName>
                  <SurfaceKey>{surfaceKey}</SurfaceKey>
                </div>
                <GroupCount>{tickets.length}</GroupCount>
              </GroupHead>
              {!surface && (
                <Warn>
                  No entry in <code>lib/surfaces.js</code> — the surface was probably
                  renamed or removed. These tickets need re-pointing.
                </Warn>
              )}
              {surface?.root && <Root>{surface.root}</Root>}
              <Rows>
                {tickets.map((ticket) => (
                  <Row key={ticket.id}>
                    <Link href={`/dashboard/tickets/${ticket.id}`}>
                      <RowTitle>{ticket.title}</RowTitle>
                    </Link>
                    <Meta>
                      <Pill data-status={ticket.status}>
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </Pill>
                      <MetaText>{KIND_LABELS[ticket.kind] ?? ticket.kind}</MetaText>
                      {ticket.priority === "HIGH" && <Pill data-priority="HIGH">High</Pill>}
                      <MetaText>{ticket.reporter?.username ?? "unknown"}</MetaText>
                    </Meta>
                  </Row>
                ))}
              </Rows>
            </Group>
          );
        })
      )}
    </Wrapper>
  );
}

/* --- styles ------------------------------------------------------------- */

const Wrapper = styled.div`
  padding: 24px;
  max-width: 960px;

  h1 {
    margin: 0 0 4px;
  }
`;

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

const Summary = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Toggle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Group = styled.section`
  margin-bottom: 24px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  overflow: hidden;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const GroupHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
`;

const GroupName = styled.p`
  margin: 0;
  font: var(--MH-Type-Title-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const SurfaceKey = styled.p`
  margin: 2px 0 0;
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
`;

const Root = styled.p`
  margin: 0;
  padding: 8px 16px 0;
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const GroupCount = styled.span`
  flex: none;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Rows = styled.div`
  padding: 8px 0;
`;

const Row = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px 16px;

  &:hover {
    background: var(--MH-Theme-Primary-Light, #def8fb);
  }
`;

const RowTitle = styled.span`
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
`;

const MetaText = styled.span`
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  white-space: nowrap;
`;

const Pill = styled.span`
  padding: 2px 8px;
  border-radius: 100px;
  font: var(--MH-Type-Label-Small);
  white-space: nowrap;
  background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
  color: var(--MH-Theme-Neutrals-Black, #171717);

  &[data-status="OPEN"] {
    background: var(--MH-Theme-Accent-Light, #fdf2d0);
    color: var(--MH-Theme-Warning-Dark, #8f1f14);
  }
  &[data-status="IN_PROGRESS"] {
    background: var(--MH-Theme-Primary-Light, #def8fb);
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
  &[data-status="SHIPPED"] {
    background: var(--MH-Theme-Success, #e3f4ec);
    color: var(--MH-Theme-Success-Dark, #1d6b3a);
  }
  &[data-priority="HIGH"] {
    background: var(--MH-Theme-Warning-Light, #edcecd);
    color: var(--MH-Theme-Warning-Base, #b9261a);
  }
`;

const Empty = styled.p`
  padding: 24px;
  border: 1px dashed var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

  kbd {
    font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
    font-size: 0.9em;
    padding: 1px 5px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 4px;
  }
`;

const Warn = styled.p`
  margin: 8px 16px 0;
  padding: 8px 12px;
  border-radius: 8px;
  font: var(--MH-Type-Body-Small);
  background: var(--MH-Theme-Accent-Light, #fdf2d0);
  color: var(--MH-Theme-Warning-Dark, #8f1f14);

  code {
    font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  }
`;
