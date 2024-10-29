import { useState } from "react";
import Link from "next/link";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useForm from "../../../../lib/useForm";

import { CURRENT_USER_QUERY } from "../../../Queries/User";
import { UPDATE_USER } from "../../../Mutations/User";
import { StyledInput } from "../../../styles/StyledForm";
import { StyledSimpleSaveButton } from "../../../styles/StyledProfile";

export default function Activity({ query, user }) {
  const [changed, setChanged] = useState(false);

  const { inputs, handleChange, clearForm } = useForm({ ...user });
  const [updateProfile, { data, loading, error }] = useMutation(UPDATE_USER, {
    variables: inputs,
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const handleUpdate = (data) => {
    setChanged(true);
    handleChange(data);
  };

  async function handleSave(e) {
    e.preventDefault();
    await updateProfile();
    setChanged(false);
  }

  return (
    <StyledInput>
      <h1>My Activity</h1>
      <h3>
        Track your progress and review the studies and tasks you've participated
        in
      </h3>
      <Divider />

      <div className="content">
        <div className="buttons">
          <Link
            href={{
              pathname: `/dashboard/settings/consent`,
            }}
          >
            <button className="back">Back to Data & Consent</button>
          </Link>
        </div>
      </div>
    </StyledInput>
  );
}