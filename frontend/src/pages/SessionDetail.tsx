import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import { Session } from '../types';
import { useRequestState } from '../hooks/useRequestState';
import { useAuth } from '../hooks/useAuth';
import { authHeaders, getAxiosErrorMessage } from '../utils/http';
import { formatDate } from '../utils/date';
import FormError from '../components/FormError';

function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const { loading, setLoading, error, setError } = useRequestState(true);
  const { loading: participateLoading, setLoading: setParticipateLoading, error: participateError, setError: setParticipateError } = useRequestState();
  const { loading: deleteLoading, setLoading: setDeleteLoading, error: deleteError, setError: setDeleteError } = useRequestState();
  const { user, token } = useAuth();

  const fetchSession = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<Session>(`/session/${id}`, {
        ...authHeaders(token),
        signal,
      });
      setSession(response.data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(getAxiosErrorMessage(err, 'Failed to load session details'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, token, setLoading, setError]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSession(controller.signal);
    return () => controller.abort();
  }, [fetchSession]);

  const handleParticipate = async () => {
    try {
      setParticipateLoading(true);
      setParticipateError('');
      await api.post(`/session/${id}/participate/${user!.id}`, {}, authHeaders(token));
      fetchSession();
    } catch (err) {
      setParticipateError(getAxiosErrorMessage(err, 'Failed to join session'));
      console.error(err);
    } finally {
      setParticipateLoading(false);
    }
  };

  const handleUnparticipate = async () => {
    try {
      setParticipateLoading(true);
      setParticipateError('');
      await api.delete(`/session/${id}/participate/${user!.id}`, authHeaders(token));
      fetchSession();
    } catch (err) {
      setParticipateError(getAxiosErrorMessage(err, 'Failed to leave session'));
      console.error(err);
    } finally {
      setParticipateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      setDeleteLoading(true);
      setDeleteError('');
      await api.delete(`/session/${id}`, authHeaders(token));
      navigate('/sessions');
    } catch (err) {
      setDeleteError(getAxiosErrorMessage(err, 'Failed to delete session'));
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isCentered = loading || !!error || !session;

  return (
    <div className={`min-h-screen bg-gray-100 ${isCentered ? 'flex items-center justify-center' : 'py-8'}`}>
      {loading && <div className="text-xl text-gray-600">Loading session...</div>}
      {!loading && error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      )}
      {!loading && !error && session && (
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{session.name}</h1>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Details</h2>
              <div className="space-y-2 text-gray-600">
                <p>
                  <strong>Date:</strong>{' '}
                  {formatDate(session.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p><strong>Teacher:</strong> {session.teacher.firstName} {session.teacher.lastName}</p>
                <p><strong>Participants:</strong> {session.users.length}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{session.description}</p>
            </div>

            {participateError && <FormError message={participateError} />}
            {deleteError && <FormError message={deleteError} />}

            <div className="flex space-x-4">
              {user!.admin ? (
                <>
                  <button
                    onClick={() => navigate(`/sessions/edit/${id}`)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              ) : (
                session.users.includes(user!.id) ? (
                  <button
                    onClick={handleUnparticipate}
                    disabled={participateLoading}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-60"
                  >
                    {participateLoading ? 'Leaving...' : 'Leave Session'}
                  </button>
                ) : (
                  <button
                    onClick={handleParticipate}
                    disabled={participateLoading}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-60"
                  >
                    {participateLoading ? 'Joining...' : 'Join Session'}
                  </button>
                )
              )}

              <button
                onClick={() => navigate('/sessions')}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
              >
                Back to Sessions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionDetail;
