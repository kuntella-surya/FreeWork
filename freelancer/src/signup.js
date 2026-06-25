import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    uname: '',
    email: '',
    phno: '',
    password: '',
    role: '',
    country: '',
    city: '',
    address: '',
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/dashboard');
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert('Please accept the Terms and Conditions.');
      return;
    }

    try {
      const res = await fetch('${process.env.REACT_APP_API_URL}/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else alert(data.message || 'Signup failed');
    } catch (err) {
      console.error(err);
      alert('Signup failed due to network error');
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const res = await fetch('${process.env.REACT_APP_API_URL}/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else alert(data.message || 'Google login failed');
    } catch (err) {
      console.error(err);
      alert('Server error during Google login');
    }
  };

  const handleGoogleLoginError = () => {
    alert('Google login failed');
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Sign Up</h2>

        {/** Input fields */}
        {Object.entries(formData).map(([key, value]) => {
          if (key === 'role') return null; // skip role here
          const placeholder = key.charAt(0).toUpperCase() + key.slice(1);
          if (key === 'address')
            return (
              <textarea
                key={key}
                name={key}
                value={value}
                onChange={handleChange}
                placeholder="Full Address"
                rows={2}
                required
                style={styles.input}
              />
            );
          return (
            <input
              key={key}
              type={key === 'password' ? 'password' : 'text'}
              name={key}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              required
              style={styles.input}
            />
          );
        })}

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          style={{ ...styles.input, cursor: 'pointer' }}
        >
          <option value="">Select Role</option>
          <option value="freelancer">Freelancer</option>
          <option value="hire">Hire Freelancer</option>
        </select>

        <div style={styles.checkboxContainer}>
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={e => setAcceptedTerms(e.target.checked)}
          />
          <label htmlFor="terms">
            I accept the{' '}
            <a href="/terms" target="_blank" rel="noreferrer" style={{ color: '#28a745' }}>
              Terms & Conditions
            </a>
          </label>
        </div>

        <button type="submit" style={styles.button}>
          Sign Up
        </button>

        <div style={{ textAlign: 'center', margin: '20px 0', color: '#888' }}>or</div>

        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={handleGoogleLoginError}
        />
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #71b7e6, #9b59b6)',
    padding: '20px',
  },
  form: {
    background: '#fff',
    padding: '40px',
    borderRadius: '15px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0px 15px 40px rgba(0,0,0,0.2)',
  },
  title: {
    textAlign: 'center',
    color: '#28a745',
    marginBottom: '30px',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    margin: '8px 0',
    borderRadius: '8px',
    border: '1px solid #ddd',
    outline: 'none',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    margin: '15px 0',
    fontSize: '14px',
    color: '#555',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: '#fff',
    fontSize: '16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: '0.3s',
  },
};

export default Signup;
