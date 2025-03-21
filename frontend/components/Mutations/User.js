import gql from "graphql-tag";

// sign up
export const SIGNUP_MUTATION = gql`
  mutation SIGNUP_MUTATION($input: ProfileCreateInput!) {
    createProfile(data: $input) {
      id
      username
      email
    }
  }
`;

// sign in
export const SIGNIN_MUTATION = gql`
  mutation SIGNIN_MUTATION($email: String!, $password: String!) {
    authenticateProfileWithPassword(email: $email, password: $password) {
      ... on ProfileAuthenticationWithPasswordSuccess {
        item {
          id
        }
      }
      ... on ProfileAuthenticationWithPasswordFailure {
        message
      }
    }
  }
`;

// send password reset link
export const REQUEST_RESET_MUTATION = gql`
  mutation REQUEST_RESET_MUTATION($email: String!) {
    sendProfilePasswordResetLink(email: $email)
  }
`;

// sign out
export const SIGN_OUT_MUTATION = gql`
  mutation {
    endSession
  }
`;

// update information about user
export const UPDATE_USER = gql`
  mutation UPDATE_USER(
    $id: ID!
    $email: String
    $username: String
    $location: String
    $language: String
    $bio: String
  ) {
    updateProfile(
      where: { id: $id }
      data: {
        email: $email
        username: $username
        location: $location
        language: $language
        bio: $bio
      }
    ) {
      id
    }
  }
`;

// update image of the profile
export const UPDATE_PROFILE_IMAGE = gql`
  mutation UPDATE_PROFILE_IMAGE($id: ID!, $image: Upload) {
    updateProfile(
      where: { id: $id }
      data: { image: { create: { image: $image } } }
    ) {
      id
    }
  }
`;

// join the study as a participant
export const JOIN_STUDY_MUTATION = gql`
  mutation JOIN_STUDY_MUTATION($id: ID!, $studyId: ID!) {
    updateProfile(
      where: { id: $id }
      data: { participantIn: { connect: { id: $studyId } } }
    ) {
      id
    }
  }
`;

// join the class as a student
export const JOIN_CLASS_AS_STUDENT_MUTATION = gql`
  mutation JOIN_CLASS_AS_STUDENT_MUTATION($id: ID!, $classCode: String!) {
    updateProfile(
      where: { id: $id }
      data: {
        permissions: { connect: { name: "STUDENT" } }
        studentIn: { connect: { code: $classCode } }
      }
    ) {
      id
    }
  }
`;

// join the class as a mentor
export const JOIN_CLASS_AS_MENTOR_MUTATION = gql`
  mutation JOIN_CLASS_AS_MENTOR_MUTATION($id: ID!, $classCode: String!) {
    updateProfile(
      where: { id: $id }
      data: {
        permissions: { connect: { name: "MENTOR" } }
        mentorIn: { connect: { code: $classCode } }
      }
    ) {
      id
    }
  }
`;

// reset password
export const RESET_MUTATION = gql`
  mutation RESET_MUTATION(
    $email: String!
    $password: String!
    $token: String!
  ) {
    redeemProfilePasswordResetToken(
      email: $email
      password: $password
      token: $token
    ) {
      code
      message
    }
  }
`;

// manage profile
export const MANAGE_FAVORITE_TASKS = gql`
  mutation MANAGE_FAVORITE_TASKS(
    $id: ID!
    $taskAction: TaskRelateToManyForUpdateInput!
  ) {
    updateProfile(where: { id: $id }, data: { favoriteTasks: $taskAction }) {
      id
    }
  }
`;

// UPDATE FROM HERE LATER
// follow user
export const FOLLOW_USER_MUTATION = gql`
  mutation FOLLOW_USER_MUTATION($id: ID!, $userId: ID!) {
    updateUser(
      where: { id: $id }
      data: { followedBy: { connect: { id: $userId } } }
    ) {
      id
    }
  }
`;

// unfollow user
export const UNFOLLOW_USER_MUTATION = gql`
  mutation UNFOLLOW_USER_MUTATION($id: ID!, $userId: ID!) {
    updateUser(
      where: { id: $id }
      data: { followedBy: { disconnect: { id: $userId } } }
    ) {
      id
    }
  }
`;

// update user study information
export const UPDATE_USER_STUDY_INFO = gql`
  mutation UPDATE_USER_STUDY_INFO($id: ID!, $studiesInfo: JSON) {
    updateProfile(where: { id: $id }, data: { studiesInfo: $studiesInfo }) {
      id
    }
  }
`;

// update the profile information
export const UPDATE_PROFILE = gql`
  mutation UPDATE_PROFILE($id: ID!, $input: ProfileUpdateInput!) {
    updateProfile(where: { id: $id }, data: $input) {
      id
    }
  }
`;

// manage profile
export const MANAGE_FAVORITE_PEOPLE = gql`
  mutation MANAGE_FAVORITE_PEOPLE(
    $id: ID!
    $action: ProfileRelateToManyForUpdateInput!
  ) {
    updateProfile(where: { id: $id }, data: { favoritePeople: $action }) {
      id
    }
  }
`;
