import { useState } from "react";
import Icon from "../common/Icon";
import { copyInterviewRoomLink } from "../../utils/interviewLink";
import "./InterviewLinkButton.css";

function InterviewLinkButton({ interviewId, compact = false }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await copyInterviewRoomLink(interviewId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button className={`interview-link-button${compact ? " interview-link-button--compact" : ""}`} type="button" onClick={copyLink} title="Copy interview room link">
      <Icon name={copied ? "check" : "link"} size={14} />
      {copied ? "Link copied" : "Copy room link"}
    </button>
  );
}

export default InterviewLinkButton;
