import { Client } from "@notionhq/client";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Mirrors tickets into Notion, one way.
 *
 * Keystone is the system of record. Notion is where people who do not live in
 * the app read and plan, so it gets a copy — but a status changed in Notion
 * will be overwritten on the ticket's next update here. That is deliberate: two
 * systems that both think they are authoritative is the problem this whole
 * branch exists to fix.
 *
 * Best-effort by design. A Notion outage, a revoked token or a renamed property
 * must never fail a ticket write — the ticket is the thing that matters and it
 * is already safely in Postgres. Failures are logged and leave `notionPageId`
 * null, which is also how you find the rows that still need mirroring.
 *
 * Config (keystone/.env):
 *   NOTION_KEY         internal integration secret
 *   NOTION_TICKETS_DB  the database id (not the data source id — see below)
 *
 * With either missing the mirror silently does nothing, so a developer without
 * Notion credentials can still file tickets locally.
 */

// The same API version pins as the frontend's /api/notion route.
const NOTION_VERSION = "2025-09-03";

/** Property names, as created in the Tickets database. Change both together. */
const PROP = {
  title: "Title",
  status: "Status",
  kind: "Kind",
  priority: "Priority",
  surface: "Surface",
  reporter: "Reporter",
  filed: "Filed",
  mindhiveId: "MindHive ID",
  link: "Link",
  design: "Design",
  assignee: "Assignee",
} as const;

/** Keystone enum -> the option names in the Notion select. */
const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  SHIPPED: "Shipped",
  WONTFIX: "Won't fix",
};

const KIND_LABELS: Record<string, string> = {
  BUG: "Bug",
  DESIGN_DRIFT: "Design drift",
  MISSING: "Missing",
  COPY: "Copy",
  IDEA: "Idea",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
};

/** Fields whose change is worth a Notion round trip. */
export const MIRRORED_FIELDS = [
  "title",
  "status",
  "kind",
  "priority",
  "surface",
  "figmaDesignUrl",
  "assignee",
] as const;

let client: Client | null = null;
function getClient(): Client | null {
  if (!process.env.NOTION_KEY || !process.env.NOTION_TICKETS_DB) return null;
  if (!client) {
    client = new Client({
      auth: process.env.NOTION_KEY,
      notionVersion: NOTION_VERSION,
    });
  }
  return client;
}

/**
 * Pages are parented to a *data source*, not a database, on 2025-09-03. The
 * data source id is resolved from the database id and cached, so `.env` holds
 * the id a human can actually copy out of a Notion URL.
 */
let dataSourceId: string | null = null;
async function getDataSourceId(notion: Client): Promise<string> {
  if (dataSourceId) return dataSourceId;
  const database: any = await notion.databases.retrieve({
    database_id: process.env.NOTION_TICKETS_DB as string,
  });
  const sources = database.data_sources ?? [];
  if (!sources.length) {
    throw new Error(
      "Tickets database has no data source; API 2025-09-03 requires one."
    );
  }
  dataSourceId = sources[0].id as string;
  return dataSourceId;
}

const text = (value: unknown) =>
  value == null || value === ""
    ? []
    : [{ type: "text" as const, text: { content: String(value).slice(0, 2000) } }];

const select = (labels: Record<string, string>, value: unknown) => {
  const name = labels[String(value)];
  return name ? { name } : null;
};

function ticketUrl(id: string): string | null {
  const base =
    process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL_DEV
      : process.env.FRONTEND_URL;
  return base ? `${base.replace(/\/$/, "")}/dashboard/tickets/${id}` : null;
}

function propertiesFor(ticket: any) {
  const link = ticketUrl(ticket.id);
  return {
    [PROP.title]: { title: text(ticket.title) },
    [PROP.status]: { select: select(STATUS_LABELS, ticket.status) },
    [PROP.kind]: { select: select(KIND_LABELS, ticket.kind) },
    [PROP.priority]: { select: select(PRIORITY_LABELS, ticket.priority) },
    // Surface options are created on the fly — which is why this is a `select`
    // and not Notion's `status` type, whose options the API cannot create.
    [PROP.surface]: { select: ticket.surface ? { name: ticket.surface } : null },
    [PROP.reporter]: { rich_text: text(ticket.reporter?.username) },
    [PROP.filed]: {
      date: ticket.createdAt ? { start: new Date(ticket.createdAt).toISOString() } : null,
    },
    [PROP.mindhiveId]: { rich_text: text(ticket.id) },
    ...(link ? { [PROP.link]: { url: link } } : {}),
    // Where the intended design lives, when the reporter supplied it. A
    // url property accepts null cleanly, so no conditional spread needed.
    [PROP.design]: { url: ticket.figmaDesignUrl || null },
    // Cleared to an empty rich_text when unassigned, so releasing a ticket in
    // the app releases it in Notion too rather than leaving a stale name.
    [PROP.assignee]: { rich_text: text(ticket.assignee?.username) },
  };
}

