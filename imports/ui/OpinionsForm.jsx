import React, { useState, useEffect } from 'react';
import PageHeader from 'antd/lib/page-header';
import Breadcrumb from 'antd/lib/breadcrumb';
import Space from 'antd/lib/space';
import Affix from 'antd/lib/affix';
import Layout from 'antd/lib/layout';
import { Link, NavLink } from "react-router";

const { Content } = Layout;

import { ModalOpinion } from './modals/Opinion';
import { ListOpinions } from './ListOpinions';

import { hasPermission } from './../api/helpers/roles';

export const OpinionsForm = ({currentUser}) => {

    const [canCreate, setCanCreate] = useState(false);
    const [canManageTemplate, setCanManageTemplate] = useState(false);

    useEffect(() => {
        if(!currentUser) return;
        hasPermission({currentUser}, 'opinion.create').then( permission => {
            setCanCreate(permission);
        } )
        hasPermission({currentUser}, 'opinion.create').then( permission => {
            setCanManageTemplate(permission)
        } )
    }, [currentUser])


    const pageHeaderButtons = <Space>
        { canCreate ? <ModalOpinion mode="NEW" /> : null }
        { canManageTemplate ? <ModalOpinion mode="NEW" createTemplate={true} /> : null }
    </Space>;

    return (
        <Layout>
            <Content>
                <Affix className="affix-opiniondetail" offsetTop={0}>
                    <div>
                        <Breadcrumb>
                            <Breadcrumb.Item>
                                <Link to="/">Start</Link>
                            </Breadcrumb.Item>
                            <Breadcrumb.Item>
                                <Link to="#">Gutachten</Link>
                            </Breadcrumb.Item>
                        </Breadcrumb>

                        <PageHeader
                            className="site-page-header"
                            title="Gutachten"
                            subTitle="Übersicht der Ihnen zugewiesenen oder von Ihnen erstellten Gutachten."
                            extra={pageHeaderButtons}
                        />
                    </div>
                </Affix>

                <ListOpinions currentUser={currentUser}/>
            </Content>
        </Layout>
    );
}