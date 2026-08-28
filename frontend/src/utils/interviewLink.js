export const interviewRoomPath = (interviewId) => `/interviews/${encodeURIComponent(interviewId)}`;

export const interviewRoomUrl = (interviewId) => new URL(
  interviewRoomPath(interviewId),
  window.location.origin,
).toString();

export const copyInterviewRoomLink = async (interviewId) => {
  const url = interviewRoomUrl(interviewId);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return url;
  }
  const input = document.createElement("textarea");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
  return url;
};
