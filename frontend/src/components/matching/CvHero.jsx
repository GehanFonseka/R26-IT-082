import "./CvHero.css";

function CvHero() {
  return (
    <header className="cv-hero">
      <div className="cv-hero__eyebrow"><span className="cv-hero__pulse" />Server-side local CV matcher</div>
      <h1>Find the right match<br /><em>with confidence.</em></h1>
      <p className="cv-hero__copy">Upload a CV, review the extracted details, and compare it with a job description using your trained model.</p>
      <div className="cv-hero__privacy"><span aria-hidden="true">🔒</span>Model inference runs locally behind the API Gateway.</div>
    </header>
  );
}

export default CvHero;
