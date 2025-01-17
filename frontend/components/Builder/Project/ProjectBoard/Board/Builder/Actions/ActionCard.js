import ReactHtmlParser from "react-html-parser";
import { Draggable } from "react-smooth-dnd";

import { Image, Popup } from "semantic-ui-react";
import { StyledActionCard } from "../../../../../../styles/StyledProposal";

import Link from "next/link";
import { useRouter } from "next/router";

export default function ActionCard({
  card,
  proposalBuildMode,
  adminMode,
  openCard,
  onDeleteCard,
  settings,
  boardId,
}) {
  const router = useRouter();

  return (
    <StyledActionCard
      onClick={() => {
        router.push({
          pathname: `/builder/projects`,
          query: {
            selector: boardId,
            card: card?.id,
          },
        });
      }}
      type={card?.type}
    >
      <div className="card-drag-handle">
        <div className="card-information">
          <div className="card-left-side">
            <img src="/assets/icons/status/publicTemplate.svg" />
          </div>
          <div className="card-right-side">
            <div className="card-title">
              {card?.type === "ACTION_SUBMIT" && (
                <>
                  <div>Submit for Proposal Feedback</div>
                  <p>Click to submit for Proposal Feedback</p>
                </>
              )}

              {card?.type === "ACTION_PEER_FEEDBACK" && (
                <>
                  <div>Submit for Peer Feedback</div>
                  <p>Click to submit for Feedback</p>
                </>
              )}

              {card?.type === "ACTION_COLLECTING_DATA" && (
                <>
                  <div>Submit for Data Collection</div>
                  <p>Click to submit for Data Collection</p>
                </>
              )}

              {card?.type === "ACTION_PROJECT_REPORT" && (
                <>
                  <div>Submit for Project Report</div>
                  <p>Click to submit for Project Report</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {settings?.allowAddingCards && (
        <div className="deleteCardBtn">
          <img
            src="/assets/icons/proposal/delete.svg"
            onClick={(e) => {
              e.stopPropagation();
              if (
                confirm(
                  "Are you sure you want to delete this card? This action cannot be undone."
                )
              ) {
                onDeleteCard(card.id);
              }
            }}
          />
        </div>
      )}
    </StyledActionCard>
  );
}
