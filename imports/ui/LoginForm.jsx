import { Meteor } from 'meteor/meteor';
import React from 'react';
import { Link } from 'react-router';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Divider from 'antd/lib/divider';
import Modal from 'antd/lib/modal';
import Space from 'antd/lib/space';

import UserOutlined from '@ant-design/icons/UserOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';

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

export const LoginForm = () => {

  const login = data => {
    const username = data.username && data.username.toLowerCase();

    Meteor.loginWithPassword(username, data.password, err => {
      if (err) {
        Modal.error({
          title: 'Login fehlgeschlagen',
          content: 'Bitte überprüfen Sie Ihren Benutzernamen (E-Mail Adresse) und/oder Ihr Passwort und versuchen Sie es erneut.',
        });
      }
    });
  };

  return (
    <Row>
      <Col xs={2} sm={2} md={4} lg={6} xl={8} />
        
      <Col xs={20} sm={20} md={16} lg={12} xl={8} id="Login">
        <Divider orientation="left">Login</Divider>
        <p>
          Herzlich Willkommen zu MEBEDO GutachtenPlus!
        </p>
        <p>
          Bitte melden Sie sich mit Ihren Benutzerdaten an, Benutzername = E-Mail Adresse.
        </p>
        <Form
          {...layout}
          name="LoginForm"
          
          onFinish={login}
        >
          <Form.Item
              label="Benutzername"
              name="username"
              rules={[
                  {
                  required: true,
                  message: 'Bitte geben Sie Ihren Benutzernamen (die E-Mail Adresse) ein.',
                  },
              ]}
          >
              <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Benutzer"/>
          </Form.Item>

          <Form.Item
              label="Passwort"
              name="password"
              rules={[
                  {
                  required: true,
                  message: 'Bitte geben Sie Ihr Passwort ein.',
                  },
              ]}
          >
              <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="Passwort"/>
          </Form.Item>

          <Form.Item {...tailLayout}>
              <Space split={<Divider type="vertical" />} size="large">
                  <Button type="primary" htmlType="submit">
                      Anmelden
                  </Button>

                  <Link to="/forgotpassword">Passwort vergessen</Link>
              </Space>
              
          </Form.Item>
        </Form>
      </Col>
      
      <Col xs={2} sm={2} md={4} lg={6} xl={8} />
       
    </Row>
    
  );
};