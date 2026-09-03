import gql from "graphql-tag";

// Filing comes in two documents rather than one with an optional variable.
//
// Keystone's `ImageFieldInput.upload` is `Upload!`, so a nullable `$screenshot`
// cannot be passed to it — and GraphQL has no way to omit an input field
// conditionally. Attempting it fails validation before the request is even
// executed:
//
//   Variable "$screenshot" of type "Upload" used in position expecting "Upload!"
//
// So the with-screenshot case is its own mutation, and TicketOverlay picks
// whichever one it has a file for. Filing must work without an image — a
// refused or failed capture never blocks the written report.

const CREATE_VARS = `
  $surface: String!
  $title: String!
  $kind: TicketKindType
  $priority: TicketPriorityType
  $body: JSON
  $evidence: JSON
  $reporterId: ID!
`;

const CREATE_FIELDS = `
  surface: $surface
  title: $title
  kind: $kind
  priority: $priority
  body: $body
  evidence: $evidence
  reporter: { connect: { id: $reporterId } }
`;

const CREATED = `
  id
  surface
  status
`;

export const CREATE_TICKET = gql`
  mutation CREATE_TICKET(${CREATE_VARS}) {
    createTicket(data: { ${CREATE_FIELDS} }) {
      ${CREATED}
    }
  }
`;

export const CREATE_TICKET_WITH_SCREENSHOT = gql`
  mutation CREATE_TICKET_WITH_SCREENSHOT(${CREATE_VARS} $screenshot: Upload!) {
    createTicket(
      data: { ${CREATE_FIELDS} screenshot: { upload: $screenshot } }
    ) {
      ${CREATED}
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
