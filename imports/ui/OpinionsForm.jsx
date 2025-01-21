import React, { Fragment } from 'react';
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
    const pageHeaderButtons = <Space>
        { hasPermission({currentUser}, 'opinion.create') ? <ModalOpinion mode="NEW" /> : null }
        { hasPermission({currentUser}, 'opinion.manageTemplate') ? <ModalOpinion mode="NEW" createTemplate={true} /> : null }
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