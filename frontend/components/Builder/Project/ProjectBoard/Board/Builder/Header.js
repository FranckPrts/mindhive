import { UPDATE_PROPOSAL_BOARD } from "../../../../../Mutations/Proposal";

import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../../../Queries/Proposal";

import { useMutation } from "@apollo/client";

import useForm from "../../../../../../lib/useForm";

import { Icon, Radio } from "semantic-ui-react";
import { useState, useRef, useEffect } from "react";

import useTranslation from "next-translate/useTranslation";

import CollaboratorTags from "./CollaboratorTags";
import AddCollaboratorModal from "./AddCollaboratorModal";

export default function ProposalHeader({
  user,
  proposal,
  proposalBuildMode,
  refetchQueries,
  isPDF,
  setIsPDF,
}) {
  const { t } = useTranslation("builder");
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);
  const [isAddCollaboratorModalOpen, setIsAddCollaboratorModalOpen] = useState(false);
  const titleInputRef = useRef(null);
  const titleContainerRef = useRef(null);
  const studyId = proposal?.study?.id;

  useEffect(() => {
    if (isTitleEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isTitleEditing]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isTitleEditing &&
        titleContainerRef.current &&
        !titleContainerRef.current.contains(event.target)
      ) {
        setIsTitleEditing(false);
        setIsHoveringTitle(false);
      }
    };

    if (isTitleEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTitleEditing]);

  // save and edit the study information
  const { inputs, handleChange, toggleBoolean, toggleSettingsBoolean } =
    useForm({
      ...proposal,
    });

  const [updateProposal, { loading }] = useMutation(UPDATE_PROPOSAL_BOARD, {
    variables: {
      ...inputs,
    },
    refetchQueries: [
      { query: OVERVIEW_PROPOSAL_BOARD_QUERY, variables: { id: proposal?.id } },
      ...refetchQueries,
    ],
  });

  return (
    <div className="header">
      <div>
      {!proposalBuildMode && (
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <CollaboratorTags collaborators={proposal?.collaborators} />
            <button
              onClick={() => setIsAddCollaboratorModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "20px",
                border: "1px solid #A1A1A1",
                backgroundColor: "transparent",
                cursor: "pointer",
                padding: "4px",
                flexShrink: 0,
                transition: "background-color 0.2s ease",
                margin: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F3F3F3";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title={t("header.addCollaborator", "Add collaborator")}
            >
              <span
                style={{
                  fontSize: "24px",
                  color: "#171717",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"Nunito", sans-serif',
                  fontWeight: 400,
                }}
              >
                +
              </span>
            </button>
          </div>
          <div 
            className="titleEditBtn"
            ref={titleContainerRef}
            onMouseEnter={() => setIsHoveringTitle(true)}
            onMouseLeave={() => setIsHoveringTitle(false)}>
            {isTitleEditing ? (
              <input
                ref={titleInputRef}
                type="text"
                id="proposalTitle"
                name="title"
                value={inputs.title}
                onChange={handleChange}
                className="titleEdit" style={{fontFamily: "Lato", fontWeight: 400, fontSize: "48px", margin: 0, lineHeight: "56px"}}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsTitleEditing(false);
                  }
                }}
              />
            ) : (
              <div 
                className="titleIcon" 
                style={{
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setIsTitleEditing(!isTitleEditing);
                }}
              >
                <h1 style={{margin: 0}}>{inputs?.title || t("header.myProjectBoard", "My Project Board")}</h1>
                {isHoveringTitle && (
                  <span
                    style={{
                      color: "#336F8A",
                      fontFamily: '"Nunito", sans-serif',
                      fontSize: "14px",
                      fontWeight: 600,
                      lineHeight: "20px",
                      padding: "8px 16px",
                      borderRadius: "100px",
                      border: "1px solid #336F8A",
                      transition: "background 0.2s"
                    }}
                  >
                    {t("header.edit", "Edit")}
                  </span>
                )}
              </div>
            )}
          </div>
          <div id="switchMode" style={{display: "flex", width: "max-content", marginTop: "8px"}}>
            <button onClick={() => {setIsPDF(!isPDF);}} className="narrowButton">
              <Icon name="list alternate"/> {t("proposalPage.viewFlattenBoard", "Text View")}
            </button>
          </div>
        </div>
      )}

        {proposalBuildMode && (
          <div>
            <div>
              <label htmlFor="title">
                <input
                  type="text"
                  id="propsalTitle"
                  name="title"
                  value={inputs.title}
                  onChange={handleChange}
                  required
                  className="title"
                  placeholder={t("header.titlePlaceholder", "Enter project board title")}
                />
              </label>
            </div>

            <div>
              <label htmlFor="description">
                <textarea
                  id="description"
                  name="description"
                  value={inputs.description}
                  onChange={handleChange}
                  rows="1"
                  className="description"
                  placeholder={t("header.descriptionPlaceholder", "Enter project board description")}
                />
              </label>
            </div>

            {user?.permissions.map((p) => p?.name).includes("ADMIN") && (
              <>
                <div>
                  <label htmlFor="isTemplate">
                    <div className="checkboxField">
                      <input
                        type="checkbox"
                        id="isTemplate"
                        name="isTemplate"
                        checked={inputs.isTemplate}
                        onChange={toggleBoolean}
                      />
                      <span>{t("header.publicTemplate", "Public template")}</span>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* <div>
              <label htmlFor="isSubmitted">
                <div className="checkboxField">
                  <input
                    type="checkbox"
                    id="isSubmitted"
                    name="isSubmitted"
                    checked={inputs?.isSubmitted || false}
                    onChange={toggleBoolean}
                  />
                  <span>Submit as a template</span>
                </div>
              </label>
            </div> */}

            <div>
              <label htmlFor="allowMovingSections">
                <div className="checkboxField">
                  <input
                    type="checkbox"
                    id="allowMovingSections"
                    name="allowMovingSections"
                    checked={inputs?.settings?.allowMovingSections || false}
                    onChange={toggleSettingsBoolean}
                  />
                  <span>{t("header.allowMovingSections", "Allow moving sections")}</span>
                </div>
              </label>
            </div>

            <div>
              <label htmlFor="allowMovingCards">
                <div className="checkboxField">
                  <input
                    type="checkbox"
                    id="allowMovingCards"
                    name="allowMovingCards"
                    checked={inputs?.settings?.allowMovingCards || false}
                    onChange={toggleSettingsBoolean}
                  />
                  <span>{t("header.allowMovingCards", "Allow moving cards")}</span>
                </div>
              </label>
            </div>

            <div>
              <label htmlFor="allowAddingSections">
                <div className="checkboxField">
                  <input
                    type="checkbox"
                    id="allowAddingSections"
                    name="allowAddingSections"
                    checked={inputs?.settings?.allowAddingSections || false}
                    onChange={toggleSettingsBoolean}
                  />
                  <span>{t("header.allowAddingSections", "Allow adding new sections")}</span>
                </div>
              </label>
            </div>

            <div>
              <label htmlFor="allowAddingCards">
                <div className="checkboxField">
                  <input
                    type="checkbox"
                    id="allowAddingCards"
                    name="allowAddingCards"
                    checked={inputs?.settings?.allowAddingCards || false}
                    onChange={toggleSettingsBoolean}
                  />
                  <span>{t("header.allowAddingCards", "Allow adding new cards")}</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {(inputs.title !== proposal?.title ||
          inputs.description !== proposal?.description ||
          inputs.isTemplate !== proposal?.isTemplate ||
          inputs.settings !== proposal?.settings ||
          inputs.isSubmitted !== proposal?.isSubmitted) && (
          <div>
            <button
              className="secondaryBtn"
              onClick={async () => {
                setIsTitleEditing(false);
                const res = await updateProposal();
              }}
            >
              {loading ? t("header.saving", "Saving") : t("header.save", "Save")}
            </button>
          </div>
        )}
      </div>

      {isAddCollaboratorModalOpen && (
        <AddCollaboratorModal
          proposal={proposal}
          user={user}
          onClose={() => setIsAddCollaboratorModalOpen(false)}
          refetchQueries={refetchQueries}
        />
      )}
    </div>
  );
}
