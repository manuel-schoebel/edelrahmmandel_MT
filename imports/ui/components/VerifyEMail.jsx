import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Divider from 'antd/lib/divider';
import Modal from 'antd/lib/modal';
import notification from 'antd/lib/notification';

import UserOutlined from '@ant-design/icons/UserOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';

import { useNavigate, useParams } from 'react-router';


const layout = {
    labelCol: {
        span: 8,
    },
    wrapperCol: {
        span: 16,
    },
};

const tailLayout = {
    wrapperCol: {
        offset: 8,
        span: 16,
    },
};

export const VerifyEMail = () => {
    const { token } = useParams();
    const [ verifing, setVerifing ] = useState(false);
    const navigate = useNavigate();

    const setPassword = data => {
        const {newPassword, repeatPassword} = data;

        if (newPassword !== repeatPassword) {
            return Modal.warning({
                title: 'Fehler',
                content: 'Die Passwortwiederholung ist fehlgeschlagen. Bitte überprüfen Sie Ihre Angaben.'
            });
        }
        
        setVerifing(true);

        Accounts.verifyEmail(token, err => {
            if (err) {
                setVerifing(false);
                return Modal.error({
                    title: 'Fehler',
                    content: 'Die Bestätigung des Benutzers ist fehlgeschlagen.\n' + err.message,
                });
            }

            Meteor.call('users.getInitialPassword', (err, oldPassword) => {
                if (err) {
                    setVerifing(false);
                    return Modal.error({
                        title: 'Fehler',
                        content: 'Es ist ein Fehler bei der Bestätigung aufgetreten.\n' + err.message,
                    });
                }

                Accounts.changePassword(oldPassword, data.newPassword, err => {
                    if (err) {
                        setVerifing(false);
                        return Modal.error({
                            title: 'Login fehlgeschlagen',
                            content: 'Bitte überprüfen Sie Ihren Benutzernamen und/oder Passwort und versuchen Sie es erneut.',
                        });  
                    }

                    notification.success({
                        message: 'Bestätigung abgeschlossen!',
                        description: 'Die Bestätigung Ihres Zugangs wurde erfolgreich abgeschlossen. Sie werden umgehend am System angemeldet.'
                    });
                    
                    setTimeout(() => {
                        navigate('/opinions');
                    }, 2000);
                });
            });
        });
    };

    return (
        <Row>
            <Col xs={2} sm={2} md={4} lg={6} xl={8} />
        
            <Col xs={20} sm={20} md={16} lg={12} xl={8} id="Login">
                <Divider orientation="right" style={{color:'orange'}}>Zugang aktivieren</Divider>
                <h1>Willkommen!</h1>
                <p>
                    Hiermit bestätigen Sie Ihren <strong>MEBEDO GutachtenPlus</strong> - Zugang.
                    <br/>Bitte vergeben Sie zum erfolgreichen Abschluss noch Ihr Kennwort.
                </p>
                <Form
                    {...layout}
                    name="LoginForm"
                    onFinish={setPassword}
                >
                    <Form.Item
                        label="Passwort"
                        name="newPassword"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte geben Sie Ihr Passwort ein.',
                            },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="Passwort"/>
                    </Form.Item>

                    <Form.Item
                        label="Bestätigung"
                        name="repeatPassword"
                        rules={[
                            {
                            required: true,
                            message: 'Bitte bestätigen Sie Ihr Passwort.',
                            },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="Bestätigung"/>
                    </Form.Item>

                    <Form.Item {...tailLayout}>
                        <Button type="primary" htmlType="submit" loading={verifing}>
                            Bestätigung abschließen
                        </Button>
                    </Form.Item>
                </Form>
            </Col>
      
            <Col xs={2} sm={2} md={4} lg={6} xl={8} />
       
        </Row>
    )
};