import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../src/services/api';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const email = location.state?.email || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            setMessage('Password must be at least 8 characters long and include an uppercase letter, lowercase letter, and a number.');
            return;
        }

        setLoading(true);

        try {
            const data = await api.postPublic('auth/resetPassword.php', { otp: otp.trim(), password });
            setSuccess(true);
            setMessage(data.message || 'Password updated successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setMessage(error.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Set New Password</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Enter the 6-digit OTP code sent to {email ? <strong className="text-gray-800">{email}</strong> : 'your email'} and your new password.
                    </p>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-md text-sm ${success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit Verification OTP</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            placeholder="e.g. 123456"
                            maxLength={10}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition tracking-widest text-center text-lg font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter new password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm new password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-medium transition disabled:opacity-50"
                    >
                        {loading ? 'Updating Password...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Did not receive OTP?{' '}
                    <Link to="/forgot-password" className="text-green-600 hover:underline font-medium">
                        Request again
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;