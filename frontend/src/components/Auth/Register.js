import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
      alert('Račun uspešno ustvarjen! Zdaj se lahko prijavite.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registracija ni uspela.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card" style={{ maxWidth: '420px', margin: '80px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Registracija</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px' }}>
        Ustvarite učiteljski račun
      </p>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Ime in priimek</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ana Novak"
            required
          />
        </div>

        <div className="form-group">
          <label>Email naslov</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana.novak@skola.si"
            required
          />
        </div>

        <div className="form-group">
          <label>Geslo</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary btn-large" disabled={loading}>
          {loading ? 'Registracija poteka...' : 'Ustvari račun'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Že imate račun? <Link to="/login" style={{ color: '#fbbf24' }}>Prijavite se</Link>
      </p>
    </div>
  );
}