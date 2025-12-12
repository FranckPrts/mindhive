export default function CollaboratorTags({ collaborators }) {
  if (!collaborators || collaborators.length === 0) {
    return null;
  }

  const getFirstLetter = (username) => {
    if (!username) return "";
    return username.charAt(0).toUpperCase();
  };

  const chipContainerStyle = {
    display: "flex",
    columnGap: "4px",
    rowGap: "8px",
    marginBottom: "8px",
    maxWidth: "100%",
    flexWrap: "wrap",
    alignItems: "center",
  };

  const chipStyle = {
    display: "inline-flex",
    height: "32px",
    padding: "4px 12px 4px 4px",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: "0",
    borderRadius: "30px",
    border: "1px solid #A1A1A1",
    backgroundColor: "transparent",
    gap: "8px",
    maxWidth: "100%",
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
    backgroundColor: "#EFEFEF",
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
    maxWidth: "100%",
  };

  return (
    <div style={chipContainerStyle}>
      {collaborators.map((collaborator) => {
        const hasImage = collaborator?.image?.image?.publicUrlTransformed;
        console.log(collaborator);
        const firstLetter = getFirstLetter(collaborator.username);

        return (
          <span key={collaborator.id} style={chipStyle}>
            <div style={avatarContainerStyle}>
              {hasImage ? (
                <img
                  src={hasImage}
                  alt={collaborator.username}
                  style={avatarImageStyle}
                />
              ) : (
                <div style={avatarLetterStyle}>{firstLetter}</div>
              )}
            </div>
            <p style={labelStyle}>{collaborator.username}</p>
          </span>
        );
      })}
    </div>
  );
}

