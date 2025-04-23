import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Home from './components/Home/Home';
import './App.css';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Home />} />
                <Route path="/" element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                } />
                <Route path="/login" element={
                    <ProtectedRoute>
                        <Login />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    );
};

export default App;
