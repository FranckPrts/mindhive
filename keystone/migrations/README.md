# Task Migration Scripts

These scripts help populate your dev backend with public tasks from production.

## Available Scripts

### 1. `populateTasksFromProduction.js`

Fetches public tasks directly from the production API and imports them into your dev backend.

**Usage:**
```bash
cd keystone
npm run migrate:tasks:production
```

Or directly:
```bash
node migrations/populateTasksFromProduction.js
```

**Environment Variables:**
- `PRODUCTION_API_URL` - Production GraphQL endpoint (default: `https://backend.mindhive.science/api/graphql/api/graphql`)
- `DEV_API_URL` - Dev GraphQL endpoint (default: `http://localhost:4444/api/graphql`)
- `DEFAULT_AUTHOR_ID` - (Optional) Profile ID to use as author for imported tasks. If not provided, the script will use the first available profile in your dev backend.

### 2. `populateTasksFromCSV.js`

Imports tasks from a CSV file that was previously exported from production.

**Usage:**
```bash
cd keystone
npm run migrate:tasks:csv <path-to-csv-file>
```

Or directly:
```bash
node migrations/populateTasksFromCSV.js <path-to-csv-file>
```

**Example:**
```bash
node migrations/populateTasksFromCSV.js ~/Downloads/public_tasks.csv
```

**Environment Variables:**
- `DEV_API_URL` - Dev GraphQL endpoint (default: `http://localhost:4444/api/graphql`)
- `DEFAULT_AUTHOR_ID` - (Optional) Profile ID to use as author for imported tasks

## Prerequisites

1. Make sure your dev backend is running (`npm run dev` in the keystone directory)
2. Ensure you have at least one Profile in your dev database (or set `DEFAULT_AUTHOR_ID`)
3. For CSV import, you need a CSV file exported from production (use the browser script provided)

## How It Works

Both scripts:
- Fetch/read task data (from API or CSV)
- Check if tasks already exist (by slug) to avoid duplicates
- Create tasks in your dev backend with all relevant fields
- Preserve original slugs when possible
- Set tasks as public by default
- Provide a summary of created, skipped, and failed tasks

## Notes

- Tasks are created with `public: true` by default
- If a task with the same slug already exists, it will be skipped
- The script uses the first available Profile as the author if `DEFAULT_AUTHOR_ID` is not set
- All tasks are created with their original `i18nContent`, `slug`, and other metadata preserved

## Troubleshooting

**Error: "No profiles found in dev backend"**
- Create a profile first through the Keystone admin UI, or set `DEFAULT_AUTHOR_ID` environment variable

**Error: "Failed to fetch from production"**
- Check your internet connection
- Verify the production API URL is correct
- Ensure the production API is accessible

**Error: "GraphQL errors"**
- Make sure your dev backend is running
- Check that the GraphQL endpoint URL is correct
- Verify your database connection is working

