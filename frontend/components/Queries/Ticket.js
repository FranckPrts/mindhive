import gql from "graphql-tag";

const TICKET_SUMMARY = `
  id
  surface
  title
  kind
  status
  priority
  createdAt
  reporter {
    id
    username
  }
`;

// The whole board. Ordered so open work sits at the top of each surface group.
export const GET_TICKETS = gql`
  query GET_TICKETS {
    tickets(orderBy: [{ createdAt: desc }]) {
      ${TICKET_SUMMARY}
    }
  }
`;

// Powers the in-page badge: how many open tickets sit on the surfaces currently
// on screen. Deliberately asks for ids only — this runs on every navigation, so
// it stays the cheapest query that can produce a count.
export const COUNT_OPEN_TICKETS_BY_SURFACE = gql`
  query COUNT_OPEN_TICKETS_BY_SURFACE($surfaces: [String!]!) {
    tickets(
      where: {
        surface: { in: $surfaces }
        status: { notIn: [SHIPPED, WONTFIX] }
      }
    ) {
      id
      surface
      status
      kind
    }
  }
`;

// The tickets on one surface, for the overlay's "what's already filed here"
// list — so the same thing doesn't get reported twice.
export const GET_TICKETS_FOR_SURFACE = gql`
  query GET_TICKETS_FOR_SURFACE($surface: String!) {
    tickets(
      where: { surface: { equals: $surface } }
      orderBy: [{ createdAt: desc }]
    ) {
      ${TICKET_SUMMARY}
    }
  }
`;

export const GET_TICKET = gql`
  query GET_TICKET($id: ID!) {
    ticket(where: { id: $id }) {
      ${TICKET_SUMMARY}
      body
      evidence
      figmaNodeId
      notionPageId
      updatedAt
      resolvedAt
      assignee {
        id
        username
      }
      screenshot {
        id
        url
        width
        height
      }
    }
  }
`;
