import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectdRoute";
import Dashboard from "./components/Dashboard/Dashboard";

function App() {
    return (
        <GoogleOAuthProvider clientId="650088888366-s5gprboirpp51ppbsltif0a535hgcgoo.apps.googleusercontent.com">
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}> <Dashboard /> </ProtectedRoute>}/>
                </Routes>
            </Router>
        </GoogleOAuthProvider>
    );
}

export default App;
