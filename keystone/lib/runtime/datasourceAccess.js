const { researcherStudyIds } = require("./resultAccess");

// Data journal Datasources a user may read: the ones the Data Journal lists for
// them (frontend/lib/dataJournalDatasources.js) — their own, the ones shared
// with them, the ones of a study or project board they work on or meet in one
// of their classes (directly or through a class network), and the ones of a
// public template journal. A Datasource's content holds the address of its
// uploaded or modified data file, which /api/data serves to whoever can read
// the Datasource, so this filter guards those files as well.
//
// `loadClassIds(context)` resolves the classes the user belongs to plus the
// peer classes of those classes' networks (access.ts datasourceClassIds).
async function buildDatasourceAccessFilter(session, isAdmin, context, loadClassIds) {
  if (!session?.itemId) return false;
  if (isAdmin) return true;
  const me = String(session.itemId);
  const [studyIds, classIds] = await Promise.all([
    researcherStudyIds(context, me),
    loadClassIds(context),
  ]);

  // Holds for a Datasource and for a VizJournal alike: both link a study and a
  // project board.
  const workspace = [
    { study: { id: { in: studyIds } } },
    {
      project: {
        OR: [
          { author: { id: { equals: me } } },
          { collaborators: { some: { id: { equals: me } } } },
        ],
      },
    },
  ];
  if (classIds.length) {
    const inClasses = { some: { id: { in: classIds } } };
    workspace.push(
      { study: { classes: inClasses } },
      { project: { usedInClass: { id: { in: classIds } } } },
      { project: { templateForClasses: inClasses } }
    );
  }

  return {
    OR: [
      { author: { id: { equals: me } } },
      { collaborators: { some: { id: { equals: me } } } },
      ...workspace,
      { journal: { some: { vizJournal: { OR: workspace } } } },
      {
        journal: {
          some: {
            AND: [{ isPublic: { equals: true } }, { isTemplate: { equals: true } }],
          },
        },
      },
    ],
  };
}

module.exports = { buildDatasourceAccessFilter };
