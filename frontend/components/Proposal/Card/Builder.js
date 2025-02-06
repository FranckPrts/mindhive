import { useRef } from "react";
import { useMutation } from "@apollo/client";
import { Checkbox } from "semantic-ui-react";

import { UPDATE_CARD_CONTENT } from "../../Mutations/Proposal";

import useForm from "../../../lib/useForm";
import JoditEditor from "../../Jodit/Editor";

import CardType from "./Forms/Type";
import Resources from "./Forms/Resources";

export default function BuilderProposalCard({
  user,
  proposal,
  proposalCard,
  closeCard,
}) {
  const { inputs, handleChange } = useForm({
    ...proposalCard,
  });

  const description = useRef(proposalCard?.description);
  const content = useRef(proposalCard?.content);
  const internalContent = useRef(proposalCard?.internalContent);

  const [updateCard, { loading: updateLoading }] =
    useMutation(UPDATE_CARD_CONTENT);

  // update card content in the local state
  const handleContentChange = async ({ contentType, newContent }) => {
    if (contentType === "description") {
      description.current = newContent;
    }
    if (contentType === "internalContent") {
      internalContent.current = newContent;
    }
    if (contentType === "content") {
      content.current = newContent;
    }
  };

  // update the card and close the modal
  const onUpdateCard = async () => {
    await updateCard({
      variables: {
        ...inputs,
        description: description?.current,
        internalContent: internalContent?.current,
        content: content?.current,
        assignedTo: inputs?.assignedTo?.map((a) => ({ id: a?.id })),
        resources: inputs?.resources?.map((resource) => ({ id: resource?.id })),
      },
    });
    closeCard({ cardId: proposalCard?.id, lockedByUser: false });
  };

  return (
    <div className="post">
      <div className="navigation-build-mode">
        <div className="left">
          <div
            className="icon"
            onClick={() =>
              closeCard({ cardId: proposalCard?.id, lockedByUser: false })
            }
          >
            <div className="selector">
              <img src="/assets/icons/back.svg" alt="back" />
            </div>
          </div>
        </div>
        <div className="middle">
          <span className="studyTitle">{proposal?.title}</span>
        </div>
        <div className="right">
          <button onClick={() => onUpdateCard()} className="saveButton">
            Save
          </button>
        </div>
      </div>

      <div className="proposalCardBoard">
        <div className="textBoard">
          <label htmlFor="title">
            <div className="cardHeader">Card Title</div>
            <div className="cardSubheaderComment">
              Add or edit the card title. This title will appear as a section
              title if student input is made visible
            </div>
            <p></p>
            <input
              type="text"
              id="title"
              name="title"
              value={inputs?.title}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="description">
            <div className="cardHeader">Instructions for Students</div>
            <div className="cardSubheaderComment">
              Add or edit instructions for students telling them how to complete
              the card
            </div>
            <div className="jodit">
              <JoditEditor
                content={description?.current}
                setContent={(newContent) =>
                  handleContentChange({
                    contentType: "description",
                    newContent,
                  })
                }
                minHeight={300}
              />
            </div>
          </label>

          {!inputs?.settings?.excludeFromCollaborators && (
            <>
              <label htmlFor="description">
                <div className="cardHeader">
                  Student Response Box - For Project Collaborators
                </div>
                <div className="cardSubheaderComment">
                  The content students include here will only be visible to
                  their project collaborators and teacher(s). Include any
                  templates or placeholder text as needed
                </div>
              </label>

              <div className="jodit">
                <JoditEditor
                  content={internalContent?.current}
                  setContent={(newContent) =>
                    handleContentChange({
                      contentType: "internalContent",
                      newContent,
                    })
                  }
                  minHeight={300}
                />
              </div>
            </>
          )}

          {inputs?.settings?.includeInReport && (
            <>
              <label htmlFor="description">
                <div className="cardHeader">
                  Student Response Box - For MindHive Network
                </div>
                <div className="cardSubheaderComment">
                  The content students include here will be visible in the
                  Feedback Center once it is submitted via an Action Card.
                  Include any templates or placeholder text as needed
                </div>
              </label>
              <div className="jodit">
                <JoditEditor
                  content={content?.current}
                  setContent={(newContent) =>
                    handleContentChange({
                      contentType: "content",
                      newContent,
                    })
                  }
                  minHeight={300}
                />
              </div>
            </>
          )}
        </div>
        <div className="infoBoard">
          <>
            <div className="cardHeader">Visibility</div>
            <div className="cardSubheaderComment">
              Check the boxes below to indicate whether student responses should
              be kept private (only for collaborators on the project + teacher)
              or made visible in the Feedback Center - or a combination of both.
              Examples of “visible” responses you might want to include:
              Proposal, Peer Review, or Final Report responses.
            </div>

            <div className="checkboxText">
              <Checkbox
                name="collaboratorsCardToggle"
                id="collaboratorsCardToggle"
                onChange={(event, data) =>
                  handleChange({
                    target: {
                      name: "settings",
                      value: {
                        ...inputs.settings,
                        excludeFromCollaborators: !data.checked,
                      },
                    },
                  })
                }
                checked={!inputs?.settings?.excludeFromCollaborators}
              />

              <label for="collaboratorsCardToggle">
                <div className="cardDescription">
                  Include text input for project collaborators
                </div>
              </label>
            </div>

            <div className="checkboxText">
              <Checkbox
                name="feedbackCenterCardToggle"
                id="feedbackCenterCardToggle"
                onChange={(event, data) =>
                  handleChange({
                    target: {
                      name: "settings",
                      value: {
                        ...inputs.settings,
                        includeInReport: data.checked,
                      },
                    },
                  })
                }
                checked={inputs?.settings?.includeInReport}
              />

              <label for="feedbackCenterCardToggle">
                <div className="cardDescription">
                  Include text input for Feedback Center
                </div>
              </label>
            </div>
          </>

          {user.permissions.map((p) => p?.name).includes("ADMIN") && (
            <div>
              <div className="cardHeader">Type</div>
              <CardType type={inputs?.type} handleChange={handleChange} />
            </div>
          )}

          <>
            <div className="cardHeader">Resources</div>
            <div className="cardSubheaderComment">
              Add existing resources (See Resources in Navigation Pane)
            </div>
            <Resources
              proposal={proposal}
              user={user}
              handleChange={handleChange}
              selectedResources={inputs?.resources || []}
            />
          </>

          <div className="proposalCardComments">
            <div className="cardHeader">Comments</div>
            <div className="cardSubheaderComment">
              This will pre-populate the Comment Box for students. You can
              delete comments later.
            </div>
            <textarea
              rows="5"
              type="text"
              id="comment"
              name="comment"
              value={inputs.comment}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
