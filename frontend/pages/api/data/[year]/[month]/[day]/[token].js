import path from "path";
import { promises as fs } from "fs";
import { validatePathSegment, assertWithinBase } from "../../../../../../lib/api/paths";
import { queryAsCaller } from "../../../../../../lib/api/auth";
import { authorizeDataFile } from "../../../../../../lib/api/rawDataAccess";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const { query } = req;
  // `datasource` is the data journal Datasource whose uploaded or modified
  // file this is; without it the token must be a Dataset's.
  const { year, month, day, token, type, datasource } = query;

  try {
    validatePathSegment(year, "year");
    validatePathSegment(month, "month");
    validatePathSegment(day, "day");
    validatePathSegment(token, "token");
    validatePathSegment(type, "type");
    if (datasource !== undefined) validatePathSegment(datasource, "datasource");
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  // Find the absolute path of the json directory
  const jsonDirectory = path.join(process.cwd(), "data");
  const filePath = path.join(jsonDirectory, year, month, day, token, `${type}.json`);
  try {
    assertWithinBase(filePath, jsonDirectory);
  } catch (e) {
    return res.status(400).json({ error: "Invalid path parameters." });
  }

  let access;
  try {
    access = await authorizeDataFile({
      query: (gql, variables) => queryAsCaller(req, gql, variables),
      year,
      month,
      day,
      token,
      type,
      datasourceId: datasource,
    });
  } catch (e) {
    return res.status(502).json({ error: "Could not verify access to the data." });
  }
  if (access === "unauthenticated") {
    return res.status(401).json({ error: "Authentication required." });
  }
  // Not found rather than forbidden, so a token cannot be probed for existence.
  if (access !== "allowed") {
    return res.status(404).json({ error: "Data not found." });
  }

  let fileContents;
  try {
    fileContents = await fs.readFile(filePath, "utf8");
  } catch (e) {
    return res.status(404).json({ error: "Data not found." });
  }

  // Return the content of the data file in json format
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json(fileContents);
}
