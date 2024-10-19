import React, {useState, useEffect, cloneElement} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Spin } from 'antd';

const useAuth = (allowedRoles) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [token, setUserToken] = useState(null);

    useEffect(() => {
        const verifyToken = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setIsAuthorized(false);
                setIsLoading(false);
                return;
            }
            try {
                const response = await axios.get('http://localhost:3001/api/validateToken', {
                    headers: { authorization: `Bearer ${token}` }
                });
                const { id, role } = response.data; // Assuming the response contains id and role
                setIsAuthorized(allowedRoles.includes(role));
                setUserId(id);
                setUserRole(role);
                setUserToken(token);
            } catch (error) {
                console.error('Error verifying token:', error);
                setIsAuthorized(false);
            }
            setIsLoading(false);
        };

        verifyToken();
    }, [allowedRoles]);

    return { isAuthorized, isLoading, userId, userRole, token };
};


const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const { isAuthorized, isLoading, userId, userRole, token } = useAuth(allowedRoles);

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spin size="large" style={{top: '50%', left: '50%'}}/>
        </div>;
    }

    if (!isAuthorized) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { userid: userId, role: userRole, token: token });
        }
        return child;
    });
};

export default ProtectedRoute;
