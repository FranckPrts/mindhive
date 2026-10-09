import path from "path";
import fs from "fs";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { saveDataLimiter } from "../../../lib/api/rateLimit";
import { queryAsCaller } from "../../../lib/api/auth";
import { validatePathSegment, assertWithinBase } from "../../../lib/api/paths";

const { authorizeDatasourceFileWrite } = require("../../../lib/api/rawDataAccess");

export const config = {
  api: {
    bodyParser: { sizeLimit: "50mb" },
  },
};

// Participant results (pages/api/save.ts). A journal file is never written
// into their folder, whatever address a Datasource's content claims.
const RESULT_FILES = ["full.json", "incremental.json"];

// Stores the data file of a data journal Datasource — an uploaded table or a
// modified copy of a dataset — at data/<year>/<month>/<day>/<token>/<payload>.json,
// where /api/data serves it from. The caller then records the returned address
// in the Datasource's content.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  if (!saveDataLimiter(req, res)) return;

  const { payload, datasourceId, data, variables, settings } = req.body || {};
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "data must be a list." });
  }
  try {
    if (datasourceId !== undefined) validatePathSegment(datasourceId, "datasource");
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }

  let access;
  try {
    access = await authorizeDatasourceFileWrite({
      query: (gql: string, vars: Record<string, unknown>) => queryAsCaller(req, gql, vars),
      payload,
      datasourceId,
    });
  } catch {
    return res.status(502).json({ error: "Could not verify access to the dataset." });
  }
  if (access.status === "invalid") {
    return res.status(400).json({ error: "Invalid payload." });
  }
  if (access.status === "unauthenticated") {
    return res.status(401).json({ error: "Authentication required." });
  }
  if (access.status !== "allowed") {
    return res.status(403).json({ error: "You may not edit this dataset." });
  }

  const now = new Date();
  const isNew = !access.address;
  const address = access.address || {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    token: crypto.randomBytes(12).toString("hex"),
  };
  const segments = [address.year, address.month, address.day, address.token].map(String);

  const dirData = path.resolve(process.cwd(), "data");
  let dir: string;
  try {
    segments.forEach((segment) => validatePathSegment(segment, "data path"));
    dir = path.resolve(dirData, ...segments);
    assertWithinBase(dir, dirData);
  } catch {
    return res.status(400).json({ error: "Invalid data path." });
  }
  if (!isNew && RESULT_FILES.some((file) => fs.existsSync(path.join(dir, file)))) {
    return res.status(403).json({ error: "You may not edit this dataset." });
  }

  const metadata = {
    id: address.token,
    payload,
    timestampUploaded: Date.now(),
  };
  const file = {
    metadata: {
      ...metadata,
      variables,
      ...(settings !== undefined && { settings }),
    },
    data,
  };

  // The formats /api/data readers parse: an upload ends with ",\n" (the
  // Lab.js append format the loader strips), a modified file is plain JSON.
  try {
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(
      path.join(dir, `${payload}.json`),
      JSON.stringify(file) + (payload === "upload" ? ",\n" : "\n"),
      { flag: isNew ? "wx" : "w" }
    );
  } catch {
    return res.status(500).json({ error: "The data could not be stored." });
  }

  return res.status(200).json({ address, metadata });
}
