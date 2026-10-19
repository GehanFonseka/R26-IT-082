import { useEffect, useState } from "react";

const currentSection = () => {
  const section = window.location.hash.slice(1);
  return ["cv-profile", "save-profile", "certificates"].includes(section) ? section : "account-details";
};

export default function useProfileSection() {
  const [section, setSection] = useState(currentSection);
  useEffect(() => {
    const updateSection = () => setSection(currentSection());
    window.addEventListener("hashchange", updateSection);
    return () => window.removeEventListener("hashchange", updateSection);
  }, []);
  return section;
}
