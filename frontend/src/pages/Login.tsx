import { SubmitEventHandler, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useRequestState } from '../hooks/useRequestState';
import { getAxiosErrorMessage } from '../utils/http';
import FormField from '../components/FormField';
import FormError from '../components/FormError';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { loading, setLoading, error, setError } = useRequestState();

  const handleSubmit: SubmitEventHandler = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login({ email, password });
      navigate('/sessions');
    } catch (err) {
      setError(getAxiosErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Login to Yoga Studio
        </h2>

        <FormError message={error} />

        <form onSubmit={handleSubmit}>
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-6"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-800">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
