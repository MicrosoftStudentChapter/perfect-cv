import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/images/logo.png';
// import background from '../../assets/images/background.jpg';
import './Login.css';

const URL = import.meta.env.VITE_URL || "https://backend.perfectcv.mlsctiet.com";

const Login = () => {
    const [step, setStep] = useState('email'); // 'email' or 'otp'
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        username: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        if (!formData.email) {
            setError('Please enter your email address');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${URL}/auth/send-otp`, {
                email: formData.email
            });
            
            setStep('otp');
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.msg || 'Email not authorized. Please contact the administrator.');
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        if (!formData.otp) {
            setError('Please enter the OTP sent to your email');
            setLoading(false);
            return;
        }

        if (!formData.username) {
            setError('Please enter your username');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${URL}/auth/verify-otp`, {
                email: formData.email,
                otp: formData.otp,
                username: formData.username
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                navigate('/home');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid OTP. Please try again.');
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setLoading(true);
        
        try {
            const response = await axios.post(`${URL}/auth/send-otp`, {
                email: formData.email
            });
            
            setLoading(false);
            alert('OTP has been resent to your email address');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to resend OTP. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="logo-section">
                <img src={logo} alt="Microsoft Learn Student Ambassador" className="logo" />
            </div>
            <div className="login-container">
                <div className="login-card">
                    <h1 className="title">Perfect CV</h1>
                    <h2 className="subtitle">
                        {step === 'email' ? 'Enter Your Email' : 'Verify OTP'}
                    </h2>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    {step === 'email' ? (
                        <form onSubmit={handleSendOtp} className="login-form">
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="your.email@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="login-button"
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="login-form">
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    placeholder="Your name"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="otp">OTP</label>
                                <input
                                    type="text"
                                    id="otp"
                                    name="otp"
                                    placeholder="Enter 6-digit OTP"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    required
                                    maxLength="6"
                                />
                            </div>

                            <div className="form-options">
                                <button 
                                    type="button" 
                                    onClick={handleResendOtp}
                                    className="resend-otp"
                                    disabled={loading}
                                >
                                    Resend OTP
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setStep('email')}
                                    className="change-email"
                                >
                                    Change Email
                                </button>
                            </div>

                            <button 
                                type="submit" 
                                className="login-button"
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login; 