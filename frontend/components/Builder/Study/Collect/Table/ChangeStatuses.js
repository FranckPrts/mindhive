import { Checkbox, Loader } from "semantic-ui-react";

import { useMutation } from "@apollo/client";

import { CHANGE_DATASET_STATUS } from "../../../../Mutations/Dataset";

import {
  GET_USER_RESULTS,
  GET_GUEST_RESULTS,
} from "../../../../Queries/Result";

import { GET_STUDY_RESULTS } from "../../../../Queries/Study";

export default function ChangeDatasetStatuses({
  participantId,
  datasets,
  type,
  studyId,
}) {
  const areIncluded =
    datasets
      ?.filter((dataset) => dataset?.isCompleted)
      .map((dataset) => dataset?.isIncluded) || [];
  const allIncluded = areIncluded.length && areIncluded?.every((v) => !!v);

  const queriesToRefetch =
    type === "USER"
      ? [
          { query: GET_USER_RESULTS, variables: { id: participantId } },
          { query: GET_STUDY_RESULTS, variables: { id: studyId } },
        ]
      : [
          { query: GET_GUEST_RESULTS, variables: { id: participantId } },
          { query: GET_STUDY_RESULTS, variables: { id: studyId } },
        ];

  const [changeStatus, { loading }] = useMutation(CHANGE_DATASET_STATUS, {
    refetchQueries: queriesToRefetch,
  });

  const change = () => {
    datasets.forEach((dataset) => {
      changeStatus({
        variables: {
          token: dataset?.token,
          isIncluded: !allIncluded,
        },
        optimisticResponse: {
          updateDataset: {
            id: dataset?.id,
            __typename: "Dataset",
            isIncluded: !allIncluded,
          },
        },
      });
    });
  };

  if (areIncluded?.length) {
    return (
      <div className="switcher">
        {loading ? (
          <Loader active inline />
        ) : (
          <Checkbox checked={allIncluded} onClick={change} />
        )}
      </div>
    );
  } else {
    return <div></div>;
  }
}
