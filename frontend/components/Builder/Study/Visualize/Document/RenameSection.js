import { DropdownItem } from "semantic-ui-react";
import { useState } from "react"; // Import useState hook
import { useMutation } from "@apollo/client";
import { UPDATE_VIZSECTION } from "../../../../Mutations/VizSection";
import { STUDY_VIZJOURNAL } from "../../../../Queries/VizJournal";

export default function RenameSection({ studyId, sectionId }) {
  const [userInput, setUserInput] = useState(""); // State to store user input

  const [renameSection, { data, loading, error }] = useMutation(
    UPDATE_VIZSECTION,
    {
      onError: (error) => {
        console.error("Mutation error:", error);
      },
      refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
    }
  );
  
  const getNewTitle = () => {
    console.log("Open prompt");
    const input = prompt("\nProvide a new section title:");
    if (input !== null) {
      console.log("User input:", input);
      console.log("User sectionID:", sectionId);
      renameSection({
        variables: {
          id: sectionId,
          input: {
            title: input, // Pass user input as the new title directly
          },
        },
      });
    }
  };
  return (
    <DropdownItem onClick={getNewTitle}>
      <div className="menuItem">
        <img src={`/assets/icons/visualize/edit.svg`} alt="Edit Icon" />
        <div>Rename</div>
      </div>
    </DropdownItem>
  );
}
