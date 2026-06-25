import { useEffect, useState } from 'react';
import { FiEdit3, FiSave } from 'react-icons/fi';
import './App.css';

function Settings() {
  const [user, setUser] = useState(null);
  const [editField, setEditField] = useState(null);
  const [formData, setFormData] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('${process.env.REACT_APP_API_URL}/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setFormData(data);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFieldSave = async (field) => {
    try {
      const res = await fetch('${process.env.REACT_APP_API_URL}/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(prev => ({ ...prev, [field]: formData[field] }));
        setEditField(null);
        alert(`${field} updated`);
      } else {
        alert(data.message || 'Update failed');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (!user) return <div className="text-center mt-5">Loading...</div>;

  const renderField = (label, name, isEditable = true) => (
    <div className="mb-3 row align-items-center" key={name}>
      <label className="col-sm-2 col-form-label fw-bold text-capitalize">{label}</label>
      <div className="col-sm-8">
        <input
          type="text"
          className="form-control"
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          readOnly={editField !== name}
        />
      </div>
      <div className="col-sm-2 text-end">
        {editField === name ? (
          <FiSave
            className="text-success fs-5 cursor-pointer"
            onClick={() => handleFieldSave(name)}
          />
        ) : (
          isEditable && (
            <FiEdit3
              className="text-primary fs-5 cursor-pointer"
              onClick={() => setEditField(name)}
            />
          )
        )}
      </div>
    </div>
  );

  return (
    <div className="container mt-5">
      <div className="card p-4 shadow">
        <h3 className="mb-4 text-success">Profile Settings</h3>
        {renderField('Name', 'name')}
        {renderField('Email', 'email')}
        {renderField('Phone', 'phno')}
        {renderField('Address', 'address')}
        {renderField('City', 'city')}
        {renderField('Country', 'country')}
        {renderField('Role', 'role', false)}
      </div>
    </div>
  );
}

export default Settings;