/**
 * The written description becomes page content rather than a property, so long
 * reports stay readable.
 */
function childrenFor(ticket: any) {
  const description = ticket.body?.text;
  if (!description) return [];
  return [
    {
      object: "block" as const,
      type: "paragraph" as const,
      paragraph: { rich_text: text(description) },
    },
  ];
}

/*
 * Screenshots ARE mirrored — a deliberate decision, reversed from the first
 * version, made knowing the tradeoff:
 *
 *   A capture can contain student names and responses. In MindHive it expires
 *   90 days after the ticket is resolved. Copying it into Notion puts it in
 *   front of whoever can open the Platform tickets page, so it is only
 *   appropriate while that audience is the same people who hold
 *   canManageTickets. If the Notion page is ever shared more widely, turn this
 *   off (NOTION_MIRROR_SCREENSHOTS=false).
 *
 * The expiry is kept: pruneTicketScreenshots calls removeScreenshotFromNotion,
 * so the Notion copy is removed on the same schedule. One caveat stated
 * plainly — Notion's delete is a soft delete. A removed block sits in the
 * workspace trash, restorable by members for up to 30 days, so the effective
 * ceiling in Notion is 90 days plus that.
 *
 * The file is uploaded INTO Notion (its file upload API) rather than embedded
 * by URL. An embed would hand Notion the public Keystone URL, and would break
 * the moment screenshots require a login. It is read from disk for the same
 * reason, never fetched over HTTP.
 */

/** Mirrors `storagePath` for ticketScreenshots in keystone.ts. */
const SCREENSHOT_DIR = "ticket-screenshots";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function screenshotsEnabled(): boolean {
  return process.env.NOTION_MIRROR_SCREENSHOTS !== "false";
}

const FILING_CAPTION =
  "Screenshot at filing time. Removed automatically 90 days after the ticket is resolved.";

/** Upload an image (a screenshot or a markup of one) into Notion and append it to the page. */
async function attachScreenshot(
  notion: Client,
  pageId: string,
  screenshot: any,
  caption: string = FILING_CAPTION
) {
  if (!screenshotsEnabled() || !screenshot?.id || !screenshot?.extension) return;

  const extension = String(screenshot.extension).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return; // not an image Notion will render

  // The image field stores "2026/09/<ts>-<rand>"; Keystone adds the extension.
  const file = path.join(process.cwd(), SCREENSHOT_DIR, `${screenshot.id}.${extension}`);
  const bytes = await readFile(file);
  const filename = path.basename(file);

  const upload: any = await notion.fileUploads.create({
    mode: "single_part",
    filename,
    content_type: contentType,
  });
  await notion.fileUploads.send({
    file_upload_id: upload.id,
    file: { filename, data: new Blob([bytes], { type: contentType }) },
  });
  await notion.blocks.children.append({
    block_id: pageId,
    children: [
      {
        object: "block",
        type: "image",
        image: {
          type: "file_upload",
          file_upload: { id: upload.id },
          caption: text(caption),
        },
      } as any,
    ],
  });
}

/** Whether a mirrored page already carries an image — keeps backfills idempotent. */
async function pageHasImage(notion: Client, pageId: string): Promise<boolean> {
  const { results }: any = await notion.blocks.children.list({ block_id: pageId });
  return (results ?? []).some((block: any) => block.type === "image");
}

/**
 * Upload a ticket's screenshot to its existing Notion page, if the page does
 * not already have one. For tickets mirrored before screenshots were, and for
 * catching up after NOTION_MIRROR_SCREENSHOTS is switched back on.
 * Returns what happened, for the backfill's report.
 */
export async function backfillScreenshotToNotion(
  context: any,
  ticketId: string,
  { dryRun = true }: { dryRun?: boolean } = {}
): Promise<"attached" | "would-attach" | "already-there" | "no-screenshot" | "not-mirrored" | "disabled"> {
  const notion = getClient();
  if (!notion || !screenshotsEnabled()) return "disabled";
  const ticket = await loadTicket(context, ticketId);
  if (!ticket?.notionPageId) return "not-mirrored";
  if (!ticket.screenshot?.id) return "no-screenshot";
  if (await pageHasImage(notion, ticket.notionPageId)) return "already-there";
  if (dryRun) return "would-attach";
  await attachScreenshot(notion, ticket.notionPageId, ticket.screenshot);
  return "attached";
}

