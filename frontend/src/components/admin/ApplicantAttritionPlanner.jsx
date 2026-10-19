import WhatIfSimulation from "../attrition/WhatIfSimulation";
import "../../pages/admin/AdminApplicationAnalysisView.css";
import "../../pages/admin/ApplicationRetentionLayout.css";
import "../../pages/admin/ApplicationReviewSections.css";
import "../../pages/admin/ApplicationReviewArtwork.css";
import "./ApplicantAttritionPlanner.css";

function ApplicantAttritionPlanner({ planner, retry, baselineLoading, baselineError }) {
  return <div className="admin-analysis-page applicant-attrition-planner">
    <div className="analysis-reference-layout">
      <header className="application-review-section-heading"><span>Retention outlook</span><h2>Explore the next steps</h2><p>Review current risk and compare salary, role, manager and flexible-work scenarios.</p></header>
      <section className="analysis-reference-planner" aria-label="Applicant attrition scenario planner">
        <WhatIfSimulation {...planner} />
      </section>
      {!baselineLoading && baselineError && <button className="applicant-attrition-planner__retry" type="button" onClick={retry}>Retry analysis</button>}
    </div>
  </div>;
}

export default ApplicantAttritionPlanner;
