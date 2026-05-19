import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import { Teacher, Session, SessionFormData } from '../types';
import { useRequestState } from '../hooks/useRequestState';
import { useAuth } from '../hooks/useAuth';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import TextAreaField from '../components/TextAreaField';
import FormError from '../components/FormError';

function SessionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<SessionFormData>({
    name: '',
    date: '',
    description: '',
    teacherId: 0,
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const { loading, setLoading, error, setError } = useRequestState();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !user.admin) {
      navigate('/sessions');
    }
  }, [user, navigate]);

  const fetchTeachers = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await api.get<Teacher[]>('/teacher', {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      setTeachers(response.data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError('Failed to fetch teachers');
      console.error(err);
    }
  }, [token, setError]);

  const fetchSession = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await api.get<Session>(`/session/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const session = response.data;
      setFormData({
        name: session.name,
        date: new Date(session.date).toISOString().split('T')[0],
        description: session.description,
        teacherId: session.teacher.id,
      });
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError('Failed to load session');
      console.error(err);
    }
  }, [id, token, setError]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTeachers(controller.signal);
    if (isEditMode) fetchSession(controller.signal);
    return () => controller.abort();
  }, [fetchTeachers, fetchSession, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.name === 'teacherId' ? parseInt(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/session/${id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await api.post('/session', formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      navigate('/sessions');
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Failed to save session' : 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  const teacherOptions = teachers.map((t) => ({
    value: t.id,
    label: `${t.firstName} ${t.lastName}`,
  }));

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            {isEditMode ? 'Edit Session' : 'Create New Session'}
          </h1>

          <FormError message={error} />

          <form onSubmit={handleSubmit}>
            <FormField label="Session Name" type="text" name="name" value={formData.name} onChange={handleChange} required />
            <FormField label="Date" type="date" name="date" value={formData.date} onChange={handleChange} required />
            <SelectField
              label="Teacher"
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              options={teacherOptions}
              placeholder="Select a teacher"
              required
            />
            <TextAreaField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="mb-6"
              required
            />

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : isEditMode ? 'Update Session' : 'Create Session'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/sessions')}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SessionForm;
