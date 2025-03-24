import React, { Fragment } from 'react';
import { Link } from 'react-router';
import PageHeader from 'antd/lib/page-header';
import Breadcrumb from 'antd/lib/breadcrumb';

export const ActivitiesForm = () => {
    return (
        <Fragment>
            <Breadcrumb>
                <Breadcrumb.Item>
                    <Link to="/">Start</Link>
                </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <Link to="">Aktivitäten</Link>
                    </Breadcrumb.Item>
            </Breadcrumb>
            <PageHeader
                className="site-page-header"
                title="Aktivitäten"
                subTitle="Übersicht und Zusammenfassung der letzten Aktivitäten"
            />
        </Fragment>
    );
}