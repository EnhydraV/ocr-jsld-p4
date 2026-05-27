import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Session } from '../types';
import { useRequestState } from '../hooks/useRequestState';
import { useAuth } from '../hooks/useAuth';
import { getAxiosErrorMessage } from '../utils/http';
import { formatDate } from '../utils/date';
import FormError from '../components/FormError';
import { sessionService } from '../services/session.service';

function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const { loading, setLoading, error, setError } = useRequestState(true);
  const { loading: deleteLoading, setLoading: setDeleteLoading, error: deleteError, setError: setDeleteError } = useRequestState();
  const { user, token } = useAuth();

  const fetchSessions = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError('');
      const sessions = await sessionService.getSessions(token, signal);
      setSessions(sessions);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(getAxiosErrorMessage(err, 'Failed to load sessions'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, setLoading, setError]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSessions(controller.signal);
    return () => controller.abort();
  }, [fetchSessions]);

  const handleDelete = async (sessionId: number) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      setDeleteLoading(true);
      setDeleteError('');
      await sessionService.deleteSession(token, sessionId);
      fetchSessions();
    } catch (err) {
      setDeleteError(getAxiosErrorMessage(err, 'Failed to delete session'));
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isCentered = loading || !!error;

  return (
    <div className={`min-h-screen bg-gray-100 ${isCentered ? 'flex items-center justify-center' : 'py-8'}`}>
      {loading && <div className="text-xl text-gray-600">Loading sessions...</div>}
      {!loading && error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      )}
      {!loading && !error && (
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Yoga Sessions</h1>
            {user?.admin && (
              <Link
                to="/sessions/create"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
              >
                Create Session
              </Link>
            )}
          </div>

          {deleteError && <FormError message={deleteError} />}

          {sessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">No sessions available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <div key={session.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{session.name}</h3>
                  <p className="text-gray-600 mb-2">Date: {formatDate(session.date)}</p>
                  <p className="text-gray-600 mb-2">Teacher: {session.teacher.firstName} {session.teacher.lastName}</p>
                  <p className="text-gray-600 mb-4">Participants: {session.users.length}</p>
                  <p className="text-gray-700 mb-4 line-clamp-3">{session.description}</p>

                  <div className="flex space-x-2">
                    <Link
                      to={`/sessions/${session.id}`}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded text-center hover:bg-indigo-700"
                    >
                      View Details
                    </Link>
                    {user?.admin && (
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={deleteLoading}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Sessions;
