import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/images/logo.png';
// import background from '../../assets/images/background.jpg';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await axios.post('http://localhost:5000/auth/login', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                if (formData.rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('userEmail', formData.email);
                }
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!formData.email) {
            setError('Please enter your email address to reset password');
            return;
        }
        try {
            const response = await axios.post('http://localhost:5000/auth/forgot-password', {
                email: formData.email
            });
            alert('If an account exists with this email, you will receive password reset instructions.');
        } catch (err) {
            // Don't show error to prevent email enumeration
            alert('If an account exists with this email, you will receive password reset instructions.');
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
                    <h2 className="subtitle">Login</h2>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Username</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="mail@abc.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="••••••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-options">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />
                                <span>Remember Me</span>
                            </label>
                            <button 
                                type="button" 
                                onClick={handleForgotPassword}
                                className="forgot-password"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button type="submit" className="login-button">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login; 