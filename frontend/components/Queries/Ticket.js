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

// The tickets on one surface. Powers both the overlay's "what's already filed
// here" list — so the same thing doesn't get reported twice — and the badge
// count on the launcher.
//
// One surface at a time is enough while the badge lives on the launcher. A
// multi-surface variant (`surface: { in: $surfaces }`) becomes worth adding
// only when markers put badges on several panels of one screen at once.
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
