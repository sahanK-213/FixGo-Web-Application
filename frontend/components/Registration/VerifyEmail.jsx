import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../src/services/api";

const OTP_DURATION = 300; // 5 minutes in seconds

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();

    // Email passed via navigation state from registration forms
    const registeredEmail = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [message, setMessage] = useState("");
    const [redirectCountdown, setRedirectCountdown] = useState(5);

    // OTP expiry countdown (ticks from 300 → 0)
    const [otpTimer, setOtpTimer] = useState(OTP_DURATION);
    const otpTimerRef = useRef(null);

    // Resend button cooldown (same 5-minute window, ticks from 300 → 0)
    const [resendTimer, setResendTimer] = useState(OTP_DURATION);
    const resendTimerRef = useRef(null);

    const [resendStatus, setResendStatus] = useState("idle"); // idle, loading, sent, error
    const [resendMessage, setResendMessage] = useState("");

    // ── Start OTP expiry countdown on mount ──────────────────────────────────
    useEffect(() => {
        otpTimerRef.current = setInterval(() => {
            setOtpTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(otpTimerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(otpTimerRef.current);
    }, []);

    // ── Start Resend cooldown on mount (same 5-min window) ───────────────────
    useEffect(() => {
        resendTimerRef.current = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(resendTimerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(resendTimerRef.current);
    }, []);

    // ── Auto-redirect after successful shop-owner verification ───────────────
    useEffect(() => {
        if (status === "success" && message.includes("pending admin approval")) {
            setRedirectCountdown(5);
            const interval = setInterval(() => {
                setRedirectCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        navigate("/");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [status, message, navigate]);

    // ── Derived states ────────────────────────────────────────────────────────
    const isOtpExpired = otpTimer === 0;
    const canResend = resendTimer === 0;
    const isTimerCritical = otpTimer <= 60 && otpTimer > 0;

    // ── Verify OTP ────────────────────────────────────────────────────────────
    const verifyToken = async (e) => {
        if (e) e.preventDefault();

        if (!otp || otp.length !== 6) {
            setStatus("error");
            setMessage("Please enter a valid 6-digit OTP.");
            return;
        }

        if (isOtpExpired) {
            setStatus("error");
            setMessage("Your OTP has expired. Please request a new one using the Resend button.");
            return;
        }

        setStatus("loading");
        try {
            const data = await api.postPublic("auth/verifyEmail.php", { token: otp });
            setStatus("success");
            setMessage(data.message || "Your email has been verified successfully!");
            clearInterval(otpTimerRef.current);
            clearInterval(resendTimerRef.current);
        } catch (err) {
            setStatus("error");
            setMessage(err.message || "Failed to verify email. The OTP may be invalid or expired.");
        }
    };

    // ── Resend OTP ────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (!canResend || !registeredEmail) return;

        setResendStatus("loading");
        setResendMessage("");

        try {
            await api.postPublic("auth/resendOtp.php", { email: registeredEmail });
            setResendStatus("sent");
            setResendMessage("A new OTP has been sent to your email!");

            // Reset both timers
            setOtpTimer(OTP_DURATION);
            setResendTimer(OTP_DURATION);

            // Restart OTP expiry countdown
            clearInterval(otpTimerRef.current);
            otpTimerRef.current = setInterval(() => {
                setOtpTimer((prev) => {
                    if (prev <= 1) { clearInterval(otpTimerRef.current); return 0; }
                    return prev - 1;
                });
            }, 1000);

            // Restart Resend cooldown
            clearInterval(resendTimerRef.current);
            resendTimerRef.current = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) { clearInterval(resendTimerRef.current); return 0; }
                    return prev - 1;
                });
            }, 1000);

            setOtp("");
            setStatus("idle");
            setMessage("");
        } catch (err) {
            setResendStatus("error");
            setResendMessage(err.message || "Failed to resend OTP. Please try again.");
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-green-500 to-teal-600" />

                {status !== "success" && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner transform scale-100 transition-transform duration-500 hover:scale-110">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Verify Your Email</h2>
                        {registeredEmail ? (
                            <p className="mt-3 text-sm text-gray-500 px-2 leading-relaxed">
                                We've sent a 6-digit OTP to{" "}
                                <span className="font-semibold text-gray-700">{registeredEmail}</span>.
                                Enter it below to activate your account.
                            </p>
                        ) : (
                            <p className="mt-3 text-sm text-gray-500 px-2 leading-relaxed">
                                We've sent a 6-digit One-Time Password (OTP) to your email.
                                Please enter it below to activate your account.
                            </p>
                        )}
                    </div>
                )}

                {status === "success" ? (
                    <div className="text-center py-6 animate-fade-in">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner transform scale-100 transition-transform duration-500 hover:scale-110">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {message.includes("pending admin approval") ? "Email Verified!" : "Account Activated!"}
                        </h2>
                        <p className="mt-3 text-sm text-gray-500 px-2 leading-relaxed">{message}</p>

                        {message.includes("pending admin approval") ? (
                            <div className="mt-8 space-y-4">
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="h-1.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-1000 ease-linear"
                                        style={{ width: `${(redirectCountdown / 5) * 100}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-400 text-center">
                                    Redirecting to homepage in{" "}
                                    <span className="font-semibold text-green-600">{redirectCountdown}</span>{" "}
                                    second{redirectCountdown !== 1 ? "s" : ""}…
                                </p>
                                <button
                                    id="go-home-btn"
                                    onClick={() => navigate("/")}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer"
                                >
                                    Go to Homepage Now
                                </button>
                            </div>
                        ) : (
                            <div className="mt-8">
                                <button
                                    id="sign-in-btn"
                                    onClick={() => navigate("/login")}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer"
                                >
                                    Sign In Now
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={verifyToken} className="mt-8 space-y-5">
                        {/* OTP input */}
                        <div>
                            <label htmlFor="otp" className="sr-only">One-Time Password</label>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                required
                                maxLength="6"
                                value={otp}
                                disabled={isOtpExpired || status === "loading"}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                className={`appearance-none relative block w-full px-3 py-4 border placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:z-10 text-center text-2xl tracking-widest font-semibold transition-all duration-200 shadow-sm
                                    ${isOtpExpired
                                        ? "border-red-300 bg-red-50 focus:ring-red-400 focus:border-red-400 cursor-not-allowed opacity-60"
                                        : "border-gray-300 bg-white focus:ring-green-500 focus:border-green-500"}`}
                                placeholder="------"
                            />
                        </div>

                        {/* OTP expiry countdown */}
                        {!isOtpExpired ? (
                            <div className="flex items-center justify-center gap-2">
                                <svg
                                    className={`w-4 h-4 flex-shrink-0 ${isTimerCritical ? "text-red-500" : "text-gray-400"}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
                                </svg>
                                <span className={`text-sm font-medium ${isTimerCritical ? "text-red-500 animate-pulse" : "text-gray-500"}`}>
                                    OTP expires in{" "}
                                    <span className="font-bold tabular-nums">{formatTime(otpTimer)}</span>
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-red-600">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-semibold">OTP has expired — request a new one below</span>
                            </div>
                        )}

                        {/* Verify progress bar */}
                        {!isOtpExpired && (
                            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                                <div
                                    className={`h-1 rounded-full transition-all duration-1000 ease-linear ${isTimerCritical ? "bg-red-500" : "bg-gradient-to-r from-green-500 to-teal-500"}`}
                                    style={{ width: `${(otpTimer / OTP_DURATION) * 100}%` }}
                                />
                            </div>
                        )}

                        {/* Error / info message */}
                        {status === "error" && (
                            <div className="text-red-600 text-sm text-center font-medium bg-red-50 py-2 px-3 rounded-lg border border-red-100">
                                {message}
                            </div>
                        )}

                        {/* Resend success/error */}
                        {resendMessage && (
                            <div className={`text-sm text-center font-medium py-2 px-3 rounded-lg border ${
                                resendStatus === "sent"
                                    ? "text-green-700 bg-green-50 border-green-100"
                                    : "text-red-600 bg-red-50 border-red-100"
                            }`}>
                                {resendMessage}
                            </div>
                        )}

                        {/* Verify button */}
                        <button
                            id="verify-email-btn"
                            type="submit"
                            disabled={status === "loading" || isOtpExpired}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === "loading" ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Verifying...
                                </span>
                            ) : "Verify Email"}
                        </button>

                        {/* Resend OTP button */}
                        <div className="text-center">
                            {canResend ? (
                                <button
                                    id="resend-otp-btn"
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendStatus === "loading" || !registeredEmail}
                                    className="text-sm font-semibold text-green-600 hover:text-green-700 underline underline-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {resendStatus === "loading" ? "Sending…" : "Resend OTP"}
                                </button>
                            ) : (
                                <span className="text-sm text-gray-400">
                                    Resend available in{" "}
                                    <span className="font-semibold tabular-nums text-gray-500">
                                        {formatTime(resendTimer)}
                                    </span>
                                </span>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
