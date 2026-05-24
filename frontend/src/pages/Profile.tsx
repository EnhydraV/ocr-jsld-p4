import React, {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from "axios";
import api from '../services/api';
import {useRequestState} from '../hooks/useRequestState';
import {useAuth} from '../hooks/useAuth';
import {authHeaders, getAxiosErrorMessage} from '../utils/http';
import {formatDate} from '../utils/date';
import FormError from '../components/FormError';
import {authService} from '../services/auth.service';
import {User} from "../types";

const ProfileField = ({label, children}: { label: string; children: React.ReactNode }) => (
    <div className="border-b pb-4">
        <label className="block text-gray-600 text-sm font-semibold mb-1">{label}</label>
        <div className="text-lg text-gray-800">{children}</div>
    </div>
);

function Profile() {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const {loading, setLoading, error, setError} = useRequestState(true);
    const {
        loading: promoteLoading,
        setLoading: setPromoteLoading,
        error: promoteError,
        setError: setPromoteError
    } = useRequestState(false);
    const {
        loading: deleteLoading,
        setLoading: setDeleteLoading,
        error: deleteError,
        setError: setDeleteError
    } = useRequestState(false);
    const {user, token} = useAuth();
    const isDev = (import.meta as any).env?.DEV === true;

    const fetchUserInfo = useCallback(async (signal?: AbortSignal) => {
        if (!user) return;
        try {
            setLoading(true);
            setError('');
            const response = await api.get(`/user/${user.id}`, {
                ...authHeaders(token),
                signal,
            });
            setUserInfo(response.data);
        } catch (err) {
            if (axios.isCancel(err)) return; // Abort silencieux, ce n'est pas une erreur.
            setError(getAxiosErrorMessage(err, 'Failed to load user information'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user, token, setLoading, setError]);

    useEffect(() => {
        const controller = new AbortController();
        fetchUserInfo(controller.signal);
        return () => controller.abort();
    }, [fetchUserInfo]);

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            setDeleteError('');
            setDeleteLoading(true);
            await api.delete(`/user/${user!.id}`, authHeaders(token));
            authService.logout();
            navigate('/login');
        } catch (err) {
            setDeleteError(getAxiosErrorMessage(err, 'Failed to delete account'));
            console.error(err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handlePromoteAdmin = async () => {
        try {
            setPromoteError('');
            setPromoteLoading(true);
            const response = await api.post('/user/promote-admin', {}, authHeaders(token));
            setUserInfo(response.data);
            authService.updateCurrentUser({admin: response.data.admin});
        } catch (err) {
            setPromoteError(getAxiosErrorMessage(err, 'Failed to promote to admin'));
            console.error(err);
        } finally {
            setPromoteLoading(false);
        }
    };

    const isCentered = loading || !!error || !userInfo;

    return (
        <div className={`min-h-screen bg-gray-100 ${isCentered ? 'flex items-center justify-center' : 'py-8'}`}>
            {loading && <div className="text-xl text-gray-600">Loading profile...</div>}
            {!loading && error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
            )}
            {!loading && !error && userInfo && (
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

                        <div className="space-y-4 mb-8">
                            <ProfileField label="First Name">{userInfo.firstName}</ProfileField>
                            <ProfileField label="Last Name">{userInfo.lastName}</ProfileField>
                            <ProfileField label="Email">{userInfo.email}</ProfileField>

                            <ProfileField label="Account Type">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  userInfo.admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {userInfo.admin ? 'Administrator' : 'User'}
              </span>
                                {isDev && !userInfo.admin && (
                                    <div className="mt-3">
                                        <button
                                            onClick={handlePromoteAdmin}
                                            disabled={promoteLoading}
                                            className="bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            {promoteLoading ? 'Promoting...' : 'Promote to Admin (Dev)'}
                                        </button>
                                        {promoteError && <FormError message={promoteError}/>}
                                    </div>
                                )}
                            </ProfileField>

                            <ProfileField label="Member Since">
                                {formatDate(userInfo.createdAt!, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </ProfileField>
                        </div>

                        {deleteError && <FormError message={deleteError}/>}
                        <div className="flex space-x-4">
                            <button
                                onClick={() => navigate('/sessions')}
                                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                            >
                                Back to Sessions
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleteLoading ? 'Deleting ...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;
