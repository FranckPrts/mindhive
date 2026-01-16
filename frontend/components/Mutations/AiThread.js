import gql from "graphql-tag";

// create new AI thread
export const CREATE_AI_THREAD = gql`
  mutation CREATE_AI_THREAD(
    $threadId: String!
    $assistantId: String!
    $proposalId: String
    $status: String
  ) {
    createAiThread(
      data: {
        threadId: $threadId
        assistantId: $assistantId
        proposalId: $proposalId
        status: $status
      }
    ) {
      id
      threadId
      status
    }
  }
`;

// update AI thread
export const UPDATE_AI_THREAD = gql`
  mutation UPDATE_AI_THREAD(
    $threadId: String!
    $status: String
  ) {
    updateAiThread(
      where: { threadId: $threadId }
      data: { status: $status }
    ) {
      id
      threadId
      status
    }
  }
`;

