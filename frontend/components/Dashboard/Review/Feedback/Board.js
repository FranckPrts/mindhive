import { Icon } from "semantic-ui-react";
import ReactHtmlParser from "react-html-parser";
import styled from "styled-components";

import { useQuery, useMutation } from "@apollo/client";
import { EDIT_REVIEW } from "../../../Mutations/Review";
import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import { ALL_PUBLIC_TASKS } from "../../../Queries/Task";

import StyledFeedback from "../../../styles/StyledFeedback";
import ManageFavorite from "../../../User/ManageFavorite";
import useTranslation from 'next-translate/useTranslation';

const TaskChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: fit-content;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.isFavorite ? '#5D5763' : '#A1A1A1'};
  background: ${props => props.isFavorite ? '#FDF2D0' : '#FFFFFF'};
  color: #171717;
  font-family: "Nunito", sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.isFavorite ? '#A3D6DB' : '#336F8A'};
  }

  .taskLink {
    color: #171717;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    flex: 1;
  }

  .favoriteButton {
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }
`;


export default function Board({ user, projectId, status, reviews }) {
  const { t } = useTranslation('builder');
  const { data: publicTasksData } = useQuery(ALL_PUBLIC_TASKS);
  const publicTasks = publicTasksData?.tasks || [];

  const questionTitles = {
    SUBMITTED_AS_PROPOSAL: {
      1: {
        title: t('reviewTemplate.proposalReadyQuestion'),
      },
      2: { title: t('reviewTemplate.whatDoesStudyDoWell') },
      3: {
        title: t('reviewTemplate.isQuestionAnswerable'),
      },
      4: {
        title: t('reviewTemplate.isQuestionAnswerable'),
      },
      5: { title: t('reviewTemplate.additionalComments') },
    },
    PEER_REVIEW: {
      1: {
        title: t('reviewTemplate.importanceQuestion'),
      },
      2: {
        title: t('reviewTemplate.hypothesisQuestion'),
      },
      3: {
        title: t('reviewTemplate.designQuestion'),
      },
      4: {
        title: t('reviewTemplate.confoundsQuestion'),
      },
      5: {
        title: t('reviewTemplate.respectQuestion'),
      },
      6: {
        title: t('reviewTemplate.participationQuestion'),
      },
    },
  };

  const [editReview, { data }] = useMutation(EDIT_REVIEW, {});

  const voteReview = async ({ id, votedBefore }) => {
    await editReview({
      variables: {
        id: id,
        input: {
          upvotedBy: votedBefore
            ? { disconnect: { id: user?.id } }
            : { connect: { id: user?.id } },
        },
      },
      refetchQueries: [
        { query: PROPOSAL_REVIEWS_QUERY, variables: { id: projectId } },
      ],
    });
  };

  return (
    <StyledFeedback id="feedbackArea">
      {reviews.map((review, num) => {
        const votedBefore = review?.upvotedBy
          ?.map((u) => u?.id)
          .includes(user?.id);

        const recommendedTasksArray = review.content
          .filter(
            (card) => card?.responseType === "taskSelector" && card?.answer
          )
          .map((card) => card.answer);
        let recommendedTasks = [];
        if (recommendedTasksArray && recommendedTasksArray.length) {
          recommendedTasks = recommendedTasksArray[0];
        }

        return (
          <div key={num} className="section">
            <div className="topLine">
              {status === "SUBMITTED_AS_PROPOSAL" ? (
                <div className="reviewer">
                  {review?.author?.image?.image?.publicUrlTransformed ? (
                    <img
                      src={review?.author?.image?.image?.publicUrlTransformed}
                      alt={review?.author?.username}
                      width="30px"
                    />
                  ) : (
                    <img src="/assets/icons/profile/user.svg" width="30px" />
                  )}
                  <div>
                    <a
                      href={`/dashboard/connect/with?id=${review?.author?.publicId}`}
                      target="_blank"
                    >
                      {review?.author?.firstName && review?.author?.lastName
                        ? `${review?.author?.firstName} ${review?.author?.lastName}`
                        : `${review?.author?.username}`}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="reviewer">Anonymous reviewer</div>
              )}

              <div>
                {review.content
                  .filter((card) => card.responseType === "selectOne")
                  .filter((card) => card.answer)
                  .map((card, num) => {
                    const [option] = card?.responseOptions.filter(
                      (option) => option?.value === card?.answer
                    );
                    return (
                      <div key={num} className={`status  ${option?.value}`}>
                        <img src={`/assets/icons/status/${option?.icon}.svg`} />
                        <div>
                          <div className="title">{option?.title}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="voteArea">
                <div
                  onClick={() => voteReview({ id: review?.id, votedBefore })}
                >
                  {votedBefore ? (
                    <Icon name="thumbs up" size="large" />
                  ) : (
                    <img src="/assets/icons/thumbsUp.svg" />
                  )}
                </div>

                <div className="votesCounter">{review?.upvotedBy?.length}</div>
              </div>
            </div>

            <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end",}}>
              {recommendedTasks.length > 0 && (
                <>
                  <p>{t('review.suggestedTasks')}</p>
                  <div className="tasksArea">
                    {recommendedTasks.map((id) => {
                      const tasksWithId = publicTasks.filter(
                        (task) => task?.id === id
                      );
                      let task = {};
                      if (tasksWithId && tasksWithId.length) {
                        task = tasksWithId[0];
                      }
                      const isFavorite = user?.favoriteTasks?.map((t) => t?.id).includes(id);
                      return (
                        <TaskChip 
                          key={id} 
                          isFavorite={isFavorite}
                        >
                          <a
                            className="taskLink"
                            href={`/dashboard/discover/tasks?name=${task?.slug}`}
                            target="_blank"
                          >
                            {task.title}
                          </a>
                          <div 
                            className="favoriteButton"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <ManageFavorite user={user} id={id} />
                          </div>
                        </TaskChip>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="cards">
              {review.content
                .filter(
                  (card) =>
                    card.responseType !== "selectOne" &&
                    card.responseType !== "taskSelector"
                )
                .filter((card) => card.answer)
                .map((card, num) => (
                  <div key={num} className="reviewerComment">
                    <div className="questionTitle">
                      {questionTitles[status] &&
                        questionTitles[status][card?.name]?.title}
                    </div>
                    <div className="questionAnswer">{card?.answer}</div>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </StyledFeedback>
  );
}
