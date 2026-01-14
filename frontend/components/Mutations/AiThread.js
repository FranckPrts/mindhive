import gql from "graphql-tag";

// create new AI thread
export const CREATE_AI_THREAD = gql`
  mutation CREATE_AI_THREAD(
    $threadId: String!
    $assistantId: String!
    $proposalId: String
    $status: String
    $threadState: JSON
  ) {
    createAiThread(
      data: {
        threadId: $threadId
        assistantId: $assistantId
        proposalId: $proposalId
        status: $status
        threadState: $threadState
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
    $threadState: JSON
  ) {
    updateAiThread(
      where: { threadId: $threadId }
      data: { status: $status, threadState: $threadState }
    ) {
      id
      threadId
      status
    }
  }
`;

