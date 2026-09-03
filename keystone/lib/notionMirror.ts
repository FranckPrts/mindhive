import { Client } from "@notionhq/client";

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
  };
}

/**
 * The written description becomes page content rather than a property, so long
 * reports stay readable. Screenshots are deliberately NOT mirrored: a capture
 * can contain student names and responses, and in Keystone it is gated behind
 * canManageTickets and expires after 90 days. Copying it into Notion would put
 * it in front of a wider audience with no expiry. The Link property points back
 * to the ticket, where the image lives under its original access rules.
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

/** Load the fields the mirror needs, with the reporter resolved. */
async function loadTicket(context: any, id: string) {
  return context.sudo().query.Ticket.findOne({
    where: { id },
    query: `
      id title surface kind status priority body createdAt notionPageId
      reporter { username }
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
