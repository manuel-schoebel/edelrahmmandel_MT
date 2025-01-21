import React from 'react';
import { AppState } from '../../client/AppState';
import { useNavigate } from "react-router";

import message from 'antd/lib/message';
import Modal from 'antd/lib/modal';

import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';

export const Link = props => {
    const { href, children, onClick, canCancel } = props;
    let navigate = useNavigate();

    const go = () => {
        if (onClick) {
            if (onClick() === false) return;
        }
        if (href) navigate(href);
    }

    const discardAndGo = () => {
        const { discardChanges } = AppState.selectedDetail;

        discardChanges();
        go();
    }

    const checkEditing = e => {
        e.preventDefault();

        if (AppState.selectedDetail) {
            if (canCancel) {
                const { isDirty } = AppState.selectedDetail;

                if (isDirty()) {
                    Modal.confirm({
                        title: 'Änderungen verwerfen',
                        icon: <ExclamationCircleOutlined />,
                        content: 'Sie bearbeiten gerade einen Text. Möchten Sie die Änderungen verwerfen?',
                        okText: 'Okay',
                        cancelText: 'Abbruch',
                        onOk: discardAndGo
                    });
                } else {
                    discardAndGo();
                }
            } else {
                message.warning('Sie befinden sich aktuell in der Bearbeitung. Bitte schließen Sie diesen Vorgang zuerst ab.');
            }
            return;
        }
        go();
    }

    return (
        <a onClick={checkEditing}>
            {children}
        </a>
    )
}