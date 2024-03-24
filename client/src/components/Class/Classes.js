import React, {useEffect, useState} from 'react';
import ContentWrapper from "../ContentWrapper/ContentWrapper";
import isEqual from "fast-deep-equal";
import {Card, List, Spin, Typography} from "antd";
import moment from "moment";
import {useNavigate} from "react-router-dom";

const { Title, Text } = Typography;

const Classes = React.memo(({userid, role, token}) => {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        async function getClasses(userid, role) {
            if (['student', 'teacher'].includes(role)) {
                const response = await fetch(`http://localhost:3001/api/classes?token=${token}&sneak=1`);
                const data = await response.json();
                if (response.ok) {
                    setClasses(data);
                } else {
                    console.error("Error: " + response.statusText);
                }
                setLoading(false);
            } else {
                setLoading(false);
            }
        }
        getClasses(userid, role);
    }, [userid, role]);

    const groupByDate = (announcements) => {
        return announcements.reduce((group, announcement) => {
            const date = announcement.deadline_date;
            if (!group[date]) group[date] = [];
            group[date].push(announcement);
            return group;
        }, {});
    };

    return (
        <ContentWrapper header={'Classes'} parentLoading={loading} accountDetails={{userid, role}} token={token}>
            <div className="site-layout-background content-area" style={{background: '#fff'}}>
                <React.Suspense fallback={<Spin style={{display: 'block', textAlign: 'center'}}/>}>
                    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around'}}>
                        {classes.map(Class => (
                            <Card
                                key={Class.id}
                                title={
                                    <>
                                        <Title level={4} style={{marginBottom: 0, color: 'white'}} onClick={() => navigate(`/u/classes/${Class.id}`)}>{Class.name}</Title>
                                        <Text type="secondary"
                                              style={{color: 'rgba(255, 255, 255, 0.75)'}}>{Class.code}</Text>
                                    </>
                                }
                                style={{
                                    width: 320,
                                    height: 320,
                                    marginBottom: 16,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    backgroundColor: '#f0f2f5'
                                }}
                                headStyle={{
                                    background: 'rgba(24, 144, 255, 0.85)', // Slightly transparent header
                                    padding: '10px 16px' // Comfortable padding for the header
                                }}
                                bodyStyle={{
                                    padding: 16,
                                    color: '#4a4a4a' // Darker text for better readability
                                }}
                            >
                                {Object.keys(groupByDate(Class.announcements)).map(date => (
                                    <div key={date}>
                                        <Title level={5} style={{
                                            color: '#595959',
                                            margin: '5px 0'
                                        }}>{`Due ${moment(date).isSame(moment(), 'day') ? 'Today' : moment(date).format('dddd')}`}</Title>
                                        <List
                                            itemLayout="horizontal"
                                            dataSource={groupByDate(Class.announcements)[date]}
                                            renderItem={item => (
                                                <List.Item key={item.announcement_id}
                                                           style={{padding: '0', borderBottom: 'none'}} onClick={() => {
                                                    navigate(`/u/classes/${Class.id}/a/${item.announcement_id}`)
                                                }}>
                                                    <Text strong style={{overflow: 'eclipse'}}>{item.title}</Text>
                                                </List.Item>
                                            )}
                                        />
                                    </div>
                                ))}
                            </Card>
                        ))}
                    </div>
                </React.Suspense>
            </div>
        </ContentWrapper>
)
}, (prevProps, nextProps) => {
    return isEqual(prevProps, nextProps);
});

export default Classes;