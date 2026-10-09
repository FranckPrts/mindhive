// Who may read the raw result files stored under data/<year>/<month>/<day>/<token>/.
//
// The files carry no owner of their own: each directory is named after the
// token of the record that owns it, and a caller may read it when Keystone lets
// them read that record. `query` runs a GraphQL request against Keystone with
// the caller's session cookie, so the list access rules apply to them:
// - a Dataset (participant results written by /api/save) is filtered by the
//   result access rule in keystone/lib/runtime/resultAccess.js — the
//   participant, the task and asset authors, the study's researchers, admins;
// - a data journal Datasource (uploaded, simulated or modified data) points at
//   its file through the address in its content, and the Datasource list
//   filter (keystone/lib/runtime/datasourceAccess.js) decides who may read it,
//   so who knows that address. Only those payload types are
//   served this way: a Datasource's content is free-form, so without the type
//   check one could be pointed at a participant's full/incremental results.

const DATASOURCE_FILE_TYPES = ["modified", "upload", "simulated"];

const DATASET_ACCESS_QUERY = `
  query RawDatasetAccess($tokens: [String!]!) {
    authenticatedItem { ... on Profile { id } }
    datasets(where: { token: { in: $tokens } }) { token date }
  }
`;

const DATASOURCE_ACCESS_QUERY = `
  query RawDatasourceAccess($tokens: [String!]!, $datasourceId: ID!) {
    authenticatedItem { ... on Profile { id } }
    datasets(where: { token: { in: $tokens } }) { token date }
    datasource(where: { id: $datasourceId }) { content }
  }
`;

// The directory a Dataset's files are written to (see pages/api/save.ts).
function datasetDir(dataset) {
  const [year, month, day] = String(dataset?.date ?? "").split("-");
  return [year, month, day, dataset?.token];
}

function datasourceDirs(content) {
  return ["modified", "uploaded"]
    .map((key) => content?.[key]?.address)
    .filter((address) => address?.token)
    .map(({ year, month, day, token }) => [year, month, day, token]);
}

function sameDir(a, b) {
  return a.length === b.length && a.every((part, i) => String(part) === String(b[i]));
}

// "allowed", "unauthenticated" or "denied" for one file of /api/data.
async function authorizeDataFile({ query, year, month, day, token, type, datasourceId }) {
  const requested = [year, month, day, token];
  const result = datasourceId
    ? await query(DATASOURCE_ACCESS_QUERY, { tokens: [token], datasourceId })
    : await query(DATASET_ACCESS_QUERY, { tokens: [token] });

  if (!result?.authenticatedItem?.id) return "unauthenticated";

  if ((result.datasets || []).some((dataset) => sameDir(datasetDir(dataset), requested))) {
    return "allowed";
  }
  if (
    datasourceId &&
    DATASOURCE_FILE_TYPES.includes(type) &&
    datasourceDirs(result.datasource?.content).some((dir) => sameDir(dir, requested))
  ) {
    return "allowed";
  }
  return "denied";
}

// The Dataset directories among `fileDirs` ("year/month/day/token") that the
// caller may read, rebuilt from the Datasets themselves — `fileDirs` only says
// which tokens are wanted. Null when the caller is not signed in.
async function readableDatasetDirs({ query, fileDirs }) {
  const tokens = [
    ...new Set(
      fileDirs
        .map((dir) => (typeof dir === "string" ? dir.split("/").filter(Boolean).pop() : null))
        .filter(Boolean)
    ),
  ];
  const result = await query(DATASET_ACCESS_QUERY, { tokens });
  if (!result?.authenticatedItem?.id) return null;

  const dirByToken = new Map(
    (result.datasets || []).map((dataset) => [dataset.token, datasetDir(dataset)])
  );
  return tokens.filter((token) => dirByToken.has(token)).map((token) => dirByToken.get(token));
}

const SIGNED_IN_QUERY = `
  query DatasourceFileCreate {
    authenticatedItem { ... on Profile { id } }
  }
`;

const DATASOURCE_EDIT_QUERY = `
  query DatasourceFileEdit($datasourceId: ID!) {
    authenticatedItem { ... on Profile { id } }
    datasource(where: { id: $datasourceId }) {
      dataOrigin
      content
      collaboratorsCanEdit
      author { id }
      collaborators { id }
    }
  }
`;

// Mirrors the Datasource item update rule in keystone/schemas/Datasource.ts.
function canEditDatasource(datasource, me) {
  if (!datasource) return false;
  if (datasource.author?.id === me) return true;
  return (
    !!datasource.collaboratorsCanEdit &&
    (datasource.collaborators || []).some((collaborator) => collaborator?.id === me)
  );
}

// The file a save of `datasource` overwrites, or null when it starts a new one:
// it has none yet, or it still points at the file of the template it was
// copied from, which belongs to that template.
function datasourceSaveAddress(datasource) {
  const content = datasource?.content;
  if (datasource?.dataOrigin === "TEMPLATE" && !content?.isTemplateModified) return null;
  const address = content?.[content?.isModified ? "modified" : "uploaded"]?.address;
  if (!address?.token || address.year == null || address.month == null || address.day == null) {
    return null;
  }
  return { year: address.year, month: address.month, day: address.day, token: address.token };
}

// Where a data journal file may be written. Uploads always start a new file;
// a modified file is written in place when `datasourceId` names a Datasource
// the caller may edit, else as a new file (a copy, or a first edit).
// Returns { status: "allowed", address } — address null for a new file — or
// { status: "invalid" | "unauthenticated" | "denied" }.
async function authorizeDatasourceFileWrite({ query, payload, datasourceId }) {
  if (payload !== "upload" && payload !== "modified") return { status: "invalid" };
  if (payload === "upload" && datasourceId) return { status: "invalid" };

  if (!datasourceId) {
    const result = await query(SIGNED_IN_QUERY, {});
    if (!result?.authenticatedItem?.id) return { status: "unauthenticated" };
    return { status: "allowed", address: null };
  }

  const result = await query(DATASOURCE_EDIT_QUERY, { datasourceId });
  const me = result?.authenticatedItem?.id;
  if (!me) return { status: "unauthenticated" };
  if (!canEditDatasource(result.datasource, me)) return { status: "denied" };
  return { status: "allowed", address: datasourceSaveAddress(result.datasource) };
}

module.exports = {
  DATASOURCE_FILE_TYPES,
  authorizeDataFile,
  readableDatasetDirs,
  authorizeDatasourceFileWrite,
};
