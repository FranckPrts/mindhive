const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  authorizeDataFile,
  readableDatasetDirs,
  authorizeDatasourceFileWrite,
} = require("./rawDataAccess");

const frontendRoot = path.resolve(__dirname, "../..");

// Stands in for Keystone: `datasets` is what the Dataset list filter lets the
// caller see, `datasource` what a Datasource lookup returns.
function keystone({ signedIn = true, datasets = [], datasource = null } = {}) {
  const calls = [];
  const query = async (gql, variables) => {
    calls.push({ gql, variables });
    return {
      authenticatedItem: signedIn ? { id: "me" } : null,
      datasets: datasets.filter((d) => variables.tokens.includes(d.token)),
      ...(variables.datasourceId ? { datasource } : {}),
    };
  };
  return { query, calls };
}

const file = { year: "2026", month: "10", day: "9", token: "tok1", type: "full" };

test("a readable Dataset's files are served", async () => {
  const { query } = keystone({ datasets: [{ token: "tok1", date: "2026-10-9" }] });
  assert.equal(await authorizeDataFile({ query, ...file }), "allowed");
  assert.equal(await authorizeDataFile({ query, ...file, type: "incremental" }), "allowed");
});

test("signed-out callers are refused before anything else", async () => {
  const { query } = keystone({
    signedIn: false,
    datasets: [{ token: "tok1", date: "2026-10-9" }],
  });
  assert.equal(await authorizeDataFile({ query, ...file }), "unauthenticated");
});

test("a Dataset the caller may not read is refused", async () => {
  const { query } = keystone({ datasets: [] });
  assert.equal(await authorizeDataFile({ query, ...file }), "denied");
});

test("the Dataset's own date must match the requested folder", async () => {
  const { query } = keystone({ datasets: [{ token: "tok1", date: "2026-10-8" }] });
  assert.equal(await authorizeDataFile({ query, ...file }), "denied");
});

test("journal files are served through the Datasource that points at them", async () => {
  const datasource = {
    content: { uploaded: { address: { year: 2026, month: 10, day: 9, token: "up1" } } },
  };
  const { query, calls } = keystone({ datasource });
  const upload = { ...file, token: "up1", type: "upload", datasourceId: "ds1" };
  assert.equal(await authorizeDataFile({ query, ...upload }), "allowed");
  assert.equal(calls[0].variables.datasourceId, "ds1");

  assert.equal(
    await authorizeDataFile({ query, ...upload, token: "other" }),
    "denied",
    "only the Datasource's own address"
  );
  assert.equal(
    await authorizeDataFile({ query, ...upload, datasourceId: undefined }),
    "denied",
    "a journal token is not a Dataset token"
  );
});

test("a Datasource cannot be pointed at a participant's results", async () => {
  // A signed-in user may write any address into a Datasource they create.
  const datasource = {
    content: { modified: { address: { year: 2026, month: 10, day: 9, token: "tok1" } } },
  };
  const { query } = keystone({ datasource });
  for (const type of ["full", "incremental"]) {
    assert.equal(
      await authorizeDataFile({ query, ...file, type, datasourceId: "ds1" }),
      "denied"
    );
  }
});

test("rawfiles serves only readable Datasets, from their own directories", async () => {
  const { query, calls } = keystone({
    datasets: [
      { token: "a", date: "2026-10-9" },
      { token: "b", date: "2026-1-2" },
    ],
  });
  const dirs = await readableDatasetDirs({
    query,
    fileDirs: [
      "2026/10/9/a",
      "../../etc/c", // not readable: dropped
      "1999/1/1/b", // readable, but read from the Dataset's own date
      "2026/10/9/a", // duplicates are served once
      null,
    ],
  });
  assert.deepEqual(dirs, [
    ["2026", "10", "9", "a"],
    ["2026", "1", "2", "b"],
  ]);
  assert.deepEqual(calls[0].variables.tokens, ["a", "c", "b"]);
});

test("rawfiles refuses signed-out callers", async () => {
  const { query } = keystone({ signedIn: false, datasets: [{ token: "a", date: "2026-10-9" }] });
  assert.equal(await readableDatasetDirs({ query, fileDirs: ["2026/10/9/a"] }), null);
});

