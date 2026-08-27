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

    return (
      <div className="card">
        <h2>
          Skill Proficiency
        </h2>

        <p>
          No skill proficiency data available.
        </p>
      </div>
    );

  }


  return (

    <div className="card">

      <h2>
        Skill Proficiency
      </h2>


      {skills.map((skill, index) => (

        <div
          key={index}
          className="skill-row"
        >

          <div className="skill-header">

            <strong>
              {skill.skill.toUpperCase()}
            </strong>

            <span>
              {skill.level} - {skill.score}%
            </span>

          </div>


          <div className="progress-bar">

            <div
              className="progress-fill"
              style={{
                width: `${Math.min(
                  Math.max(skill.score, 0),
                  100
                )}%`,
              }}
            />

          </div>

        </div>

      ))}

    </div>

  );
}