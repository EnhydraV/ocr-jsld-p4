import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Session } from '../types';
import { useRequestState } from '../hooks/useRequestState';
import { useAuth } from '../hooks/useAuth';
import { getAxiosErrorMessage } from '../utils/http';
import { formatDate } from '../utils/date';
import FormError from '../components/FormError';
import { sessionService } from '../services/session.service';
import { useFetch } from '../hooks/useFetch';

function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const { loading: participateLoading, setLoading: setParticipateLoading, error: participateError, setError: setParticipateError } = useRequestState();
  const { loading: deleteLoading, setLoading: setDeleteLoading, error: deleteError, setError: setDeleteError } = useRequestState();
  const { user, token } = useAuth();

  const { loading, error, refetch: fetchSession } = useFetch(
    useCallback((signal) => sessionService.getSession(token, id!, signal), [token, id]),
    setSession,
    'Failed to load session details',
  );

  const handleParticipate = async () => {
    try {
      setParticipateLoading(true);
      setParticipateError('');
      await sessionService.participate(token, id!, user!.id);
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
      await sessionService.unparticipate(token, id!, user!.id);
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
      await sessionService.deleteSession(token, id!);
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
