import React, { useEffect, useMemo, useState } from 'react';
import {Layout, Menu, notification, Spin} from 'antd';
import {HomeOutlined, BookOutlined, SettingOutlined, ReadOutlined, ScheduleOutlined} from '@ant-design/icons';
import {useLocation, useNavigate, useParams} from "react-router-dom";
import './ContentWrappper.css'

const { Header, Sider, Content } = Layout;

const ContentWrapper = ({ header, accountDetails, parentLoading, token, children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userid, role } = accountDetails;
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [collapsed, setCollapsed] = useState(localStorage.getItem('siderCollapsed') === 'true');
    const [selectedKey, setSelectedKey] = useState(location.pathname || 'dashboard');
    const [openKeys, setOpenKeys] = useState(JSON.parse(localStorage.getItem('openKeys')) || []);

    useEffect(() => {
        async function getClasses(userid, role) {
            if (['student', 'teacher'].includes(role)) {
                const response = await fetch(`http://localhost:3001/api/classes?token=${token}&sneak=0`);
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

    const classesList = useMemo(() => (
        classes.map(c => {
            const key = `/u/classes/${c.id}`;
            return (<Menu.Item key={key} icon={<ReadOutlined />} onClick={() => {navigate(key); setSelectedKey(key);}}>{c.name}</Menu.Item>);
        })
    ), [classes, navigate]);

    const classesSection = useMemo(() => {
        return (
            <>
                <Menu.Divider className={"menu-divider"}/>
                <Menu.Item key="/u/todo" icon={<ScheduleOutlined />} onClick={() => navigate('/u/todo')}>To Do</Menu.Item>
                <Menu.SubMenu key="classes" icon={<BookOutlined />} title="Classes">
                    {classesList}
                </Menu.SubMenu>
            </>
        )
    }, [classesList]);

    const handleMenuClick = (e) => {
        localStorage.setItem('selectedKey', e.key);
        setSelectedKey(e.key);
    };

    const onOpenChange = keys => {
        localStorage.setItem('openKeys', JSON.stringify(keys));
        setOpenKeys(keys);
    };

    const toggleCollapse = collapsed => {
        localStorage.setItem('siderCollapsed', collapsed);
        setCollapsed(collapsed);
    };

    return (
        <Layout style={{ maxHeight: '100vh', position: 'relative' }}>
            {(loading || parentLoading) && (
                <div style={{position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                }}>
                    <Spin size="large" />
                </div>
            )}

            <Sider theme={"dark"} collapsible collapsed={collapsed} onCollapse={toggleCollapse}>
                <div className="logo" style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.3)' }} />
                <Menu theme="dark" inlineIndent={10} mode="inline" selectedKeys={[selectedKey]} onClick={handleMenuClick} onOpenChange={onOpenChange} openKeys={openKeys}>
                    <Menu.Item key="/u/dashboard" icon={<HomeOutlined />} onClick={() => navigate('/u/dashboard')}>Dashboard</Menu.Item>
                    {['student', 'teacher'].includes(role) && classesSection}
                    <Menu.Divider className={"menu-divider"}/>
                    <Menu.Item key="/u/settings" icon={<SettingOutlined />} onClick={() => navigate('/u/settings')}>Settings</Menu.Item>
                </Menu>
            </Sider>
            <Layout className="site-layout">
                <Header className="site-layout-background" style={{ padding: '0 16px', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ margin: 0 }}>{header}</h1>
                </Header>
                <Content style={{ margin: '16px 16px 0', overflow: 'auto', height: `calc(100vh - 64px)` }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default ContentWrapper;
