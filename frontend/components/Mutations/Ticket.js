import gql from "graphql-tag";

// Filing. The screenshot is optional and uploaded in the same mutation via
// apollo-upload-client, so a slow or refused capture never blocks the ticket —
// see TicketOverlay, which files without one rather than failing.
export const CREATE_TICKET = gql`
  mutation CREATE_TICKET(
    $surface: String!
    $title: String!
    $kind: TicketKindType
    $priority: TicketPriorityType
    $body: JSON
    $evidence: JSON
    $reporterId: ID!
    $screenshot: Upload
  ) {
    createTicket(
      data: {
        surface: $surface
        title: $title
        kind: $kind
        priority: $priority
        body: $body
        evidence: $evidence
        reporter: { connect: { id: $reporterId } }
        screenshot: { upload: $screenshot }
      }
    ) {
      id
      surface
      status
    }
  }
`;

export const SET_TICKET_STATUS = gql`
  mutation SET_TICKET_STATUS($id: ID!, $status: TicketStatusType!) {
    updateTicket(where: { id: $id }, data: { status: $status }) {
      id
      status
      resolvedAt
    }
  }
`;

export const EDIT_TICKET = gql`
  mutation EDIT_TICKET($id: ID!, $input: TicketUpdateInput!) {
    updateTicket(where: { id: $id }, data: $input) {
      id
    }
  }
`;

export const DELETE_TICKET = gql`
  mutation DELETE_TICKET($id: ID!) {
    deleteTicket(where: { id: $id }) {
      id
    }
  }
`;
