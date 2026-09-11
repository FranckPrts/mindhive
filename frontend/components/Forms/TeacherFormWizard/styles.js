import styled from "styled-components";

export const WizardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  overflow: hidden;
`;

/** In-flow panel for matching-round create/edit (not a modal or viewport takeover). */
export const PageShell = styled.section`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: min(60vh, 640px);
  max-height: calc(100vh - 220px);
  box-sizing: border-box;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  overflow: hidden;
`;

export const PageHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

export const PageTitle = styled.h2`
  margin: 0;
  font: var(--MH-Type-Title-Base);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  min-width: 0;
`;

export const PageBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  box-sizing: border-box;
`;

export const PageFooter = styled.footer`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-top: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

export const StepMeta = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
`;

export const FieldStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .field-hint {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  }

  input,
  textarea {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    border: 2px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
    border-radius: 8px;
    padding: 9px 11px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    box-sizing: border-box;

    /* Color-only focus — no outer ring for overflow:hidden wizard/modal bodies. */
    &:focus {
      outline: none;
      border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    }
  }

  textarea {
    min-height: 88px;
    resize: vertical;
  }
`;

export const BuilderColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

export const QuestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;

  .smooth-dnd-container {
    min-height: 4px;
  }

  .smooth-dnd-draggable-wrapper {
    overflow: visible;
  }
`;

export const QuestionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

export const QuestionCard = styled.div`
  border: 1px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const QuestionCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .question-title-block {
    flex: 1 1 auto;
    min-width: 0;
  }

  .question-meta {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
`;

export const DragHandle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  cursor: grab;
  touch-action: none;
  user-select: none;

  &:hover {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  &:active {
    cursor: grabbing;
  }

  &[aria-disabled="true"] {
    opacity: 0.35;
    cursor: default;
    pointer-events: none;
  }

  svg {
    display: block;
  }
`;

export const InsertSlot = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 20px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: transparent;
  transition: height 0.12s ease, color 0.12s ease, background-color 0.12s ease;

  .insert-label {
    display: none;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    white-space: nowrap;
  }

  &::before {
    content: "";
    display: block;
    width: 100%;
    height: 2px;
    border-radius: 1px;
    background: transparent;
    transition: background-color 0.12s ease;
  }

  &:hover,
  &:focus-visible {
    height: 36px;
    color: var(--MH-Theme-Primary-Dark, #336f8a);
    outline: none;

    &::before {
      display: none;
    }

    .insert-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px dashed var(--MH-Theme-Primary-Dark, #336f8a);
      background: var(--MH-Theme-Primary-Light, #def8fb);
    }
  }

  &:disabled {
    cursor: default;
    pointer-events: none;
  }
`;

export const TypePicker = styled.div`
  display: ${({ $compact }) => ($compact ? "inline-flex" : "grid")};
  ${({ $compact }) =>
    $compact
      ? `
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  `
      : `
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;

    @media (max-width: 900px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 720px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `}
`;

export const TypeTile = styled.button`
  text-align: ${({ $compact }) => ($compact ? "center" : "left")};
  border-radius: ${({ $compact }) => ($compact ? "10px" : "12px")};
  border: 2px solid
    ${({ $active }) =>
      $active
        ? "var(--MH-Theme-Primary-Dark, #336f8a)"
        : "var(--MH-Theme-Neutrals-Light, #d3dae0)"};
  background: ${({ $active }) =>
    $active ? "var(--MH-Theme-Primary-Light, #def8fb)" : "#fff"};
  color: ${({ $active }) =>
    $active
      ? "var(--MH-Theme-Primary-Dark, #336f8a)"
      : "var(--MH-Theme-Neutrals-Dark, #5f6871)"};
  padding: ${({ $compact }) => ($compact ? "6px" : "10px 10px 8px")};
  width: ${({ $compact }) => ($compact ? "36px" : "auto")};
  height: ${({ $compact }) => ($compact ? "36px" : "auto")};
  min-width: ${({ $compact }) => ($compact ? "36px" : "0")};
  display: ${({ $compact }) => ($compact ? "inline-flex" : "flex")};
  flex-direction: ${({ $compact }) => ($compact ? "row" : "column")};
  align-items: ${({ $compact }) => ($compact ? "center" : "flex-start")};
  justify-content: ${({ $compact }) => ($compact ? "center" : "flex-start")};
  gap: ${({ $compact }) => ($compact ? "0" : "6px")};
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .type-icon {
    flex-shrink: 0;
    display: block;
  }

  .type-label {
    display: block;
    font: var(--MH-Type-Label-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .type-hint {
    display: block;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  }

  &.active .type-label {
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

export const MetaHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
`;

export const MetaActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const PreviewStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 14px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Soft, #f7f9f8);
  pointer-events: none;
`;

export const ErrorText = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
  color: #b42318;
`;

export const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font: var(--MH-Type-Body-Base) !important;
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  cursor: pointer;

  input {
    margin: 0;
  }
`;

export const CloneList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow: auto;
`;

export const CloneRow = styled.button`
  text-align: left;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
  border-radius: 10px;
  background: #fff;
  padding: 10px 12px;
  cursor: pointer;

  .clone-title {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: #171717;
  }

  .clone-desc {
    margin-top: 4px;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: #5f6871;
  }
`;
