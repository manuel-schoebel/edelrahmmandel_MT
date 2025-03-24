import React, { Fragment, useState } from 'react';
import { Link } from 'react-router';
import { Accounts } from 'meteor/accounts-base';

import Modal from 'antd/lib/modal';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Divider from 'antd/lib/divider';
import message from 'antd/lib/message';

import LockOutlined from '@ant-design/icons/LockOutlined'
import UnlockOutlined from '@ant-design/icons/UnlockFilled';

import { ModalBackground } from '../components/ModalBackground';

const { useForm } = Form;

export const ModalChangePassword = ( { currentUser } ) => {
    const [ showModal, setShowModal ] = useState(false);
    const [ form ] = useForm();

    const closeDialog = e => {
        form.resetFields();
        setShowModal(false);
    }

    const showDialog = e => {
        e.preventDefault();

        setShowModal(true);
    }

    const handleOk = e => {
        form.validateFields().then( ({ oldPassword, newPassword }) => {
            Accounts.changePassword(oldPassword, newPassword, err => {
                if (err) {
                    return message.error('Fehler! Das Passwort wurde nicht geändert. Bitte überprüen Sie Ihre Angaben.');
                }

                message.success('Ihr Passwort wurde erfolgreich geändert');
                closeDialog();
            });
        });
    }

    return (
        <Fragment>
            <Link to="#" onClick={showDialog}><UnlockOutlined /> Passwort ändern</Link>

            { !showModal ? null :
                <ModalBackground>
                    <Modal
                        title="Passwort ändern"
                        open={ showModal }
                        onOk={ handleOk }
                        onCancel={ closeDialog }
                        maskClosable={false}
                    >
                        <p>Zum Ändern Ihres Passworts geben Sie bitte Ihr bisheriges Kennwort ein und geben anschließend das neue Passwort ein und bestätigen dies.</p>

                        <Form
                            layout="vertical"
                            form={form}
                            //onFinish={handleOk}
                        >

                            <Form.Item
                                label="Altes Passwort"
                                name="oldPassword"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie Ihr altes Passwort an.',
                                    },
                                ]}
                            >
                                <Input.Password autoFocus prefix={<UnlockOutlined />} />
                            </Form.Item>

                            <Divider orientation="left">Neues Passwort</Divider>

                            <Form.Item
                                label="Neues Passwort"
                                name="newPassword"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie Ihr neues Passwort ein.',
                                    },
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} />
                            </Form.Item>

                            <Form.Item
                                label="Bestätigung"
                                name="newRepeat"
                                dependencies={['newPassword']}
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte bestätigen Sie das neue Passwort.',
                                    },
                                    ({ getFieldValue }) => ({
                                        validator( _ , value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject('Bitte überprüfen Sie die Bestätigung Ihres Passworts.');
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} />
                            </Form.Item>

                        </Form>
                    </Modal>
                </ModalBackground>
            }
        </Fragment>
    );
}
