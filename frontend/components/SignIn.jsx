import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../src/services/api";


function Sign({ setShowSignIn }) {

    const navigate = useNavigate();

    const handleClose = () => {
        if (typeof setShowSignIn === 'function') {
            setShowSignIn(false); // Used when it's a popup
        } else {
            navigate('/');        // Used when it's a standalone page
        }
    };

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleUserLogin = async (event) => {
        event.preventDefault();
        setError("");

        try {
            const data = await api.postPublic('auth/login.php', { email, password });

            if (typeof setShowSignIn === 'function') {
                setShowSignIn(false);
            }
            localStorage.setItem("jwt_token", data.token);
            localStorage.setItem("email", email);
            localStorage.setItem("role", data.role);
            localStorage.setItem("shopId", data.id);

            if (data.profileImage) {
                localStorage.setItem("profileImage", data.profileImage);
            }
            navigate("/services");

        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || "Login failed. Please try again.");
        }

    }

    const handleRegister = () => {
        if (typeof setShowSignIn === 'function') {
            setShowSignIn(false);
        }

        const registerSection = document.getElementById("register");
        if (registerSection) {
            registerSection.scrollIntoView({ behavior: "smooth" });
        } else {
            navigate('/', { state: { scrollToRegister: true } });
        }
    }

    const handleForgotPassword = () => {
        handleClose();
        navigate('/forgot-password');
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 1st Update: The Background Overlay */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={handleClose} 
                aria-hidden="true"
            />

            <div
                role="dialog"
                aria-modal="true"
                className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-xl p-6 z-10"
            >
                {/* 2nd Update: The X Icon */}
                <FontAwesomeIcon
                    icon={faXmark}
                    className="absolute top-4 right-4 cursor-pointer text-xl text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={handleClose} 
                />

                <h2 className="text-2xl font-semibold mb-2">Sign in to FixGo</h2>
                <p className="text-sm text-gray-500 mb-6">Welcome back — please sign in to continue.</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md flex items-center justify-between">
                        <span>{error}</span>
                        <button 
                            type="button" 
                            className="text-red-400 hover:text-red-600 transition-colors ml-2 font-bold text-lg leading-none"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            &times;
                        </button>
                    </div>
                )}

                <form
                    className="space-y-4"
                    onSubmit={handleUserLogin}
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            placeholder="you@example.com"
                            name="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError("");
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            placeholder="Enter your password"
                            name="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError("");
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
                        name="signin"
                    >
                        Sign in
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-600">
                    <button type="button" className="text-green-600 hover:underline" onClick={handleRegister}>Create an account</button>
                    <span className="mx-2">·</span>
                    <button type="button" className="text-green-600 hover:underline" onClick={handleForgotPassword}>Forgot password?</button>
                </div>
            </div>
        </div>
    )
}

export default Sign