import "./CompensationFields.css";

function CompensationFields({ compensation = {}, onChange }) {
  const update = (event) => onChange({ ...compensation, [event.target.name]: event.target.value });
  return (
    <div className="profile-compensation">
      <div className="profile-compensation__heading">
        <strong>Salary information</strong>
        <small>Used privately by the retention models</small>
      </div>
      <div className="profile-compensation__fields">
        <label>Current salary <span>LKR per month</span><input name="current" type="number" min="0" step="1000" value={compensation.current ?? ""} onChange={update} placeholder="e.g. 180000" /></label>
        <label>Expected salary <span>LKR per month</span><input name="expected" type="number" min="0" step="1000" value={compensation.expected ?? ""} onChange={update} placeholder="e.g. 220000" /></label>
      </div>
    </div>
  );
}

export default CompensationFields;
