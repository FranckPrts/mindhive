import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import ButtonGroup from "../../../../DesignSystem/ButtonGroup";
import {
  MATCHING_VIEW_PIVOT,
  MATCHING_VIEW_PROJECT_FIRST,
  MATCHING_VIEW_TEAM_FIRST,
} from "./matchingViewModes";

const HeaderCard = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

const SearchRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  flex: 1 1 280px;
  min-width: 0;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 240px;
  padding: 10px 14px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #d3dae0);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

export default function MatchingRoundMatchingHeaderBar({
  queueMode = MATCHING_VIEW_PROJECT_FIRST,
  onQueueModeChange,
  peopleQuery = "",
  onPeopleQueryChange,
  opportunityQuery = "",
  onOpportunityQueryChange,
}) {
  const { t } = useTranslation("classes");

  const queueItems = [
    {
      value: MATCHING_VIEW_TEAM_FIRST,
      label: t(
        "opportunities.matchingRound.matching.queueTeamFirst",
        {},
        { default: "Team first" },
      ),
    },
    {
      value: MATCHING_VIEW_PROJECT_FIRST,
      label: t(
        "opportunities.matchingRound.matching.queueProjectFirst",
        {},
        { default: "Project first" },
      ),
    },
    {
      value: MATCHING_VIEW_PIVOT,
      label: t(
        "opportunities.matchingRound.matching.queuePivot",
        {},
        { default: "Pivot table" },
      ),
    },
  ];

  return (
    <HeaderCard className="matchingRoundMatchingHeaderBar">
      <ButtonGroup
        type="Square"
        size="Medium"
        selectionMode="single"
        selectionRequired
        value={queueMode}
        onChange={(value) => {
          if (typeof value === "string" && onQueueModeChange) {
            onQueueModeChange(value);
          }
        }}
        items={queueItems}
        aria-label={t(
          "opportunities.matchingRound.matching.queueModeAria",
          {},
          { default: "Matching view" },
        )}
      />
      <SearchRow>
        <SearchInput
          type="search"
          value={peopleQuery}
          onChange={(event) => onPeopleQueryChange?.(event.target.value)}
          placeholder={t(
            "opportunities.matchingRound.matching.searchPeoplePlaceholder",
            {},
            { default: "Search people…" },
          )}
          aria-label={t(
            "opportunities.matchingRound.matching.searchPeoplePlaceholder",
            {},
            { default: "Search people…" },
          )}
        />
        <SearchInput
          type="search"
          value={opportunityQuery}
          onChange={(event) => onOpportunityQueryChange?.(event.target.value)}
          placeholder={t(
            "opportunities.matchingRound.matching.searchOpportunityPlaceholder",
            {},
            { default: "Search opportunities…" },
          )}
          aria-label={t(
            "opportunities.matchingRound.matching.searchOpportunityPlaceholder",
            {},
            { default: "Search opportunities…" },
          )}
        />
      </SearchRow>
    </HeaderCard>
  );
}
