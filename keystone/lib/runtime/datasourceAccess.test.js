const test = require("node:test");
const assert = require("node:assert/strict");
const { buildDatasourceAccessFilter } = require("./datasourceAccess");

// A context whose researcher-study lookup returns `studyIds`.
function fakeContext(studyIds = []) {
  return {
    req: {},
    prisma: {
      study: { findMany: async () => studyIds.map((id) => ({ id })) },
    },
  };
}

const noClasses = async () => [];

test("anonymous callers read no Datasource; admins read all", async () => {
  assert.equal(
    await buildDatasourceAccessFilter(undefined, false, fakeContext(), noClasses),
    false
  );
  assert.equal(
    await buildDatasourceAccessFilter({ itemId: "a" }, true, fakeContext(), noClasses),
    true
  );
});

test("owners, collaborators, study and board members, public templates", async () => {
  const filter = await buildDatasourceAccessFilter(
    { itemId: "me" },
    false,
    fakeContext(["s1"]),
    noClasses
  );
  assert.deepEqual(filter.OR[0], { author: { id: { equals: "me" } } });
  assert.deepEqual(filter.OR[1], {
    collaborators: { some: { id: { equals: "me" } } },
  });
  assert.ok(filter.OR.some((c) => c.study?.id?.in?.includes("s1")));
  assert.ok(filter.OR.some((c) => c.project?.OR));
  const viaJournal = filter.OR.find((c) => c.journal?.some?.vizJournal);
  assert.ok(viaJournal.journal.some.vizJournal.OR.some((c) => c.study?.id?.in));
  assert.ok(filter.OR.some((c) => c.journal?.some?.AND));
  // without classes no class clause is added
  assert.ok(!JSON.stringify(filter).includes("usedInClass"));
});

test("class members see the class's studies and boards", async () => {
  const filter = await buildDatasourceAccessFilter(
    { itemId: "me" },
    false,
    fakeContext(),
    async () => ["c1", "c2"]
  );
  const inClasses = { some: { id: { in: ["c1", "c2"] } } };
  assert.ok(filter.OR.some((c) => JSON.stringify(c) === JSON.stringify({ study: { classes: inClasses } })));
  assert.ok(filter.OR.some((c) => c.project?.usedInClass));
  assert.ok(filter.OR.some((c) => c.project?.templateForClasses));
});
