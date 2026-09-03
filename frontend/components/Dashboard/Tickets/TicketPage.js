import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import styled from "styled-components";

import { GET_TICKET, GET_TICKETS } from "../../Queries/Ticket";
import { SET_TICKET_STATUS } from "../../Mutations/Ticket";
import { getSurface } from "../../../lib/surfaces";
import BeehiveLoading from "../../DesignSystem/BeehiveLoading";
import Button from "../../DesignSystem/Button";
import CopyButton from "../../DesignSystem/CopyButton";

/**
 * One ticket, with the evidence captured when it was filed.
 *
 * The evidence block is deliberately verbatim rather than prettified: the
 * viewport, locale and role at filing time are often the whole explanation for
 * a bug that nobody else can reproduce.
 */

const STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "WONTFIX", label: "Won't fix" },
];

const CLOSEABLE = ["OPEN", "ACCEPTED", "IN_PROGRESS"];

const KIND_LABELS = {
  BUG: "Bug",
  DESIGN_DRIFT: "Design drift",
  MISSING: "Missing",
  COPY: "Copy",
  IDEA: "Idea",
};

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

export default function TicketPage({ id }) {
  const { data, loading, error } = useQuery(GET_TICKET, { variables: { id } });
  const [setStatus, { loading: saving }] = useMutation(SET_TICKET_STATUS, {
    refetchQueries: [{ query: GET_TICKETS }],
  });

  if (loading && !data) return <BeehiveLoading />;
  if (error) return <Wrapper>Could not load this ticket: {error.message}</Wrapper>;

  const ticket = data?.ticket;
  if (!ticket) {
    return (
      <Wrapper>
        <p>No such ticket, or you do not have access to it.</p>
        <Link href="/dashboard/tickets">Back to the board</Link>
      </Wrapper>
    );
  }

  const surface = getSurface(ticket.surface);
  const evidence = ticket.evidence ?? {};
  const description = ticket.body?.text ?? null;

  return (
    <Wrapper>
      <Back>
        <Link href="/dashboard/tickets">← Board</Link>
      </Back>

      <h1 className="MH-Type-Heading-Small">{ticket.title}</h1>

      <Facts>
        <Fact>
          <dt>Surface</dt>
          <dd>
            {surface?.label ?? "Unregistered"}
            <SurfaceKey>{ticket.surface}</SurfaceKey>
          </dd>
        </Fact>
        <Fact>
          <dt>Kind</dt>
          <dd>{KIND_LABELS[ticket.kind] ?? ticket.kind}</dd>
        </Fact>
        <Fact>
          <dt>Priority</dt>
          <dd>{ticket.priority?.toLowerCase()}</dd>
        </Fact>
        <Fact>
          <dt>Reported by</dt>
          <dd>{ticket.reporter?.username ?? "unknown"}</dd>
        </Fact>
        <Fact>
          <dt>Filed</dt>
          <dd>{formatDate(ticket.createdAt)}</dd>
        </Fact>
        {ticket.resolvedAt && (
          <Fact>
            <dt>Resolved</dt>
            <dd>{formatDate(ticket.resolvedAt)}</dd>
          </Fact>
        )}
        {surface?.root && (
          <Fact>
            <dt>Code</dt>
            <dd>
              <Mono>{surface.root}</Mono>
            </dd>
          </Fact>
        )}
        {surface?.figmaNodeId && (
          <Fact>
            <dt>Figma frame</dt>
            <dd>
              <Mono>{surface.figmaNodeId}</Mono>
            </dd>
          </Fact>
        )}
        {ticket.notionPageId && (
          <Fact>
            <dt>Notion</dt>
            <dd>
              <Mono>{ticket.notionPageId}</Mono>
            </dd>
          </Fact>
        )}
      </Facts>

      <StatusBar>
        <label htmlFor="mh-ticket-status">Status</label>
        <select
          id="mh-ticket-status"
          value={ticket.status}
          disabled={saving}
          onChange={(event) =>
            setStatus({ variables: { id: ticket.id, status: event.target.value } })
          }
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        {evidence.url && (
          <Button
            variant="outline"
            onClick={() => window.open(evidence.url, "_blank", "noopener")}
          >
            Open the page it was filed from
          </Button>
        )}
      </StatusBar>

      {CLOSEABLE.includes(ticket.status) && (
        <Section>
          <h2 className="MH-Type-Title-Base">Close it from the commit that fixes it</h2>
          <TrailerRow>
            <Trailer>{`Fixes-Ticket: ${ticket.id}`}</Trailer>
            <CopyButton value={`Fixes-Ticket: ${ticket.id}`}>Copy trailer</CopyButton>
          </TrailerRow>
          <Caption>
            Paste this line into the commit message. On merge to main the ticket moves
            to Shipped here and in Notion, and the commit sha is recorded below — so
            the board empties in step with the work rather than by hand.
          </Caption>
        </Section>
      )}

      {description && (
        <Section>
          <h2 className="MH-Type-Title-Base">What should happen</h2>
          <Description>{description}</Description>
        </Section>
      )}

      {ticket.screenshot?.url && (
        <Section>
          <h2 className="MH-Type-Title-Base">At filing time</h2>
          <Shot
            src={ticket.screenshot.url}
            alt={`Screenshot captured when "${ticket.title}" was filed`}
            width={ticket.screenshot.width}
            height={ticket.screenshot.height}
          />
          {/* 90 days mirrors SCREENSHOT_RETENTION_DAYS in the backend's
              mutations/pruneTicketScreenshots.ts — keep the two in step. */}
          <Caption>
            Deleted automatically once this ticket has been resolved for 90 days.
          </Caption>
        </Section>
      )}

      <Section>
        <h2 className="MH-Type-Title-Base">Evidence</h2>
        <Evidence>
          {Object.entries(evidence).map(([key, value]) => (
            <EvidenceRow key={key}>
              <EvidenceKey>{key}</EvidenceKey>
              <EvidenceValue>
                {typeof value === "object" && value !== null
                  ? JSON.stringify(value)
                  : String(value)}
              </EvidenceValue>
            </EvidenceRow>
          ))}
          {Object.keys(evidence).length === 0 && <Caption>Nothing captured.</Caption>}
        </Evidence>
      </Section>
    </Wrapper>
  );
}