test("both raw data routes check access before reading files", () => {
  const read = (p) => fs.readFileSync(path.join(frontendRoot, p), "utf8");
  const dataRoute = read("pages/api/data/[year]/[month]/[day]/[token].js");
  const rawRoute = read("pages/api/download/rawfiles.js");
  assert.match(dataRoute, /authorizeDataFile/);
  assert.match(dataRoute, /queryAsCaller/);
  assert.ok(dataRoute.indexOf("authorizeDataFile({") < dataRoute.indexOf("fs.readFile"));
  assert.match(rawRoute, /readableDatasetDirs/);
  assert.match(rawRoute, /queryAsCaller/);
  assert.doesNotMatch(rawRoute, /fileDirs\.map/);
  // the journal loader names its Datasource, which the route authorizes by
  const loader = read("components/Builder/Project/DataJournal/DataLoader/useDatasourceData.js");
  assert.equal((loader.match(/&datasource=\$\{id\}/g) || []).length, 2);
});

// Stands in for Keystone on a journal file save, as the caller "me".
function editor({ signedIn = true, datasource = null } = {}) {
  return async () => ({
    authenticatedItem: signedIn ? { id: "me" } : null,
    datasource,
  });
}

const uploaded = {
  dataOrigin: "UPLOADED",
  content: { uploaded: { address: { year: 2026, month: 4, day: 9, token: "up1" } } },
};

test("new journal files need a signed-in caller", async () => {
  assert.deepEqual(
    await authorizeDatasourceFileWrite({ query: editor(), payload: "upload" }),
    { status: "allowed", address: null }
  );
  assert.deepEqual(
    await authorizeDatasourceFileWrite({ query: editor({ signedIn: false }), payload: "upload" }),
    { status: "unauthenticated" }
  );
  for (const payload of ["full", "incremental", "simulated", undefined]) {
    assert.deepEqual(
      await authorizeDatasourceFileWrite({ query: editor(), payload }),
      { status: "invalid" }
    );
  }
});

test("a modified file is saved in place only by those who may edit the Datasource", async () => {
  const save = (datasource) =>
    authorizeDatasourceFileWrite({
      query: editor({ datasource }),
      payload: "modified",
      datasourceId: "ds1",
    });
  const inPlace = { status: "allowed", address: { year: 2026, month: 4, day: 9, token: "up1" } };

  assert.deepEqual(await save({ ...uploaded, author: { id: "me" } }), inPlace);
  assert.deepEqual(
    await save({ ...uploaded, author: { id: "x" }, collaboratorsCanEdit: true, collaborators: [{ id: "me" }] }),
    inPlace
  );
  assert.deepEqual(
    await save({ ...uploaded, author: { id: "x" }, collaboratorsCanEdit: false, collaborators: [{ id: "me" }] }),
    { status: "denied" }
  );
  assert.deepEqual(await save(null), { status: "denied" }, "not readable or missing");
});

test("a save picks the Datasource's current file, or a new one", async () => {
  const save = (datasource) =>
    authorizeDatasourceFileWrite({
      query: editor({ datasource: { author: { id: "me" }, ...datasource } }),
      payload: "modified",
      datasourceId: "ds1",
    });
  const modified = { year: 2026, month: 5, day: 1, token: "mod1" };
  assert.deepEqual(
    (await save({ content: { ...uploaded.content, isModified: true, modified: { address: modified } } })).address,
    modified
  );
  assert.equal((await save({ dataOrigin: "STUDY", content: null })).address, null, "first edit");
  assert.equal(
    (await save({ dataOrigin: "TEMPLATE", content: { ...uploaded.content } })).address,
    null,
    "a template copy does not overwrite the template's file"
  );
  assert.deepEqual(
    (await authorizeDatasourceFileWrite({ query: editor(), payload: "upload", datasourceId: "ds1" })),
    { status: "invalid" },
    "uploads never overwrite"
  );
});

test("data journal writers save through the authenticated endpoint", () => {
  const read = (p) => fs.readFileSync(path.join(frontendRoot, p), "utf8");
  const writers = [
    "components/Builder/Project/DataJournal/Datasets/Add/DatasetForm.js",
    "components/Builder/Project/DataJournal/Datasets/View/Menu/UpdateDatasource.js",
  ].map(read);
  for (const writer of writers) {
    assert.match(writer, /\/api\/datasource\/save/);
    assert.doesNotMatch(writer, /\/api\/save\?y=/);
  }
  const route = read("pages/api/datasource/save.ts");
  assert.match(route, /authorizeDatasourceFileWrite/);
  assert.match(route, /RESULT_FILES/);
});
