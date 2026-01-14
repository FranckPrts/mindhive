import { useState } from "react";
import {
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  Dropdown,
  Icon,
} from "semantic-ui-react";

import ReactStars from "react-rating-stars-component"; // https://www.npmjs.com/package/react-rating-stars-component
import TaskSelector from "./TaskSelector";
import useTranslation from "next-translate/useTranslation";
import TipTapEditor from "../../../../TipTap/Main";

export default function Question({ stage, item, handleItemChange, answer, projectId, user }) {
  const { t } = useTranslation("builder");
  const { responseType } = item;
  const [aiUiOpen, setAiUiOpen] = useState(false);

  // Check if user has permission to see the AI button
  const permissions = user?.permissions?.map((p) => p?.name) || [];
  const canSeeAiButton = 
    permissions.includes("MENTOR") || 
    permissions.includes("TEACHER") || 
    permissions.includes("ADMIN");

  if (responseType === "selectOne") {
    const options = item?.responseOptions.map((r) => ({
      key: r.value,
      value: r.value,
      content: (
        <div className="dropdownOption">
          <img src={`/assets/icons/status/${r?.icon}.svg`} />
          <div>
            <div className="title">{r?.title}</div>
            <div className="subtitle">{r?.subtitle}</div>
          </div>
        </div>
      ),
      text: (
        <div className="dropdownSelectedOption">
          <img src={`/assets/icons/status/${r?.icon}.svg`} />
          <div>
            <div className="title">{r?.title}</div>
          </div>
        </div>
      ),
    }));

    return (
      <div className="reviewItem">
        <div className="question">{item.question}</div>
        <Dropdown
          placeholder={t("reviewDetail.selectOption")}
          fluid
          selection
          options={options}
          onChange={(event, data) =>
            handleItemChange({
              className: "answer",
              name: item.name,
              value: data?.value,
            })
          }
          value={answer}
          className="custom-dropdown"
        />
      </div>
    );
  }

  if (responseType === "taskSelector") {
    return (
      <div className="reviewItem">
        <TaskSelector
          name={item?.name}
          handleItemChange={handleItemChange}
          answer={answer || []}
        />
      </div>
    );
  }

  return (
    <div className="reviewItem">
      <div>
        <div className="question">{item.question}</div>
        {item.subtitle && <div className="subtitle">{item.subtitle}</div>}
        {item.subQuestionA && (
          <div className="subtitle">{item.subQuestionA}</div>
        )}
        {item.subQuestionB && (
          <div className="subtitle">{item.subQuestionB}</div>
        )}
        <p>{item.text}</p>
      </div>

      {stage === "IN_REVIEW" && (
        <div>
          <ReactStars
            count={5}
            onChange={(value) =>
              handleItemChange({
                className: "rating",
                name: item.name,
                value,
              })
            }
            size={24}
            activeColor="#ffd700"
            isHalf
            value={item?.rating}
          />
        </div>
      )}

      <div className="answer">
        <TipTapEditor
          content={answer || ""}
          onUpdate={(newContent) =>
            handleItemChange({
              className: "answer",
              name: item.name,
              value: newContent,
            })
          }
          isEditable={true}
          toolbarVisible={true}
          specialButton={canSeeAiButton ? {
            label: "",
            icon: "/assets/ai/ai_chat_bubble.svg",
            onClick: () => setAiUiOpen(!aiUiOpen),
            color: "#55808C",
            colorBackground: "#D3E0E3",
            basic: false,
          } : null}
          aiUiContent={
            aiUiOpen
              ? () => {
                  // AI UI content will be defined later
                  return null;
                }
              : null
          }
          aiUiProps={
            aiUiOpen
              ? {
                  proposalId: projectId,
                  questionNumber: item.name,
                  currentTextContent: answer || "",
                }
              : null
          }
          hiddenToolbarButtons={['heading',  'list', 'link', 'quote', 'image', 'table']}
        />
      </div>
    </div>
  );
}