/* --- styles ------------------------------------------------------------- */

const Wrapper = styled.div`
  padding: 24px;
  max-width: 800px;

  h1 {
    margin: 0 0 16px;
  }
  h2 {
    margin: 0 0 8px;
  }
`;

const Back = styled.p`
  margin: 0 0 12px;
  font: var(--MH-Type-Label-Base);

  a {
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const Facts = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px 24px;
  margin: 0 0 20px;
  padding: 16px;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
`;

const Fact = styled.div`
  dt {
    font: var(--MH-Type-Label-Small);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    margin-bottom: 2px;
  }
  dd {
    margin: 0;
    font: var(--MH-Type-Body-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const SurfaceKey = styled.span`
  display: block;
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
`;

const Mono = styled.span`
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 13px;
  word-break: break-all;
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  label {
    font: var(--MH-Type-Label-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
  select {
    padding: 8px 12px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 8px;
    font: var(--MH-Type-Body-Base);
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const TrailerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Trailer = styled.code`
  flex: 1 1 20rem;
  padding: 8px 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 8px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 13px;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  word-break: break-all;
`;

const Section = styled.section`
  margin-bottom: 24px;
`;

const Description = styled.p`
  margin: 0;
  white-space: pre-wrap;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Shot = styled.img`
  display: block;
  max-width: 100%;
  height: auto;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 8px;
`;

const Caption = styled.p`
  margin: 8px 0 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Evidence = styled.div`
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 8px;
  overflow: hidden;
`;

const EvidenceRow = styled.div`
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);

  &:last-child {
    border-bottom: none;
  }
`;

const EvidenceKey = styled.span`
  flex: 0 0 120px;
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const EvidenceValue = styled.span`
  flex: 1;
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  word-break: break-all;
`;
