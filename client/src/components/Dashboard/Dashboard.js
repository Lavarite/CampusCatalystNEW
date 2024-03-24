import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Button, Dropdown, Menu, Spin} from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import {Responsive, WidthProvider} from 'react-grid-layout';
import ProtectedComponent from '../ProtectedComponent';
import './Dashboard.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import isEqual from 'fast-deep-equal';
import ContentWrapper from "../ContentWrapper/ContentWrapper";

const ResponsiveGridLayout = WidthProvider(Responsive);

const ScheduleWidget = React.lazy(() => import('./widgets/ScheduleWidget'));
const GradesWidget = React.lazy(() => import('./widgets/GradesWidget'));

const Dashboard = React.memo(({userid, role, token}) => {
    const availableWidgets = useMemo(() => [
        { key: 'ScheduleWidget', name: 'Schedule Widget', roles: ['student', 'teacher'], component: ScheduleWidget },
        { key: 'GradesWidget', name: 'Grades Widget', roles: ['student'], component: GradesWidget }
    ], [role, userid, token]);

    const [widgets, setWidgets] = useState(() => {
        const storedWidgets = JSON.parse(localStorage.getItem(`widgets_${userid}`) || '[]');
        return storedWidgets.map(widgetData => ({
            ...availableWidgets.find(({ key }) => key === widgetData.key),
            ...widgetData,
        }));
    });

    const [resizedHeights, setResizedHeights] = useState(() => {
        return JSON.parse(localStorage.getItem(`heights_${userid}`) || '[]');
    });

    const addWidget = useCallback(key => {
        const widgetToAdd = availableWidgets.find(widget => widget.key === key);
        if (!widgetToAdd || widgets.some(widget => widget.key === key)) return;

        const newWidget = {
            ...widgetToAdd,
            i: String(widgets.length ? Math.max(...widgets.map(w => parseInt(w.i))) + 1 : 1),
            x: (widgets.length * 2) % (12 / 2),
            y: widgets.reduce((max, current) => Math.max(max, current.y + current.h), 0),
            w: 4,
            h: 3,
            minW: 4,
            minH: 2,
            maxH: 5
        };

        setWidgets([...widgets, newWidget]);
        onResize([...widgets, newWidget], null, newWidget);
    }, [widgets, availableWidgets]);

    const removeWidget = useCallback(widgetId => {
        setWidgets(currentWidgets => currentWidgets.filter(widget => widget.i !== widgetId));
    }, []);

    useEffect(() => {
        localStorage.setItem(`heights_${userid}`, JSON.stringify(resizedHeights));
        localStorage.setItem(`widgets_${userid}`, JSON.stringify(widgets.map(({ key, i, w, h, x, y, minW, minH, maxH }) => ({ key, i, w, h, x, y, minW, minH, maxH }))));
    }, [widgets, resizedHeights]);

    const onResize = useCallback((layout, oldItem, newItem) => {
        const updatedHeights = { ...resizedHeights, [newItem.i]: newItem.h };
        setResizedHeights(updatedHeights);
    }, [resizedHeights]);

    const onLayoutChange = useCallback((newLayout) => {
        const updatedWidgets = widgets.map(widget => {
            const layoutItem = newLayout.find(item => item.i === widget.i);
            return { ...widget, ...layoutItem };
        });
        setWidgets(updatedWidgets);
    }, [widgets]);

    const onResizeStop = useCallback((layout, oldItem, newItem) => {
        onLayoutChange(layout);
    }, [onLayoutChange]);

    const onDragStop = useCallback((layout) => {
        onLayoutChange(layout);
    }, [onLayoutChange]);

    const widgetsMenu = useMemo(() => (
        <Menu>
            {availableWidgets
                .filter(w => !widgets.some(widget => widget.key === w.key))
                .map(widget => (
                    <ProtectedComponent allowedRoles={widget.roles} key={widget.key}>
                        <Menu.Item key={widget.key} onClick={() => addWidget(widget.key)}>
                            {widget.name}
                        </Menu.Item>
                    </ProtectedComponent>
                ))}
        </Menu>
    ), [widgets, availableWidgets, addWidget]);

    return (
        <ContentWrapper header={"Dashboard"} accountDetails={{userid, role}} token={token}>
            <div className="site-layout-background content-area" style={{background: '#fff'}}>
                <React.Suspense fallback={<Spin style={{display: 'block', textAlign: 'center', top: '50%'}}/>}>
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={{lg: widgets}}
                        breakpoints={{lg: 1200}}
                        cols={{lg: 12}}
                        rowHeight={100}
                        width={1200}
                        onLayoutChange={onLayoutChange}
                        isResizable={true}
                        onResizeStop={onResizeStop}
                        onResize={onResize}
                        onDragStop={onDragStop}
                        draggableHandle={".DragHandle"}
                    >
                        {widgets.map(widget => (
                            <div key={widget.i} data-grid={widget}>
                                {React.createElement(widget.component, {
                                    token,
                                    role,
                                    userId: userid,
                                    maxHeight: resizedHeights[widget.i] ? resizedHeights[widget.i] * 100 - 50 : undefined,
                                    closeFunc: removeWidget,
                                    id: widget.i
                                })}
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                </React.Suspense>
                <Dropdown overlay={widgetsMenu} placement="bottomRight" trigger={['click']}>
                    <Button className="widget-add-button" type="primary" shape="circle" icon={<PlusCircleOutlined/>}
                            size="large" style={{margin: '16px 0', float: 'right'}}/>
                </Dropdown>
            </div>
        </ContentWrapper>
    )
}, (prevProps, nextProps) => {
    // Custom equality check for props and state
    return isEqual(prevProps, nextProps);
});

export default Dashboard;