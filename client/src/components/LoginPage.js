import React, { useState } from 'react';
import {Form, Input, Button, Checkbox, message} from 'antd';
import { GoogleLogin } from '@react-oauth/google';
import {useNavigate} from "react-router-dom";

function LoginPage() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // Instantiating the navigate function

    const onFinish = async (values) => {
        console.log('Success:', values);
        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: values.email,
                    password: values.password,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Login successful:', data);
                localStorage.setItem('token', data.token);
                navigate('/u/dashboard');
            } else {
                console.error('Login failed:', data.message);
                message.error(data.message || 'Login failed, please try again.');
            }
        } catch (error) {
            console.error('Network error:', error);
            // Display error toast for network errors
            message.error('Network error, please try again later.');
        }
    };


    const onFinishFailed = (errorInfo) => {
        message.error(errorInfo).then( () => {console.log('Failed:', errorInfo);});
    };

    const handleGoogleSuccess = async (googleData) => {
        setLoading(true);
        try {
            localStorage.removeItem('token');
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: googleData.credential,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Google login successful:', data);
                localStorage.setItem('token', data.token);
                setLoading(false);
                if (localStorage.getItem('token') === data.token) {
                    navigate('/u/dashboard');
                } else {
                    console.error('Token verification failed.');
                    message.error('An error occurred. Please try again.');
                }
            } else {
                setLoading(false);
                console.error('Google login failed:', data.message);
                message.error(data.message || 'Google login failed, please try again.');
            }
        } catch (error) {
            setLoading(false);
            console.error('Network error:', error);
            message.error('Network error, please try again later.');
        }
    };


    return (
        <div style={{ maxWidth: '300px', margin: '0 auto' }}>
            <h1>Login</h1>
            <Form
                name="basic"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item
                    name="email"
                    rules={[
                        {
                            type: 'email',
                            message: 'The input is not a valid E-mail',
                        },
                        {
                            required: true,
                            message: 'Please input your E-mail',
                        },
                    ]}
                >
                    <Input type="email" placeholder="Email" />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Please input your password' }]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
                    <Checkbox>Remember me</Checkbox>
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Log in
                    </Button>
                </Form.Item>

                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.log('Login Failed')}
                />
            </Form>
        </div>
    );
}

export default LoginPage;
