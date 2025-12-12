import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { SEARCH_CLASS_STUDENTS } from "../../../../../Queries/Proposal";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../../../Queries/Proposal";

export default function AddCollaboratorModal({ proposal, user, onClose, refetchQueries = [] }) {
  const { t } = useTranslation("builder");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const modalRef = useRef(null);

  // Get current collaborators from proposal
  const currentCollaborators = proposal?.collaborators || [];

  // Get class IDs from user's studentIn, teacherIn, and mentorIn classes
  const studentClassIds = user?.studentIn?.map((c) => c?.id).filter(Boolean) || [];
  const teacherClassIds = user?.teacherIn?.map((c) => c?.id).filter(Boolean) || [];
  const mentorClassIds = user?.mentorIn?.map((c) => c?.id).filter(Boolean) || [];
  
  // Combine all class IDs and remove duplicates
  const userClassIds = [
    ...new Set([...studentClassIds, ...teacherClassIds, ...mentorClassIds]),
  ];

  // Initialize selected with current collaborators
  useEffect(() => {
    if (currentCollaborators.length > 0) {
      setSelected(currentCollaborators.map((c) => c.id));
    }
  }, [proposal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search query - only run if we have class IDs
  const { data: usersData, loading: searchLoading } = useQuery(SEARCH_CLASS_STUDENTS, {
    variables: {
      classIds: userClassIds,
      search: search || "",
    },
    skip: userClassIds.length === 0,
  });

  // Filter users: exclude current user and already selected
  const users =
    usersData?.profiles?.filter(
      (u) => u.id !== user?.id && !selected.includes(u.id)
    ) || [];

  const [updateProposalBoard, { loading: saveLoading, error }] = useMutation(
    UPDATE_PROJECT_BOARD,
    {
      refetchQueries: [
        { query: OVERVIEW_PROPOSAL_BOARD_QUERY, variables: { id: proposal?.id } },
        ...refetchQueries,
      ],
    }
  );

  const handleAdd = (userId) => {
    if (!selected.includes(userId)) {
      setSelected((prev) => [...prev, userId]);
    }
  };

  const handleRemove = (userId) => {
    setSelected((prev) => prev.filter((s) => s !== userId));
  };

  const handleSave = async () => {
    try {
      const initialCollabIds = currentCollaborators.map((c) => c.id);
      const connectCollaborators = selected
        .filter((id) => !initialCollabIds.includes(id))
        .map((id) => ({ id }));
      const disconnectCollaborators = initialCollabIds
        .filter((id) => !selected.includes(id))
        .map((id) => ({ id }));

      await updateProposalBoard({
        variables: {
          id: proposal?.id,
          input: {
            collaborators: {
              connect: connectCollaborators,
              disconnect: disconnectCollaborators,
            },
          },
        },
      });
      onClose();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error updating collaborators:", err);
      alert(t("header.updateCollaboratorsFailed", "Failed to update collaborators"));
    }
  };

  const handleClearSearch = () => setSearch("");

  // Handle ESC key and click outside
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Get first letter for avatar
  const getFirstLetter = (username) => {
    if (!username) return "";
    return username.charAt(0).toUpperCase();
  };

  // Get user object by ID
  const getUserById = (userId) => {
    return (
      usersData?.profiles?.find((u) => u.id === userId) ||
      currentCollaborators.find((c) => c.id === userId)
    );
  };

  // Modal wrapper styles (backdrop)
  const modalWrapperStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 2000,
    paddingTop: "10%",
  };

  // Modal container styles
  const modalStyle = {
    position: "relative",
    maxWidth: "80%",
    maxHeight: "90vh",
    background: "white",
    padding: "2.5rem",
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
    overflow: "auto",
    width: "100%",
    boxSizing: "border-box",
  };

  // Close button styles
  const closeBtnStyle = {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "none",
    border: "none",
    fontSize: "1.8rem",
    cursor: "pointer",
    color: "#6c757d",
    padding: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // Title styles
  const titleStyle = {
    fontFamily: '"Nunito", sans-serif',
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "1rem",
    color: "#171717",
  };

  // Search input wrapper
  const searchInputWrapperStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    marginBottom: "1.5rem",
  };

  const searchInputStyle = {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #A1A1A1",
    borderRadius: "4px",
    fontSize: "1rem",
    fontFamily: '"Nunito", sans-serif',
    paddingRight: search ? "2.5rem" : "0.75rem",
  };

  const clearSearchBtnStyle = {
    position: "absolute",
    right: "0.5rem",
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    color: "#6c757d",
    cursor: "pointer",
    padding: "0.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // User list styles
  const userListStyle = {
    marginTop: "1rem",
    maxHeight: "200px",
    overflowY: "auto",
    marginBottom: "1.5rem",
  };

  const userItemStyle = {
    display: "inline-flex",
    justifyContent: "flex-start",
    gap: "0.5rem",
    alignItems: "center",
    padding: "0.75rem 0",
  };

  const userNameStyle = {
    fontFamily: '"Nunito", sans-serif',
    fontSize: "1rem",
    color: "#171717",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  const actionBtnStyle = {
    width: "32px",
    height: "32px",
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    color: "#28a745",
    padding: "0.25rem 0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // Collaborator chip styles (Design System: Basic Chips - Label & Avatar with closing icon)
  const chipContainerStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  };

  const chipStyle = {
    display: "inline-flex",
    height: "32px",
    padding: "4px 8px 4px 4px",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: "0",
    borderRadius: "30px",
    border: "1px solid #A1A1A1",
    backgroundColor: "transparent",
    gap: "8px",
    cursor: "default",
  };

  const avatarContainerStyle = {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    // border: "1px solid #A1A1A1",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  };

  const avatarImageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const avatarLetterStyle = {
    fontFamily: '"Roboto", sans-serif',
    fontWeight: 500,
    fontSize: "16px",
    lineHeight: "24px",
    color: "#171717",
    textAlign: "center",
    letterSpacing: "0.1px",
  };

  const labelStyle = {
    fontFamily: '"Nunito", sans-serif',
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: "20px",
    color: "#171717",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const removeBtnStyle = {
    fontSize: "16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#171717",
    padding: "0",
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "18px",
    height: "18px",
    flexShrink: 0,
  };

  // Modal actions (Design System: Text Button - Filled variant)
  const modalActionsStyle = {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
  };

  const saveBtnStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40px",
    minWidth: "fit-content",
    height: "auto",
    width: "auto",
    padding: "8px 24px",
    background: "#336F8A",
    color: "white",
    border: "none",
    borderRadius: "100px",
    cursor: "pointer",
    fontFamily: '"Nunito", sans-serif',
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "20px",
    transition: "all 0.2s ease",
  };

  const saveBtnHoverStyle = {
    ...saveBtnStyle,
    boxShadow: "2px 2px 12px 0px rgba(0,0,0,0.15)",
  };

  const saveBtnDisabledStyle = {
    ...saveBtnStyle,
    background: "#E6E6E6",
    color: "#6A6A6A",
    cursor: "not-allowed",
  };

  const cancelBtnStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "40px",
    minWidth: "fit-content",
    width: "auto",
    padding: "8px 24px",
    background: "transparent",
    color: "#336F8A",
    border: "1px solid #336F8A",
    borderRadius: "100px",
    cursor: "pointer",
    fontFamily: '"Nunito", sans-serif',
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "20px",
    transition: "all 0.2s ease",
  };

  const cancelBtnHoverStyle = {
    ...cancelBtnStyle,
    background: "#F3F3F3",
  };

  // Show message if no classes
  if (userClassIds.length === 0) {
    return (
      <div style={modalWrapperStyle}>
        <div style={modalStyle} ref={modalRef}>
          {/* <button style={closeBtnStyle} onClick={onClose}>
            <Icon name="close" />
          </button> */}
          <h2 style={titleStyle}>
            {t("header.addCollaborators", "Add Collaborators")}
          </h2>
          <p style={{ color: "#171717", fontFamily: '"Nunito", sans-serif' }}>
            {t(
              "header.noClassesMessage",
              "You must be enrolled in a class to add collaborators."
            )}
          </p>
          <div style={modalActionsStyle}>
            <button style={cancelBtnStyle} onClick={onClose}>
              {t("header.close", "Close")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalWrapperStyle}>
      <div style={modalStyle} ref={modalRef}>
        {/* <button style={closeBtnStyle} onClick={onClose}>
          <Icon name="close" />
        </button> */}

        <h2 style={titleStyle}>
          {t("header.addCollaborators", "Add Collaborators")}
        </h2>

        <div>
          <div style={searchInputWrapperStyle}>
            <input
              type="text"
              placeholder={t(
                "header.searchStudentsPlaceholder",
                "Search students in your class..."
              )}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInputStyle}
            />
            {/* {search && (
              <button style={clearSearchBtnStyle} onClick={handleClearSearch}>
                <Icon name="close" />
              </button>
            )} */}
          </div>

          {searchLoading && (
            <p style={{ color: "#6A6A6A", fontFamily: '"Nunito", sans-serif' }}>
              {t("header.searching", "Searching...")}
            </p>
          )}

          {!searchLoading && users.length > 0 && (
            <div style={userListStyle}>
              <h3
                style={{
                  fontFamily: '"Nunito", sans-serif',
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "#171717",
                }}
              >
                {t("header.searchResults", "Search Results")}
              </h3>
              {users.map((u) => {
                const hasImage = u?.image?.image?.publicUrlTransformed;
                const firstLetter = getFirstLetter(u.username);

                return (
                  <div key={u.id} style={userItemStyle}>
                     <button
                        style={actionBtnStyle}
                        onClick={() => handleAdd(u.id)}
                        title={t("header.addCollaborator", "Add collaborator")}
                    >
                        <img src="/assets/icons/add.svg" style={{ width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%", display: "block" }} alt="Add" />
                    </button>
                    <div style={userNameStyle}>
                      <div style={avatarContainerStyle}>
                        {hasImage ? (
                          <img
                            src={hasImage}
                            alt={u.username}
                            style={avatarImageStyle}
                          />
                        ) : (
                          <div style={avatarLetterStyle}>{firstLetter}</div>
                        )}
                      </div>
                      <span>{u.username}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!searchLoading && search && users.length === 0 && (
            <p
              style={{
                color: "#6A6A6A",
                fontFamily: '"Nunito", sans-serif',
                marginTop: "1rem",
              }}
            >
              {t("header.noResults", "No students found matching your search.")}
            </p>
          )}
        </div>

        {selected.length > 0 && (
          <div>
            <h3
              style={{
                fontFamily: '"Nunito", sans-serif',
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "#171717",
              }}
            >
              {t("header.selectedCollaborators", "Selected Collaborators")}
            </h3>
            <div style={chipContainerStyle}>
              {selected.map((s) => {
                const userObj = getUserById(s);
                if (!userObj) return null;

                const hasImage = userObj?.image?.image?.publicUrlTransformed;
                const firstLetter = getFirstLetter(userObj.username);

                return (
                  <span
                    key={s}
                    style={chipStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F3F3F3";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={avatarContainerStyle}>
                      {hasImage ? (
                        <img
                          src={hasImage}
                          alt={userObj.username}
                          style={avatarImageStyle}
                        />
                      ) : (
                        <div style={avatarLetterStyle}>{firstLetter}</div>
                      )}
                    </div>
                    <p style={labelStyle}>{userObj.username}</p>
                    <button
                      style={removeBtnStyle}
                      onClick={() => handleRemove(s)}
                      title={t("header.removeCollaborator", "Remove collaborator")}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <img src="/assets/icons/review/close.svg" style={{ width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%", display: "block"}} alt="Close" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div style={modalActionsStyle}>
          <button
            style={saveLoading ? saveBtnDisabledStyle : saveBtnStyle}
            onClick={handleSave}
            disabled={saveLoading}
            onMouseEnter={(e) => {
              if (!saveLoading) {
                Object.assign(e.target.style, saveBtnHoverStyle);
              }
            }}
            onMouseLeave={(e) => {
              if (!saveLoading) {
                Object.assign(e.target.style, saveBtnStyle);
              }
            }}
          >
            {saveLoading
              ? t("header.saving", "Saving...")
              : t("header.save", "Save")}
          </button>
          <button
            style={cancelBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, cancelBtnHoverStyle);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, cancelBtnStyle);
            }}
          >
            {t("header.cancel", "Cancel")}
          </button>
        </div>

        {error && (
          <p
            style={{
              color: "#dc3545",
              fontFamily: '"Nunito", sans-serif',
              marginTop: "1rem",
            }}
          >
            {t("header.error", "Error")}: {error.message}
          </p>
        )}
      </div>
    </div>
  );
}

