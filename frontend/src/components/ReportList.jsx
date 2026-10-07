export default function ReportList({ reports = [], onVerify, onDelete }) {
  return (
    <div className="report-list">
      {reports.length === 0 ? (
        <div className="empty-state">No citizen reports found.</div>
      ) : (
        reports.map((report) => (
          <article key={report.id || report._id || `${report.location}-${report.date}`} className="report-card">
            <div className="report-card-header">
              <div>
                <strong>{report.location}</strong>
                <p>{report.problemType}</p>
              </div>
              <span className={`status-pill ${report.status}`}>{report.status}</span>
            </div>

            <div className="report-card-body">
              <p><strong>Area:</strong> {report.area}</p>
              <p><strong>Risk:</strong> {report.riskLevel || report.severity} · {report.rainfall ?? 0} mm rainfall</p>
              <p><strong>Date:</strong> {new Date(report.date || report.createdAt).toLocaleString()}</p>
              <p><strong>Reporter:</strong> {report.userName || report.name}</p>
              <p><strong>Description:</strong> {report.description}</p>
              {report.image && <img className="report-photo" src={report.image} alt={`Submitted evidence for ${report.location}`} />}
            </div>

            {onDelete && report.status === 'Pending' && <div className="action-row"><button className="mini-button danger" onClick={() => onDelete(report.id || report._id)}>Delete pending report</button></div>}
          </article>
        ))
      )}
    </div>
  );
}
