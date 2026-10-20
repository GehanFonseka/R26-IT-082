import Icon from "../common/Icon";
import "./ReferenceAnswerEditor.css";

export default function ReferenceAnswerEditor({ item, value, onChange, onCompare, disabled }) {
  const inputId = `reference-${item.questionId}`;
  const savedAnswer = item.referenceSource === "provided" ? item.referenceAnswer || "" : "";
  const changed = value.trim() !== savedAnswer.trim();
  return <div className="reference-answer-editor">
    <div className="reference-answer-editor__heading"><label htmlFor={inputId}><Icon name="edit" size={15} />Reference answer</label><span>{value.length}/6000</span></div>
    <p id={`${inputId}-hint`}>Enter the expected answer for this question, then compare it with the candidate's answer.</p>
    <textarea id={inputId} value={value} onChange={(event) => onChange(event.target.value)} maxLength={6000} rows={4} disabled={disabled} aria-describedby={`${inputId}-hint`} placeholder="Write the correct answer and the key points you expect…" />
    <div className="reference-answer-editor__actions"><span>{!item.answer ? "Waiting for a candidate answer." : changed ? "Reference changed. Compare again to update the scores." : savedAnswer ? "This reference is used in the saved comparison." : "The saved result uses a reference derived from job context."}</span><button type="button" onClick={onCompare} disabled={disabled || !value.trim() || !item.answer}><Icon name="refresh" size={14} />{disabled ? "Please wait…" : "Compare answers"}</button></div>
    {item.referenceAnswer && <details><summary>Reference used for the displayed result · {item.referenceSource === "provided" ? "Interviewer supplied" : "Job context"}</summary><p>{item.referenceAnswer}</p></details>}
    {item.modelError && <p className="reference-answer-editor__error" role="alert">The interview model could not score this answer. Try comparing again.</p>}
  </div>;
}
