import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useRequestState } from '../hooks/useRequestState';
import { getAxiosErrorMessage } from '../utils/http';
import FormField from '../components/FormField';
import FormError from '../components/FormError';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<{ email: string; password: string; firstName: string; lastName: string }>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const { loading, setLoading, error, setError } = useRequestState();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register(formData);
      navigate('/sessions');
    } catch (err) {
      setError(getAxiosErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Register for Yoga Studio
        </h2>

        <FormError message={error} />

        <form onSubmit={handleSubmit}>
          <FormField label="First Name" type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
          <FormField label="Last Name" type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
          <FormField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
          <FormField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mb-6"
            required
            minLength={8}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
