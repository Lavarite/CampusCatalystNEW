import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectdRoute";
import NotFound from "./components/NotFound/NotFound";
import Dashboard from "./components/Dashboard/Dashboard";
import Todo from "./components/Todo/Todo";
import Class from "./components/Class/Class";
import Classes from "./components/Class/Classes";

function App() {
    return (
        <GoogleOAuthProvider clientId="650088888366-s5gprboirpp51ppbsltif0a535hgcgoo.apps.googleusercontent.com">
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="u/dashboard" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}> <Dashboard /> </ProtectedRoute>}/>
                    <Route path="u/todo/:class?" element={<ProtectedRoute allowedRoles={['student']}> <Todo /> </ProtectedRoute> }/>
                    <Route path="u/classes/:classid" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}> <Class /> </ProtectedRoute>} />
                    <Route path="u/classes" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}> <Classes /> </ProtectedRoute>}/>

                    <Route path="*" element={<NotFound/>} />
                </Routes>
            </Router>
        </GoogleOAuthProvider>
    );
}

export default App;
