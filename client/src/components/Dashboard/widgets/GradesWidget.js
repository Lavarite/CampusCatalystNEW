import React, { useState, useEffect } from 'react';
import { Card, List, Spin, Button } from 'antd';
import moment from 'moment';
import {CloseOutlined, LeftOutlined, RightOutlined} from '@ant-design/icons';
import './ScheduleWidget.css';

const GradesWidget = ({ role, userId, maxHeight, closeFunc, id }) => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(moment());

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:3001/api/lessons?role=${role}&id=${userId}&day=${selectedDate.date()}&month=${selectedDate.month() + 1}&year=${selectedDate.year()}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setSchedule(data);
            } catch (error) {
                console.error('There has been a problem with your fetch operation:', error);
            }
            setLoading(false);
        };

        fetchSchedule();
    }, [role, userId, selectedDate]);

    const navigateDays = (days) => {
        setSelectedDate(prev => prev.clone().add(days, 'days'));
    };

    return (
        <Card
            className="ScheduleWidget" // Add the specific class to the Card
            title={
                <div className="DragHandle">Schedule for {selectedDate.format('dddd, MMM D')}</div>
            }
            extra={
                <>
                    <Button onClick={() => navigateDays(-1)} icon={<LeftOutlined />} />
                    <Button onClick={() => navigateDays(1)} style={{ marginLeft: 8 }} icon={<RightOutlined />} />
                </>
            }
            style={{ width: '100%', height: '100%' }}
        >
            <CloseOutlined
                className="CloseOutlined" // Apply class for styling close button
                onClick={() => closeFunc(id)}
            />
            {loading ? (
                <Spin style={{ display: 'block', textAlign: 'center' }} />
            ) : (
                <div
                    className="scrollable-list"
                    style={{ overflowY: 'auto', maxHeight: maxHeight+'px' }}
                >
                    <List
                        itemLayout="horizontal"
                        dataSource={schedule}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    title={`${item.name} - ${item.classroom || 'N/A'}`}
                                    description={`${moment(item.session_start, 'HH:mm:ss').format('HH:mm')} - ${moment(item.session_end, 'HH:mm:ss').format('HH:mm')}`}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            )}
        </Card>
    );
};

export default GradesWidget;
