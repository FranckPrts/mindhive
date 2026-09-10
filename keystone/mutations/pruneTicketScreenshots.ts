import { createHash, timingSafeEqual } from "crypto";

// Deletes filing-time screenshots once their ticket has been resolved long
// enough, so captures of live classes and boards do not accumulate forever.
//
// A capture can contain student names, responses and consent state. The
// overlay already refuses to capture on participant-facing surfaces, but a
// teacher's class page or a proposal board legitimately shows student work, so
// the remaining images need an expiry rather than indefinite retention.
//
// Clearing the field is enough to remove the file: the local storage buckets in
// keystone.ts do not set `preserve`, and Keystone's default is to delete the
// asset when it is removed from the database.
//
// Dry-run by default. Pass dryRun: false to delete. Idempotent.
//
// Two ways in. An admin with canManageTickets can run it from the Admin UI or
// Apollo sandbox; a scheduled job passes the same shared secret CI uses for
// closeTicketsFromCommit, because cron has no session. Retention that depends
// on someone remembering to click a button is not retention.
//
// Retention is also stated to the user in the frontend's
// Dashboard/Tickets/TicketPage.js caption — keep the two in step.

/** Days after a ticket is resolved before its screenshot is removed. */
export const SCREENSHOT_RETENTION_DAYS = 90;

const RESOLVED_STATUSES = ["SHIPPED", "WONTFIX"];

function secretMatches(provided: string): boolean {
  const expected = process.env.TICKET_WEBHOOK_SECRET;
  if (!expected) return false; // fail closed
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function pruneTicketScreenshots(
  root: any,
  { dryRun = true, secret }: { dryRun?: boolean; secret?: string },
  context: any
) {
  // A valid shared secret stands in for a session, for the scheduled run.
  if (secret) {
    if (!secretMatches(secret)) {
      throw new Error("Forbidden.");
    }
  } else {
    const session = context.session;
    if (!session?.itemId) {
      throw new Error("You must be signed in to run this mutation.");
    }
    const profile = await context.query.Profile.findOne({
      where: { id: session.itemId },
      query: "permissions { canManageTickets }",
    });
    const canManage = (profile?.permissions || []).some(
      (p: any) => p.canManageTickets
    );
    if (!canManage) {
      throw new Error("Forbidden: canManageTickets required.");
    }
  }

  const cutoff = new Date(
    Date.now() - SCREENSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Only resolved tickets, and only ones that still carry an image. `resolvedAt`
  // is cleared when a ticket is reopened, so a reopened ticket can never match
  // and its evidence survives.
  const candidates = await context.sudo().query.Ticket.findMany({
    where: {
      status: { in: RESOLVED_STATUSES },
      resolvedAt: { lt: cutoff },
    },
    query: "id title surface resolvedAt screenshot { id }",
  });

  const stale = candidates.filter((ticket: any) => ticket.screenshot?.id);

  if (!dryRun) {
    for (const ticket of stale) {
      await context.sudo().query.Ticket.updateOne({
        where: { id: ticket.id },
        data: { screenshot: null },
      });
    }
  }

  return {
    dryRun,
    retentionDays: SCREENSHOT_RETENTION_DAYS,
    cutoff,
    prunedCount: stale.length,
    pruned: stale.map(
      (ticket: any) => `${ticket.surface}: ${ticket.title} (resolved ${ticket.resolvedAt})`
    ),
  };
}

export default pruneTicketScreenshots;
