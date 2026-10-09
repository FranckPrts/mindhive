import axios from "axios";
import type { NextApiRequest } from "next";
import { serverGraphqlUrl } from "./graphql";

// Run a GraphQL request against Keystone as the caller, by forwarding their
// cookie, so the list access rules apply to their session.
export async function queryAsCaller(
  req: NextApiRequest,
  query: string,
  variables: Record<string, unknown>
) {
  const response = await axios.post(
    serverGraphqlUrl,
    { query, variables },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: req.headers.cookie || "",
      },
    }
  );
  if (response.data?.errors?.length) {
    throw new Error(response.data.errors[0].message || "Keystone request failed");
  }
  return response.data.data;
}

// Verify the caller has an active Keystone session by forwarding their cookie.
export async function isAuthenticated(req: NextApiRequest): Promise<boolean> {
  try {
    const response = await axios({
      method: "post",
      url: serverGraphqlUrl,
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.cookie || "",
      },
      data: JSON.stringify({
        query: "{ authenticatedItem { ... on Profile { id } } }",
      }),
    });
    return !!response.data?.data?.authenticatedItem?.id;
  } catch {
    return false;
  }
}
