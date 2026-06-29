import React, { useState } from 'react';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Recuerda usar rutas relativas como acordamos para Nginx
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Usuario o contraseña incorrectos");
      }

      const data = await res.json();

      // Guardamos el token y los datos del usuario en el navegador
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Le avisamos a la App principal que el login fue exitoso
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Monitor Project</h2>
        <p style={styles.subtitle}>Inicia sesión para acceder al sistema de seguridad</p>
        
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Usuario</label>
          <input 
            type="text" 
            style={styles.input}
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            placeholder="Introduce tu usuario"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Contraseña</label>
          <input 
            type="password" 
            style={styles.input}
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="••••••••"
          />
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Verificando...' : 'Entrar al Sistema'}
        </button>
      </form>
    </div>
  );
}

// Estilos rápidos en línea (puedes cambiarlos por Tailwind o CSS normal)
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a' },
  form: { backgroundColor: '#1e293b', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)', width: '100%', maxWwidth: '400px', textAlign: 'center' },
  title: { color: '#f8fafc', marginBottom: '0.5rem', fontSize: '1.8rem' },
  subtitle: { color: '#94a3b8', marginBottom: '2rem', fontSize: '0.9rem' },
  inputGroup: { textAlign: 'left', marginBottom: '1.2rem' },
  label: { color: '#cbd5e1', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#334155', color: '#fff', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' },
  error: { backgroundColor: '#fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'left' }
};

export default Login;