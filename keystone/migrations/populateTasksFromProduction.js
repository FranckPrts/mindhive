/**
 * Migration script to populate dev backend with public tasks from production
 * 
 * Usage:
 *   node keystone/migrations/populateTasksFromProduction.js
 * 
 * Environment variables:
 *   - PRODUCTION_API_URL: Production GraphQL endpoint (default: https://backend.mindhive.science/api/graphql/api/graphql)
 *   - DEV_API_URL: Dev GraphQL endpoint (default: http://localhost:4444/api/graphql)
 *   - DEFAULT_AUTHOR_ID: (Optional) Profile ID to use as author for imported tasks
 */

require("dotenv").config();

const PRODUCTION_API_URL =
  process.env.PRODUCTION_API_URL ||
  "https://backend.mindhive.science/api/graphql/api/graphql";
const DEV_API_URL =
  process.env.DEV_API_URL || "http://localhost:4444/api/graphql";
const DEFAULT_AUTHOR_ID = process.env.DEFAULT_AUTHOR_ID || "cmj3cngm00000inhuvlv2ystm";

// Fetch tasks from production
async function fetchProductionTasks() {
  console.log("Fetching public tasks from production...");
  
  const response = await fetch(PRODUCTION_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-apollo-operation-name": "ALL_PUBLIC_TASKS",
      "apollo-require-preflight": "true",
    },
    body: JSON.stringify({
      query: `
        query ALL_PUBLIC_TASKS {
          tasks(where: { public: { equals: true } }, orderBy: { title: asc }) {
            id
            title
            i18nContent
            slug
            description
            descriptionForParticipants
            taskType
            parameters
            settings
            link
            public
            submitForPublishing
            isOriginal
            isExternal
            image
            largeImage
          }
        }
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from production: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const tasks = data.data?.tasks || [];
  console.log(`Found ${tasks.length} public tasks in production`);
  
  return tasks;
}

// Get a default author ID from dev backend if not provided
async function getDefaultAuthor() {
  if (DEFAULT_AUTHOR_ID) {
    console.log(`Using provided author ID: ${DEFAULT_AUTHOR_ID}`);
    return DEFAULT_AUTHOR_ID;
  }

  console.log("Fetching first available profile from dev backend...");
  
  const response = await fetch(DEV_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query GET_FIRST_PROFILE {
          profiles(take: 1) {
            id
          }
        }
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profiles: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const profiles = data.data?.profiles || [];
  
  if (profiles.length === 0) {
    throw new Error(
      "No profiles found in dev backend. Please create a profile first or set DEFAULT_AUTHOR_ID environment variable."
    );
  }

  const authorId = profiles[0].id;
  console.log(`Using author ID: ${authorId}`);
  
  return authorId;
}

// Check if task already exists in dev backend
async function taskExists(slug) {
  const response = await fetch(DEV_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query CHECK_TASK($slug: String!) {
          task(where: { slug: $slug }) {
            id
          }
        }
      `,
      variables: { slug },
    }),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return !!data.data?.task;
}

// Create a single task in dev backend
async function createTask(task, authorId) {
  // Check if task already exists
  if (await taskExists(task.slug)) {
    console.log(`  ⏭️  Skipping "${task.title}" (slug: ${task.slug}) - already exists`);
    return { skipped: true, slug: task.slug };
  }

  const mutation = `
    mutation CREATE_TASK($data: TaskCreateInput!) {
      createTask(data: $data) {
        id
        title
        slug
      }
    }
  `;

  const variables = {
    data: {
      title: task.title,
      slug: task.slug, // Explicitly set slug to preserve original
      i18nContent: task.i18nContent || null,
      description: task.description || null,
      descriptionForParticipants: task.descriptionForParticipants || null,
      taskType: task.taskType || null,
      parameters: task.parameters || null,
      settings: task.settings || null,
      link: task.link || null,
      public: task.public !== undefined ? task.public : true,
      submitForPublishing: task.submitForPublishing || false,
      isOriginal: task.isOriginal || false,
      isExternal: task.isExternal || false,
      image: task.image || null,
      largeImage: task.largeImage || null,
      author: authorId ? { connect: { id: authorId } } : undefined,
    },
  };

  const response = await fetch(DEV_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-apollo-operation-name": "CREATE_TASK_MIGRATION",
      "apollo-require-preflight": "true",
    },
    body: JSON.stringify({
      query: mutation,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      `GraphQL errors creating task "${task.title}": ${JSON.stringify(result.errors)}`
    );
  }

  return result.data?.createTask;
}

// Main migration function
async function migrateTasks() {
  try {
    // Fetch tasks from production
    const tasks = await fetchProductionTasks();

    if (tasks.length === 0) {
      console.log("No tasks to migrate.");
      return;
    }

    // Get author ID
    const authorId = await getDefaultAuthor();

    // Create tasks in dev backend
    console.log(`\nCreating ${tasks.length} tasks in dev backend...\n`);
    
    const results = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      console.log(`[${i + 1}/${tasks.length}] Processing: "${task.title}"`);
      
      try {
        const result = await createTask(task, authorId);
        
        if (result.skipped) {
          results.skipped++;
        } else {
          results.created++;
          console.log(`  ✅ Created: ${result.slug} (ID: ${result.id})`);
        }
      } catch (error) {
        results.errors.push({ task: task.title, error: error.message });
        console.error(`  ❌ Error: ${error.message}`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("Migration Summary:");
    console.log(`  Created: ${results.created}`);
    console.log(`  Skipped: ${results.skipped}`);
    console.log(`  Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log("\nErrors:");
      results.errors.forEach(({ task, error }) => {
        console.log(`  - ${task}: ${error}`);
      });
    }
    
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateTasks();
}

module.exports = { migrateTasks, fetchProductionTasks };

