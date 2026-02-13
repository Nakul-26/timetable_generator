import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await API.post('/login', { email, password });
            const user = response?.data?.user;
            if (response.data.success) {
                if (user?.role !== 'admin') {
                    await API.post('/logout');
                    setError('Only admins are allowed to log in.');
                    return;
                }
                login(user);
                navigate('/timetable');
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'An error occurred. Please try again later.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-form-container">
                <form className="login-form" onSubmit={handleSubmit}>
                    <h2>Login</h2>
                    {error && <p className="login-error-message">{error}</p>}
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="login-btn" type="submit">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
