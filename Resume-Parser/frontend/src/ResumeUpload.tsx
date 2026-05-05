import axios from "axios";
import { useState } from "react";
import SkillProficiencyDashboard from "./SkillProficiencyDashboard";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(
      "http://127.0.0.1:8000/api/upload",
      formData
    );

    setResult(res.data);
  };

  return (
    <div>
      <h2>Upload Resume</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload}>Upload</button>

      {result && (
        <>
          <h3>Skills</h3>
          <p>{result.skills.join(", ")}</p>

          <SkillProficiencyDashboard skills={result.skill_profile} />
        </>
      )}
    </div>
  );
}