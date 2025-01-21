import React, { useState } from 'react';
import { Outlet } from 'react-router';

import { ListActivities } from './ListActivities';

import Layout from 'antd/lib/layout';
import Menu from 'antd/lib/menu';
import Badge from 'antd/lib/badge';
  
import MenuUnfoldOutlined from '@ant-design/icons/MenuUnfoldOutlined';
import MenuFoldOutlined from '@ant-design/icons/MenuFoldOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import VideoCameraOutlined from '@ant-design/icons/VideoCameraOutlined';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';

import { useUserActivityCount } from '../client/trackers';
import { UserActivitiesDrawer } from './components/UserActivitiesDrawer';

import { UserMenu } from './components/UserMenu';
import { MaintenanceNotice } from './components/MaintenanceNotice';
import { Link } from './components/Link';

import { useServiceMaintenances } from '../client/trackers';

const {
    Header, 
    Sider, 
    Content
} = Layout;

export const SiteLayout = props => {
    const [menuCollapsed, setMenuCollapsed] = useState(window.innerWidth < 600);
    const [activitiesCollapsed, setActivitiesCollapsed] = useState(window.innerWidth < 600);
    const [showUserActivies, setShowUserActivies] = useState(false);

    const [activitiesCount, acLoading] = useUserActivityCount();
    const [ serviceMaintenance , serviceMaintenanceLoading ] = useServiceMaintenances();
    const toggleMenuSider = () => {
        setMenuCollapsed(!menuCollapsed);
    };
    
    const toggleActivitiesSider = () => {
        setActivitiesCollapsed(!activitiesCollapsed);
    }

    onMenuClick = ({ item, key, keyPath, domEvent }) => {
        if (window.innerWidth < 600)
            setMenuCollapsed(!menuCollapsed);

        if (key == 'USERACTIVITIES') {
            return setShowUserActivies(true);
        }
    }

    closeUserActivities = () => {
        setShowUserActivies(false);
    }

    renderUserActivitiesMenuItem = () => {
        const UserActivitiesLink = () => "Aktivitäten";

        let count = <ClockCircleOutlined style={{ color: '#f5222d' }} />;

        if (acLoading) {
            return (
                <Badge count={count} size="small" offset={[10, 0]}>
                    <UserActivitiesLink />
                </Badge>
            );
        }

        if (activitiesCount !== null && activitiesCount > 0) {
            return (
                <Badge count={activitiesCount} size="small" offset={[10, 0]} >
                    <div style={{color:"white"}}><UserActivitiesLink /></div>
                </Badge>
            );
        }

        return <UserActivitiesLink />;
    }

    const items = [
        {
            key: "USERACTIVITIES",
            label: ( renderUserActivitiesMenuItem() ),
            icon: <UserOutlined />
        },
        {
            key: "OPINIONS",
            label: ( <Link href="/opinions" canCancel>Gutachten</Link> ),
            icon: <VideoCameraOutlined />
        },
        {
            key: "INFO",
            label: ( <Link href="/info" canCancel>Info</Link> ),
            icon: <InfoCircleOutlined />
        }
    ];

    return (

        <Layout>
            <Sider theme="dark" trigger={null} collapsible collapsed={menuCollapsed} collapsedWidth="0"
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                  }}
            >
                <a href="/"><div className="mbac-logo" >
                    <img className="large" src="/MEBEDO_LOGO_PRINT_RGB-300x88.jpg" />
                </div></a>

                <Menu
                    items={items}
                    theme="dark" mode="inline"
                    selectedKeys={ props.activeMenuKey ? [props.activeMenuKey]: []}
                    onClick={onMenuClick}
                >
                    
                </Menu>
            </Sider>

            <Layout className="site-layout" style={{ marginLeft: menuCollapsed ? 0:200, marginRight: activitiesCollapsed ? 0:(props.refOpinion ? 300:0) }}>
                <Header className="site-layout-background" style={{ padding: 0 }}>
                    {
                        React.createElement(menuCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                            className: 'trigger',
                            onClick: toggleMenuSider
                        })
                    }
                    
                    { !props.refOpinion || !activitiesCollapsed ? null :
                        React.createElement(activitiesCollapsed ? MenuFoldOutlined : MenuUnfoldOutlined , {
                            className: 'trigger',
                            onClick: toggleActivitiesSider,
                            style: {float:'right'}
                        })
                    }

                    <UserMenu currentUser={props.currentUser} hasAdminRole={props.hasAdminRole} />
                    { serviceMaintenance != null ? <MaintenanceNotice serviceMaintenance={serviceMaintenance} /> : null }
                    
                </Header>
                <Content className="site-layout-content">
                    <Outlet />
                </Content>
                
            </Layout>
            
            { !props.refOpinion 
                ? null 
                : <Sider 
                    style={{
                        overflow: 'hidden auto',
                        height: '100vh',
                        position: 'fixed',
                        right: 0,
                    }}
                    theme="light" width="300" collapsible collapsed={activitiesCollapsed} collapsedWidth="0"
                >
                    
                    <ListActivities 
                        onClose={ toggleActivitiesSider }
                        refOpinion={props.refOpinion} 
                        refDetail={props.refDetail} 
                        currentUser={props.currentUser} 
                    />
                </Sider>
            }

            <UserActivitiesDrawer 
                visible={ showUserActivies }
                onClose={ closeUserActivities }
            />
        </Layout>
    );
}
  
  