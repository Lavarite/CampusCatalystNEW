import React, {useEffect, useState} from 'react';
import ContentWrapper from "../ContentWrapper/ContentWrapper";
import isEqual from "fast-deep-equal";
import {Avatar, Button, List, Result, Spin} from "antd";
import {useNavigate, useParams} from "react-router-dom";
import {BookOutlined, CompassOutlined, EyeInvisibleOutlined} from "@ant-design/icons";

const StreamContent = ({ classData }) => {
    // Assuming `classData` has all the necessary information to render the stream
    return (
        <List
            itemLayout="horizontal"
            dataSource={classData.announcements} // Replace with your actual data structure
            renderItem={item => (
                <List.Item>
                    <List.Item.Meta
                        avatar={<Avatar icon={<Avatar style={{ backgroundColor: '#f56a00' }}><BookOutlined /></Avatar>} />} // Placeholder for author's initial
                        title={item.title}
                        description={item.deadline_date}
                    />
                </List.Item>
            )}
        />
    );
};

const Class = React.memo(({userid, role, token}) => {
    const navigate = useNavigate();
    const [classData, setClassData] = useState({});
    const [loading, setLoading] = useState(true);
    const {classid: classId} = useParams();
    const [errorMsg, setErrorMsg] = useState(null);
    useEffect(() => {
        async function getClasses(userid, role, classId) {
            const response = await fetch(`http://localhost:3001/api/class?id=${classId}&token=${token}`);
            if (response.ok) {
                const data = await response.json();
                console.log(data)
                setClassData(data);
            } else {
                if (response.status === 404) setErrorMsg(<Result
                    icon={<CompassOutlined />}
                    title="Oops! Off the Map!"
                    subTitle="Looks like you've tried to enter an uncharted classroom. Maybe stick to the known syllabus?"
                    extra={
                        <Button type="primary" onClick={() => navigate('/u/classes')}>
                            Back to Classes
                        </Button>
                    }
                />)
                else if (response.status === 401) setErrorMsg(<Result
                    icon={<EyeInvisibleOutlined />}
                    title="Restricted Section Alert!"
                    subTitle="You've stumbled upon a restricted section. This area is off-limits, or maybe you need special clearance?"
                    extra={
                        <Button type="primary" onClick={() => navigate('/u/classes')}>
                            Back to Classes
                        </Button>
                    }
                />)
                else setErrorMsg(null);
            }
            setLoading(false);
        }
        getClasses(userid, role, classId);
    }, [userid, role, classId]);

    const streamContent = errorMsg ? errorMsg: (
        <StreamContent classData={classData} />
    );

    return (
        <ContentWrapper header={classData?.classData?.[0]?.name || ''}  accountDetails={{userid, role}} parentLoading={loading} token={token}>
            <div className="site-layout-background content-area" style={{background: '#fff'}}>
                <React.Suspense fallback={<Spin style={{display: 'block', textAlign: 'center'}}/>}>
                    {streamContent}
                </React.Suspense>
            </div>
        </ContentWrapper>
    )
}, (prevProps, nextProps) => {
    return isEqual(prevProps, nextProps);
});

export default Class;