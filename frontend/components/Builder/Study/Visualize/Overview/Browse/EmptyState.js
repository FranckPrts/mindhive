import { useMutation } from "@apollo/client";

import { CREATE_VIZJOURNAL } from "../../../../../Mutations/VizJournal";
import { STUDY_VIZJOURNAL } from "../../../../../Queries/VizJournal";
import { Dropdown, DropdownMenu } from "semantic-ui-react";

import Papa from "papaparse";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

export default function EmptyState({ studyId }) {
  const [createJournal, { data, loading, error }] = useMutation(
    CREATE_VIZJOURNAL,
    {
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
    }
  );

  const initializeJournal = ({ dataOrigin }) => {
    if (dataOrigin === "STUDY") {
      createJournal({
        variables: {
          input: {
            title: "Unnamed journal",
            study: {
              connect: {
                id: studyId,
              },
            },
            vizParts: {
              create: [
                {
                  title: "Unnamed part",
                  dataOrigin: "STUDY",
                  vizChapters: {
                    create: [
                      { title: "Unnamed chapter", description: "Description" },
                    ],
                  },
                },
              ],
            },
          },
        },
      });
    }
  };

  // convert csv file to json with promise
  const toJson = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete(results, file) {
          resolve(results.data);
        },
        error(err, file) {
          reject(err);
        },
      });
    });
  };

  // helper function to get all column names of the given dataset
  const getColumnNames = ({ data }) => {
    const allKeys = data
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys)).sort();
    return keys;
  };

  const handleDataUpload = async (e) => {
    const form = e.currentTarget;
    const [file] = await form.files;

    let data;
    if (file.type === "application/json") {
      const text = await file.text();
      data = JSON.parse(text);
    } else {
      data = await toJson(file);
    }
    const variables = getColumnNames({ data });

    const metadata = {
      id: nanoid(),
      payload: "upload",
      timestampUploaded: Date.now(),
      variables: variables,
    };
    const dataFile = {
      metadata,
      data: data,
    };

    // get the current date for data saving
    const curDate = new Date();
    const date = {
      year: parseInt(curDate.getFullYear()),
      month: parseInt(curDate.getMonth()) + 1,
      day: parseInt(curDate.getDate()),
    };
    // save the file in the system
    const res = await fetch(
      `/api/save/?y=${date.year}&m=${date.month}&d=${date.day}`,
      {
        method: "POST",
        body: JSON.stringify(dataFile),
        headers: {
          Accept: "application/json", // eslint-disable-line quote-props
          "Content-Type": "application/json",
        },
      }
    );

    const fileAddress = {
      ...date,
      token: metadata?.id,
    };

    // call mutation with uploaded data
    createJournal({
      variables: {
        input: {
          title: "Unnamed journal",
          study: {
            connect: {
              id: studyId,
            },
          },
          vizParts: {
            create: [
              {
                title: "Unnamed part",
                dataOrigin: "UPLOADED",
                content: {
                  uploaded: {
                    address: fileAddress,
                    metadata,
                  },
                },
                vizChapters: {
                  create: [
                    { title: "Unnamed chapter", description: "Description" },
                  ],
                },
              },
            ],
          },
        },
      },
    });
  };

  return (
    <div>
      <div>It looks like you still don’t have any data visualizations!</div>
      <div className="emptyStateButtons">
        <Dropdown
          icon={
            <div className="menuItem menuButton">
              <img src={`/assets/icons/visualize/draft.svg`} />
              <div>From scratch</div>
            </div>
          }
        >
          <DropdownMenu>
            <div
              className="menuItem menuButton"
              onClick={() => initializeJournal({ dataOrigin: "STUDY" })}
            >
              <img src={`/assets/icons/visualize/content_paste_go.svg`} />
              <div>Use study data</div>
            </div>
            <label htmlFor="fileUpload">
              <input
                type="file"
                id="fileUpload"
                style={{ display: "none" }}
                onChange={handleDataUpload}
              />
              <div className="menuItem menuButton">
                <img src={`/assets/icons/visualize/draft.svg`} />
                <div>Upload own data</div>
              </div>
            </label>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}
