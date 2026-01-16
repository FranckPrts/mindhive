import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
} from "@keystone-6/core/fields";
import { permissions, rules } from "../access";

export const AiThread = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    threadId: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
    }),
    assistantId: text({
      validation: { isRequired: true },
      isFilterable: true,
    }),
    proposalId: text({
      isFilterable: true,
    }),
    profile: relationship({
      ref: "Profile.aiThreads",
      hooks: {
        async resolveInput({ context, operation }) {
          if (operation === "create" && context.session?.itemId) {
            return { connect: { id: context.session.itemId } };
          }
        },
      },
    }),
    // threadState removed - state persistence now handled by PostgreSQL checkpointer
    // The checkpointer maintains full conversation history automatically
    // Access previous messages via graph.getState(config) using thread_id
    status: text({
      isFilterable: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp({
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "update") {
            return new Date().toISOString();
          }
        },
      },
    }),
  },
});

