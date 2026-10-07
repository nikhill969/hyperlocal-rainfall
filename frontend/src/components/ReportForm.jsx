import { useState } from 'react';
import { createReport } from '../services/api';
import { reverseGeocode } from '../services/weatherApi';
import AreaPicker from './AreaPicker';
import LocationPicker from './LocationPicker';

export default function ReportForm({ user, areaCenter, onReportSubmitted }) {
  const [formData, setFormData] = useState({
    name: user.name,
    location: '',
    latitude: '',
    longitude: '',
    problemType: 'Road Waterlogging',
    description: '',
    image: '',
    date: new Date().toISOString().slice(0, 16)
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError('');
  };

  const selectCoordinates = async ({ latitude, longitude }) => {
    setFormData((previous) => ({ ...previous, latitude, longitude }));
    const location = await reverseGeocode(latitude, longitude);
    setFormData((previous) => ({ ...previous, latitude, longitude, location }));
    setError('');
  };

  const handleLocationSelection = (location) => {
    setFormData((previous) => ({
      ...previous,
      location: location?.name || '',
      latitude: location?.latitude ?? '',
      longitude: location?.longitude ?? ''
    }));
    setError('');
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image is too large. Please choose a file under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((previous) => ({ ...previous, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.location || !formData.description) {
      setError('Please fill in the required fields before submitting.');
      return;
    }

    if (formData.latitude === '' || formData.longitude === '') {
      setError('Use Current GPS to add your location before submitting.');
      return;
    }

    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError('Latitude and longitude values are invalid.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReport({
        ...formData,
        latitude,
        longitude,
        area: user.area,
        date: formData.date || new Date().toISOString()
      });

      setSuccess('Report submitted successfully.');
      setFormData({
        name: user.name,
        location: '',
        latitude: '',
        longitude: '',
        problemType: 'Road Waterlogging',
        description: '',
        image: '',
        date: new Date().toISOString().slice(0, 16)
      });

      if (onReportSubmitted) {
        onReportSubmitted();
      }
    } catch (submissionError) {
      setError(submissionError.message || 'Unable to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-header">
        <div className="form-icon">!</div>
        <div>
          <h3>Report Waterlogging</h3>
          <p>Your report is shared with {user.area} residents and the administrator.</p>
        </div>
      </div>

      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      <div className="form-grid">
        <div className="field">
          <label>Reporting as</label>
          <input value={user.name} readOnly />
        </div>

        <div className="field">
          <label>Your area</label>
          <input value={user.area} readOnly />
        </div>

        <div className="field">
          <label>Problem type</label>
          <select name="problemType" value={formData.problemType} onChange={handleChange}>
            <option>Road Waterlogging</option>
            <option>Blocked Drain</option>
            <option>Drain Overflow</option>
            <option>Flooded Street</option>
            <option>Heavy Rainfall</option>
            <option>Other</option>
          </select>
        </div>

        <div className="field full-width">
          <label>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="5" placeholder="Describe the problem in brief" />
        </div>

        <div className="field">
          <label>Optional Photo</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>
      </div>

      <AreaPicker
        label="Search location"
        placeholder="Search the affected street or place..."
        value={formData.location ? { name: formData.location, latitude: formData.latitude, longitude: formData.longitude } : null}
        onSelect={handleLocationSelection}
      />

      <div className="location-picker-section">
        <div className="field-label-row">
          <label>Pin the exact location</label>
          <span>{formData.latitude !== '' ? 'Location selected' : 'Click the map or use GPS'}</span>
        </div>
        <LocationPicker
          center={areaCenter}
          selected={formData.latitude === '' ? null : { latitude: formData.latitude, longitude: formData.longitude }}
          onSelect={selectCoordinates}
        />
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </form>
  );
}
