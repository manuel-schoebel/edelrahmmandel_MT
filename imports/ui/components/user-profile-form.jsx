import React, { Fragment, useState } from 'react';
import { Link } from 'react-router';

import PageHeader from 'antd/lib/page-header';
import Breadcrumb from 'antd/lib/breadcrumb';
import Affix from 'antd/lib/affix';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Select from 'antd/lib/select';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Card from 'antd/lib/card';
import Button from 'antd/lib/button';
import message from 'antd/lib/message';

const { Option } = Select;

import UserAddOutlined from '@ant-design/icons/UserAddOutlined';
import MailOutlined from '@ant-design/icons/MailOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';

import Upload from 'antd/lib/upload';
import ImgCrop from 'antd-img-crop';

import { Avatars } from '../../api/collections/avatars';
import { useAvatar } from '../../client/trackers';

import Compressor from 'compressorjs';

const UserImage = ({userId}) => {
    const [ avatarLink, isLoading ] = useAvatar(userId);

    if (isLoading || !avatarLink) {
        return null;
    }

    return (
        <img src={avatarLink} />
    )
}

export class UserProfileForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            userData: props.currentUser.userData,
            editImage: false,
        }

        this.formRef = React.createRef();
    }

    componentDidMount(){
        const form = this.formRef.current;

        form.setFieldsValue(this.state.userData);
    }

    saveProfile(e) {
        const form = this.formRef.current;

        form.validateFields().then(values => {
            Meteor.call('users.updateProfile', values, err => {
                console.log(err);
                if ( !err )
                    message.warning('Speichern erfolgreich.');
            });
        });
    }

    editUserimage(e) {
        this.setState({ editImage: true });
    }

    beforeUpload(file) {
        const { currentUser } = this.props;

        const newAvatar = file; //fileList[0].originFileObj;

        const uploadImage = async file => {
            const result = await Avatars.remove({ userId: currentUser._id });

            try{
                const upload = await Avatars.insert({
                    file,
                    chunkSize: 'dynamic',
                    meta: { userId: currentUser._id }
                }, false);
    
                upload.on('end', function (error, fileObj) {
                    if (error) {
                        message.error(`Fehler beim Upload: ${error}`);
                    } else {
                        //console.log(`File successfully uploaded`, fileObj);
                    }
                });
    
                upload.start();
            } catch(e) {
                throw e
            }
        }

        //uploadImage(newAvatar);
        new Compressor(newAvatar, {
            maxWidth: 128,
            quality: 0.8,
            success(compressedImage) {
                uploadImage(compressedImage);
            },
            error(err) {
                console.log('compressor-err:', err);
            },
        });

        return false;
    }

    render() {
        const saveProfile = this.saveProfile.bind(this);
        const editUserimage = this.editUserimage.bind(this);

        const { editImage } = this.state;

        return (
            <Fragment>
                <Affix className="mbac-affix-pageheader" offsetTop={0}>
                    <div>
                        <Breadcrumb>
                            <Breadcrumb.Item>
                                <Link to="/">Start</Link>
                            </Breadcrumb.Item>
                            <Breadcrumb.Item>
                                <Link to="/profile">Mein Profil</Link>
                            </Breadcrumb.Item>
                        </Breadcrumb>
                        <PageHeader
                            className="site-page-header"
                            title="Mein Profil"
                            onBack={() => history.back()}
                            extra={[
                                <Button key="1" type="primary" onClick={saveProfile}>Speichern</Button>
                            ]}
                        />
                    </div>
                </Affix>

                <Form
                    layout="vertical"
                    ref={this.formRef}
                >
                    <Row gutter={[16,16]/*{xs:4, sm:4, md: 8, lg:16, xl:16}*/} >
                        <Col xs={24} sm={24} md={12} lg={4} xl={4}>
                            <Card 
                                title="Benutzer"
                                bordered={false}
                                cover={ <UserImage userId={this.props.currentUser._id} /> }
                                extra={[
                                    <ImgCrop key="1" quality={1} modalTitle="Bild bearbeiten" minZoom={0.5} maxZoom={5}>
                                        <Upload 
                                            beforeUpload={this.beforeUpload.bind(this)}
                                        >
                                            <EditOutlined onClick={editUserimage} />
                                        </Upload>
                                    </ImgCrop>
                                ]}
                            >
                            </Card>
                        </Col>
                        <Col xs={24} sm={24} md={12} lg={10} xl={10}>
                            <Card title="Allgemein" bordered={false}>
                                <Form.Item
                                    label="Anrede"
                                    name="gender"
                                    rules={[{
                                        required: true,
                                        message: 'Bitte wählen Sie eine Anrede aus.',
                                    }]}
                                >
                                    <Select style={{width:300}}>
                                        <Option key="Herr">Herr</Option>
                                        <Option key="Frau">Frau</Option>
                                        <Option key="divers">Divers</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    label="Vorname"
                                    name="firstName"
                                    rules={[{
                                        required: true,
                                        message: 'Bitte geben Sie den Vornamen ein.',
                                    }]}
                                >
                                    <Input prefix={<UserAddOutlined />} />
                                </Form.Item>

                                <Form.Item
                                    label="Nachname"
                                    name="lastName"
                                    rules={[{
                                        required: true,
                                        message: 'Bitte geben Sie den Nachnamen ein.',
                                    }]}
                                >
                                    <Input prefix={<UserAddOutlined />} />
                                </Form.Item>

                                <Form.Item
                                    label="E-Mail"
                                    name="email"
                                    rules={[{
                                        type: 'email',
                                        message: 'Bitte geben Sie eine gültige E-Mail Adresse ein!',
                                        },{
                                        required: true,
                                        message: 'Bitte geben Sie die E-Mail Adresse ein.',
                                    }]}
                                >
                                    <Input prefix={<MailOutlined />} />
                                </Form.Item>

                            </Card>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={10} xl={10}>
                            <Card title="Erweitert" bordered={false}>
    
                                <Form.Item
                                    label="Firma"
                                    name="company"
                                    rules={[{
                                        required: true,
                                        message: 'Bitte geben Sie den Firmennamen ein.',
                                    }]}
                                >
                                    <Input prefix={null} />
                                </Form.Item>

                                <Form.Item
                                    label="Position"
                                    name="position"
                                >
                                    <Input prefix={null} />
                                </Form.Item>

                                <Form.Item
                                    label="Qualifkation"
                                    name="qualification"
                                >
                                    <Input prefix={null} />
                                </Form.Item>
                                <Form.Item
                                    label="Weiterf. Qualifikation bzgl. Gutachter, hier 'BDSH e. V. geprüfter Sachverständiger' eintragen"
                                    name="advancedQualification"
                                >
                                    <Input prefix={null} />
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>
                </Form>

            </Fragment>
        );
    }
}