import React from "react";

type Skill = {
  skill: string;
  level: string;
  score: number;
};

export default function SkillProficiencyDashboard({
  skills,
}: {
  skills: Skill[];
}) {
  return (
    <div>
      <h2>Skill Proficiency</h2>

      {skills.map((s, index) => (
        <div key={index} style={{ marginBottom: "10px" }}>
          <strong>{s.skill.toUpperCase()}</strong> ({s.level})

          <div
            style={{
              background: "#eee",
              height: "10px",
              borderRadius: "5px",
              marginTop: "5px",
            }}
          >
            <div
              style={{
                width: `${s.score}%`,
                height: "10px",
                background: "#4CAF50",
                borderRadius: "5px",
              }}
            ></div>
          </div>

          <span>{s.score}%</span>
        </div>
      ))}
    </div>
  );
}