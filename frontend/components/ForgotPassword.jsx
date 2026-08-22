import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../src/services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            const data = await api.postPublic('auth/forgotPassword.php', { email });
            setSuccess(true);
            setMessage(data.message || 'OTP sent successfully!');
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 1500);
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
                    <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
                    <p className="text-sm text-gray-600 mt-1">Enter your registered email to receive a password reset OTP code.</p>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-md text-sm ${success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-medium transition disabled:opacity-50"
                    >
                        {loading ? 'Sending OTP...' : 'Send Password Reset OTP'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link to="/login" className="text-green-600 hover:underline font-medium">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;