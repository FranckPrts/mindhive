import JoditEditor from "../../Jodit/Editor";
import { StyledInput } from "../../styles/StyledForm";

export default function LessonForm({ inputs, handleChange, loading }) {
  const setContent = (content) =>
    handleChange({
      target: { name: "content", value: content },
    });

  return (
    <div>
      <StyledInput>
        <h1>{inputs.title}</h1>

        <div>
          <label htmlFor="title">
            Title
            <input
              type="title"
              name="title"
              value={inputs?.title}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label htmlFor="description">
            Description
            <textarea
              id="description"
              rows="5"
              name="description"
              value={inputs?.description}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>Keywords</div>
      </StyledInput>

      <JoditEditor content={inputs.content} setContent={setContent} />
    </div>
  );
}
