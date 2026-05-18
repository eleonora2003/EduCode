import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');         
    } catch (err) {
      setError(err.response?.data?.detail || 'Prijava ni uspela. Preveri podatke.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card" style={{ maxWidth: '420px', margin: '100px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Prijava</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px' }}>
        Dobrodošli nazaj
      </p>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email naslov</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ime@primer.si"
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
          {loading ? 'Prijava poteka...' : 'Prijavi se'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Še nimate računa? <Link to="/register" style={{ color: '#fbbf24' }}>Registrirajte se</Link>
      </p>
    </div>
  );
}