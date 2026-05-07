import React from "react";

type Skill = {
  skill: string;
  level: string;
  score: number;
};

export default function SkillProficiencyDashboard({
  skills = [],
}: {
  skills?: Skill[];
}) {
  if (!skills.length) {
    return <p>No skill proficiency data available.</p>;
  }

  return (
    <div className="card">
      <h2>Skill Proficiency</h2>

      {skills.map((s, index) => (
        <div key={index} className="skill-row">
          <div className="skill-header">
            <strong>{s.skill.toUpperCase()}</strong>
            <span>
              {s.level} - {s.score}%
            </span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${s.score}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}