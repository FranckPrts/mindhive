import path from "path";
import { validatePathSegment, assertWithinBase } from "../../../lib/api/paths";
import { queryAsCaller } from "../../../lib/api/auth";
import { readableDatasetDirs } from "../../../lib/api/rawDataAccess";

const fs = require("fs");

// The old Express server parsed every body with a 10mb limit before Next saw
// the request; without this override Next's 1mb default would reject large
// fileDirs lists from big studies.
export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
    responseLimit: false, // raw study data downloads routinely exceed Next's 4MB warning threshold
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const { fileDirs } = req.body || {};
  if (!Array.isArray(fileDirs)) {
    return res.status(400).json({ error: "fileDirs must be a list." });
  }

  // Only the Datasets the caller may read are served, from the directories
  // their own token and date name; requested dirs naming any other token are
  // left out, as missing files always were.
  let dirs;
  try {
    dirs = await readableDatasetDirs({
      query: (gql, variables) => queryAsCaller(req, gql, variables),
      fileDirs,
    });
  } catch (e) {
    return res.status(502).json({ error: "Could not verify access to the data." });
  }
  if (!dirs) {
    return res.status(401).json({ error: "Authentication required." });
  }

  // Find the absolute path of the json directory
  const jsonDirectory = path.join(process.cwd(), "data");

  const promises = dirs.map(function (segments) {
    return new Promise(function (resolve) {
      let filePath;
      try {
        segments.forEach((segment) => validatePathSegment(segment, "data path"));
        filePath = path.resolve(jsonDirectory, ...segments, "full.json");
        assertWithinBase(filePath, jsonDirectory);
      } catch (e) {
        resolve("");
        return;
      }
      fs.readFile(filePath, "utf8", function (err, data) {
        if (err || !data) {
          resolve("");
        } else {
          resolve(data);
        }
      });
    });
  });

  Promise.all(promises).then(function (results) {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
    });
    res.write("[");
    results.forEach(function (content) {
      res.write(content);
    });
    res.write("{}]");
    res.end();
  });
}
