import React, {useEffect, useState} from 'react';
import ContentWrapper from "../ContentWrapper/ContentWrapper";
import isEqual from "fast-deep-equal";
import {Button, List, Spin} from "antd";
import { Tabs, Collapse, Select } from 'antd';
import {FileTextOutlined} from "@ant-design/icons";
import './Todo.css';
import moment from "moment";
import {useNavigate, useParams} from "react-router-dom";

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;


const Todo = React.memo(({userid, role, token}) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('1');
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignedData, setAssignedData] = useState([]);
    const [missingData, setMissingData] = useState([]);
    const { class: classParam } = useParams();
    const [selectedClass, setSelectedClass] = useState('a');
    useEffect(() => {
        async function getTodo(token, classParam) {
            const response = await fetch(`http://localhost:3001/api/user/todo?token=${token}`);
            if (response.ok) {
                const data = await response.json();
                setClasses(data.classes);

                const now = moment();
                const sThisWk = now.clone().startOf('isoWeek');
                const sNextWk = sThisWk.clone().add(1, 'weeks');
                const s2WksFromNow = sNextWk.clone().add(1, 'weeks');
                const sPrevWk = now.clone().add(-1, 'weeks').startOf('isoWeek');
                setAssignedData([
                    {
                        collapseTitle: 'This week',
                        assignments: data.announcements.filter(a =>
                            moment(a.deadline_date, 'YYYY-MM-DD').isBetween(now, sNextWk, undefined, '[)')
                        ),
                    },
                    {
                        collapseTitle: 'Next week',
                        assignments: data.announcements.filter(a =>
                            moment(a.deadline_date, 'YYYY-MM-DD').isBetween(sNextWk, s2WksFromNow, undefined, '[)')
                        ),
                    },
                    {
                        collapseTitle: 'Later',
                        assignments: data.announcements.filter(a =>
                            moment(a.deadline_date, 'YYYY-MM-DD').isSameOrAfter(s2WksFromNow)
                        ),
                    },
                    {
                        collapseTitle: 'No due date',
                        assignments: data.announcements.filter(a => !a.deadline_date),
                    },
                ].map(section => ({
                    ...section,
                    number: section.assignments.length
                })));
                setMissingData([
                    {
                        collapseTitle: 'This week',
                        assignments: data.announcements.filter(a =>
                            moment(a.deadline_date, 'YYYY-MM-DD').isBetween(sThisWk, now, undefined, '[)')
                        ),
                    },
                    {
                        collapseTitle: 'Last week',
                        assignments: data.announcements.filter(a =>
                            moment(a.deadline_date, 'YYYY-MM-DD').isBetween(sPrevWk, sThisWk, undefined, '[)')
                        ),
                    },
                    {
                        collapseTitle: 'Earlier',
                        assignments: data.announcements.filter(a =>
                            moment(a.deadline_date, 'YYYY-MM-DD').isBefore(sPrevWk)
                        ),
                    }
                ].map(section => ({
                    ...section,
                    number: section.assignments.length
                })));
            } else {
            }
            setLoading(false);
        }
        getTodo(token, classParam);
    }, [userid, role]);

    useEffect(() => {
        const updatedAssignedData = assignedData.map(d => ({
            ...d,
            number: d.assignments.filter(a => (a.class_id === selectedClass || selectedClass === 'a')).length
        }));
        setAssignedData(updatedAssignedData);
        const updatedMissingData = missingData.map(d => ({
            ...d,
            number: d.assignments.filter(a => (a.class_id === selectedClass || selectedClass === 'a')).length
        }));
        setMissingData(updatedMissingData);
    }, [selectedClass]);

    const onTabChange = (key) => {
        setActiveTab(key);
    }

    const onClassChange = (key) => {
        setSelectedClass(key);
    }

    function formatDeadline(item, assignment) {
        if (item.collapseTitle === 'No due date') {
            return '';
        }

        if (item.collapseTitle === 'This week') {
            return moment(assignment.deadline_date).isSame(moment(), 'day')
                ? `Today, ${moment(assignment.deadline_date).format('HH:mm')}`
                : moment(assignment.deadline_date).format('dddd, HH:mm');
        }

        return moment(assignment.deadline_date).format('dddd, DD MMM');
    }

    const renderCollapsePanelHeader = (text, number) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{text}</span>
            <span>{number}</span>
        </div>
    );

    const [loadedItems, setLoadedItems] = useState({});

    const loadMoreItems = (panelKey) => {
        setLoadedItems({
            ...loadedItems,
            [panelKey]: (loadedItems[panelKey] || 5) + 10,
        });
    };

    return (
        <ContentWrapper header={'To Do'} parentLoading={loading}  accountDetails={{userid, role}} token={token}>
            <div className="site-layout-background content-area" style={{background: '#fff'}}>
                <React.Suspense fallback={<Spin style={{display: 'block', textAlign: 'center'}}/>}>
                    <div style={{ margin: '16px' }}>
                        <Tabs defaultActiveKey="1" activeKey={activeTab} onChange={onTabChange}>
                            <TabPane tab="Assigned" key="1">
                                <Select defaultValue={selectedClass} style={{ width: '100%', marginBottom: '16px' }} onChange={onClassChange}>
                                    <Option value="a">All classes</Option>
                                    {classes.map(c => (<Option value={c.id} key={c.id}>{c.name}</Option>))}
                                </Select>
                                <Collapse>
                                    {assignedData.map(item => (
                                        <Panel
                                            header={renderCollapsePanelHeader(item.collapseTitle, item.number)}
                                            key={item.collapseTitle}
                                            className="custom-collapse-panel"
                                            collapsible={item.number ? '' : 'disabled'}
                                        >
                                            <List
                                                dataSource={item.assignments.filter(a => (a.class_id === selectedClass || selectedClass === 'a')).slice(0, loadedItems[item.collapseTitle] || 5)}
                                                renderItem={assignment => (
                                                    <List.Item
                                                        key={assignment.announcement_id}
                                                        onClick={() => navigate(`/u/classes/${assignment.class_id}/a/${assignment.announcement_id}`)}
                                                        actions={[<span className="assignment-deadline">{formatDeadline(item, assignment)}</span>]}
                                                    >
                                                        <List.Item.Meta
                                                            avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#08c' }} />}
                                                            title={assignment.title}
                                                            description={classes.find(c => c.id === assignment.class_id)?.name}
                                                        />
                                                    </List.Item>
                                                )}
                                                loadMore={
                                                    item.assignments.length > (loadedItems[item.collapseTitle] || 5) ? (
                                                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                                                            <Button onClick={() => loadMoreItems(item.collapseTitle)}>Load More</Button>
                                                        </div>
                                                    ) : null
                                                }
                                            />
                                        </Panel>
                                    ))}
                                </Collapse>
                            </TabPane>
                            <TabPane tab="Missing" key="2">
                                <Select defaultValue={selectedClass} style={{ width: '100%', marginBottom: '16px' }} onChange={onClassChange}>
                                    <Option value="a">All classes</Option>
                                    {classes.map(c => (<Option value={c.id} key={c.id}>{c.name}</Option>))}
                                </Select>
                                <Collapse>
                                    {missingData.map(item => (
                                        <Panel
                                            header={renderCollapsePanelHeader(item.collapseTitle, item.number)}
                                            key={item.collapseTitle}
                                            className="custom-collapse-panel"
                                            collapsible={item.number ? '' : 'disabled'}
                                        >
                                            <List
                                                dataSource={item.assignments.filter(a => (a.class_id === selectedClass || selectedClass === 'a')).slice(0, loadedItems[item.collapseTitle] || 5)}
                                                renderItem={assignment => (
                                                    <List.Item
                                                        key={assignment.announcement_id}
                                                        onClick={() => navigate(`/u/classes/${assignment.class_id}/a/${assignment.announcement_id}`)}
                                                        actions={[<span className="assignment-deadline">{formatDeadline(item, assignment)}</span>]}
                                                    >
                                                        <List.Item.Meta
                                                            avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#08c' }} />}
                                                            title={assignment.title}
                                                            description={classes.find(c => c.id === assignment.class_id)?.name}
                                                        />
                                                    </List.Item>
                                                )}
                                                loadMore={
                                                    item.assignments.length > (loadedItems[item.collapseTitle] || 5) ? (
                                                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                                                            <Button onClick={() => loadMoreItems(item.collapseTitle)}>Load More</Button>
                                                        </div>
                                                    ) : null
                                                }
                                            />
                                        </Panel>
                                    ))}
                                </Collapse>
                            </TabPane>
                        </Tabs>
                    </div>
                </React.Suspense>
            </div>
        </ContentWrapper>
    )
}, (prevProps, nextProps) => {
    return isEqual(prevProps, nextProps);
});

export default Todo;