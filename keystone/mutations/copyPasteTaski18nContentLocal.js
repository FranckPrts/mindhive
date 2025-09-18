async function addEsLaLocaleIndividual() {
  try {
    // Fetch all tasks
    const response = await fetch("https://backend.mindhive.science/api/graphql/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-apollo-operation-name": "GETTING_TASKS_FOR_LOCALE_MIGRATION",
        "apollo-require-preflight": "true",
      },
      body: JSON.stringify({
        query: `
          query Tasks($where: TaskWhereInput!) {
            tasks(where: $where) {
              id
              i18nContent
              public
            }
          }
        `,
        variables: {
          where: {
            public: {
              equals: true,
            },
          },
        },
      }),
    });

    const result = await response.json();
    const tasks = result.data.tasks || [];
    console.log("Fetched tasks:", tasks.length);

    // Process each task individually
    for (const task of tasks) {
      const i18nContent = { ...task.i18nContent };
      let needsUpdate = false;

      // Check if es-es exists and es-la doesn't exist
      if (i18nContent['es-es'] && !i18nContent['es-la']) {
        // Deep copy the es-es content to es-la
        i18nContent['es-la'] = JSON.parse(JSON.stringify(i18nContent['es-es']));
        needsUpdate = true;
        console.log(`Will add es-la online for task ${task.id}`);
      } else if (!i18nContent['es-es']) {
        console.warn(`Task ${task.id} doesn't have es-es online to copy from`);
      } else if (i18nContent['es-la']) {
        console.log(`Task ${task.id} already has es-la online, skipping`);
      }

      // Update the task if needed
      if (needsUpdate) {
        console.log(`Updating task ${task.id}`);

        const updateResponse = await fetch("https://backend.mindhive.science/api/graphql/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-apollo-operation-name": "UPDATING_TASK_LOCALE_MIGRATION",
            "apollo-require-preflight": "true",
          },
          body: JSON.stringify({
            query: `
              mutation UpdateTask($where: TaskWhereUniqueInput!, $data: TaskUpdateInput!) {
                updateTask(where: $where, data: $data) {
                  id
                  i18nContent
                }
              }
            `,
            variables: {
              where: { id: task.id },
              data: {
                i18nContent,
              },
            },
          }),
        });

        const updateResult = await updateResponse.json();
        
        if (updateResult.errors) {
          console.error(`Error updating task ${task.id}:`, updateResult.errors);
        } else {
          console.log(`Successfully updated task ${task.id}`);
        }
      } else {
        console.log(`No update needed for task ${task.id}`);
      }
    }

    console.log("Online migration complete.");
  } catch (error) {
    console.error("Error in online migration:", error);
  }
}

addEsLaLocaleIndividual();