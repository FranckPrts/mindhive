import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import { PROPOSAL_CARD_TYPE } from "./cardTypeOptions";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 20040,
  background: "rgba(23, 23, 23, 0.35)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle = {
  width: "min(560px, 90vw)",
  maxHeight: "90vh",
  overflowY: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  background: "#fff",
  border: "1px solid #A1A1A1",
  borderRadius: 16,
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.18)",
  padding: 32,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #A1A1A1",
  borderRadius: 8,
  padding: "12px 16px",
  font: "var(--MH-Type-Body-Base)",
  letterSpacing: 0,
  color: "#171717",
};

const labelStyle = {
  display: "grid",
  gap: 8,
  color: "#5D5763",
  font: "var(--MH-Type-Title-Small)",
  letterSpacing: 0,
};

/**
 * Proposal card create only. Milestone create opens MilestoneCreateMode
 * via Section → openCard({ createMilestone: true }).
 */
export default function CreateCardModal({
  creating = false,
  onClose,
  onCreateCard,
  open,
  sectionId,
}) {
  const { t } = useTranslation("builder");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!open) {
      setTitle("");
    }
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const trimmedTitle = title.trim();
  const createDisabled = creating || !sectionId || !trimmedTitle;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (createDisabled) return;

    await onCreateCard({
      sectionId,
      title: trimmedTitle,
      type: PROPOSAL_CARD_TYPE,
      milestoneId: null,
    });
  };

  return createPortal(
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && !creating) onClose();
      }}
    >
      <style>{`
        .createCardModalForm::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <form
        className="createCardModalForm"
        style={modalStyle}
        onSubmit={handleSubmit}
      >
        <h2
          style={{
            margin: "0 0 24px",
            font: "var(--MH-Type-Heading-Base)",
            letterSpacing: 0,
            color: "#000",
          }}
        >
          {t(
            "section.createCardModal.title",
            {
              cardCategory: t(
                "section.createCardModal.proposal",
                {},
                { default: "card" }
              ),
            },
            { default: "Create a new {{cardCategory}}" }
          )}
        </h2>

        <label style={labelStyle}>
          {t(
            "section.createCardModal.titleLabel",
            {},
            { default: "Card title" }
          )}
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t(
              "section.createCardModal.titlePlaceholder",
              {},
              { default: "Enter a card title" }
            )}
            style={inputStyle}
          />
        </label>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginTop: 28,
          }}
        >
          <Button
            type="button"
            variant="subtle"
            disabled={creating}
            onClick={onClose}
          >
            {t("section.createCardModal.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button type="submit" disabled={createDisabled}>
            {creating
              ? t(
                  "section.createCardModal.creating",
                  {},
                  { default: "Creating..." }
                )
              : t("section.createCardModal.create", {}, { default: "Create" })}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
