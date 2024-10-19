import React from 'react';
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const NotFound = React.memo(() => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '50px', backgroundColor: '#f7f7f7', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Result
                icon={<QuestionCircleOutlined style={{ fontSize: '64px' }} />}
                title={<span style={{ fontSize: '24px', fontWeight: 'bold' }}>Page Not Found!</span>}
                subTitle={<span style={{ fontSize: '16px' }}>You’ve just tried to enter a classroom that’s not on our timetable. Maybe it’s a secret club, or perhaps it’s just not here.</span>}
                extra={
                    <Button type="primary" size="large" onClick={() => navigate('/u/dashboard')}>
                        Back to Safety
                    </Button>
                }
                style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            />
        </div>
    );
});

export default NotFound;
