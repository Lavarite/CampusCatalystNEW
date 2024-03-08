import React, {useEffect, useState} from 'react';
import axios from "axios";

const useAuth = (allowedRoles) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
                setIsAuthorized(allowedRoles.includes(response.data.role));
            } catch (error) {
                console.error('Error verifying token:', error);
                setIsAuthorized(false);
            }
            setIsLoading(false);
        };

        verifyToken();
    }, [allowedRoles]);

    return { isAuthorized, isLoading };
};

const ProtectedComponent = ({ allowedRoles, children, fallback = null }) => {
    const { isAuthorized } = useAuth(allowedRoles);

    return isAuthorized ? children : fallback;
};

export default ProtectedComponent;