/**
 * Copy one collaborator's markup onto the ticket's Notion page, captioned with
 * who drew it, when, and their note. Appended below the filing screenshot, so
 * the page reads as the original followed by each person's markup in order.
 * Best-effort, like the rest of the mirror.
 */
export async function mirrorAnnotation(context: any, annotationId: string): Promise<void> {
  const notion = getClient();
  if (!notion || !screenshotsEnabled()) return;
  try {
    const annotation = await context.sudo().query.TicketAnnotation.findOne({
      where: { id: annotationId },
      query: "id note createdAt author { username } image { id extension } ticket { notionPageId }",
    });
    if (!annotation?.ticket?.notionPageId || !annotation.image?.id) return;
    const who = annotation.author?.username ?? "someone";
    const when = new Date(annotation.createdAt).toISOString().slice(0, 10);
    const note = annotation.note?.trim();
    const caption =
      `Annotated by ${who} on ${when}${note ? ` — ${note}` : ""}. ` +
      "Removed with the screenshot, 90 days after the ticket is resolved.";
    await attachScreenshot(notion, annotation.ticket.notionPageId, annotation.image, caption);
  } catch (error: any) {
    console.error(
      `[notionMirror] annotation mirror failed for ${annotationId}: ${error?.message ?? error}`
    );
  }
}

/**
 * Remove the screenshot from a mirrored page. Called by the prune job so the
 * Notion copy expires on the same schedule as the original. Every image block
 * on a mirrored page is ours — the filing screenshot and each collaborator's
 * markup — so removing all of them expires the markups along with it.
 */
export async function removeScreenshotFromNotion(notionPageId: string | null): Promise<void> {
  const notion = getClient();
  if (!notion || !notionPageId) return;
  try {
    const { results }: any = await notion.blocks.children.list({ block_id: notionPageId });
    for (const block of results ?? []) {
      if (block.type === "image") await notion.blocks.delete({ block_id: block.id });
    }
  } catch (error: any) {
    console.error(
      `[notionMirror] screenshot removal failed for page ${notionPageId}: ${error?.message ?? error}`
    );
  }
}

/** Load the fields the mirror needs, with the reporter resolved. */
async function loadTicket(context: any, id: string) {
  return context.sudo().query.Ticket.findOne({
    where: { id },
    query: `
      id title surface kind status priority body createdAt notionPageId
      figmaDesignUrl
      reporter { username }
      assignee { username }
      screenshot { id extension }
    `,
  });
}

/** Create the Notion page for a new ticket and record its id. */
export async function mirrorCreate(context: any, ticketId: string): Promise<void> {
  const notion = getClient();
  if (!notion) return;

  try {
    const ticket = await loadTicket(context, ticketId);
    if (!ticket || ticket.notionPageId) return;

    const page: any = await notion.pages.create({
      parent: { type: "data_source_id", data_source_id: await getDataSourceId(notion) },
      properties: propertiesFor(ticket) as any,
      children: childrenFor(ticket) as any,
    });

    // Written with sudo because the hook runs as whoever filed the ticket, and
    // notionPageId is read-only in the Admin UI by design.
    await context.sudo().query.Ticket.updateOne({
      where: { id: ticketId },
      data: { notionPageId: page.id },
    });

    // After the page id is saved, so a failed upload still leaves a correctly
    // linked page rather than an unlinked one. Its own try: a screenshot that
    // will not upload must not be reported as a failed mirror.
    try {
      await attachScreenshot(notion, page.id, ticket.screenshot);
    } catch (error: any) {
      console.error(
        `[notionMirror] screenshot upload failed for ticket ${ticketId}: ${error?.message ?? error}`
      );
    }
  } catch (error: any) {
    console.error(
      `[notionMirror] create failed for ticket ${ticketId}: ${error?.message ?? error}`
    );
  }
}

/** Push a changed ticket to its existing Notion page. */
export async function mirrorUpdate(context: any, ticketId: string): Promise<void> {
  const notion = getClient();
  if (!notion) return;

  try {
    const ticket = await loadTicket(context, ticketId);
    if (!ticket) return;

    // Never mirrored on create (Notion was down, credentials were missing) —
    // treat the first update as the create it never got.
    if (!ticket.notionPageId) {
      await mirrorCreate(context, ticketId);
      return;
    }

    await notion.pages.update({
      page_id: ticket.notionPageId,
      properties: propertiesFor(ticket) as any,
    });
  } catch (error: any) {
    console.error(
      `[notionMirror] update failed for ticket ${ticketId}: ${error?.message ?? error}`
    );
  }
}

/** Whether a Keystone update touched anything Notion shows. */
export function touchesMirroredField(resolvedData: Record<string, unknown>): boolean {
  return MIRRORED_FIELDS.some((field) => resolvedData[field] !== undefined);
}
