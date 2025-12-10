import React, { useState } from 'react';
import { Form, Input, Button, Toast, Tabs } from 'antd-mobile';
import { login, register } from '../api/api';
import { saveToken, saveUser } from '../utils/auth';

const LoginPage = ({ setToken }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // 处理登录
  const handleLogin = async (values) => {
    const { username, password } = values;
    
    if (!username || !password) {
      Toast.show({ content: '请填写用户名和密码', icon: 'fail' });
      return;
    }

    setLoading(true);
    try {
      const data = await login(username, password);
      
      // 保存 Token 和用户信息
      saveToken(data.token);
      saveUser(data.user);
      setToken(data.token);
      
      Toast.show({ content: '登录成功', icon: 'success' });
    } catch (error) {
      Toast.show({ content: error.message || '登录失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async (values) => {
    const { username, password, confirmPassword } = values;
    
    if (!username || !password) {
      Toast.show({ content: '请填写用户名和密码', icon: 'fail' });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({ content: '两次密码输入不一致', icon: 'fail' });
      return;
    }

    if (password.length < 6) {
      Toast.show({ content: '密码长度至少 6 位', icon: 'fail' });
      return;
    }

    setLoading(true);
    try {
      await register(username, password);
      Toast.show({ content: '注册成功，请登录', icon: 'success' });
      setActiveTab('login');
    } catch (error) {
      Toast.show({ content: error.message || '注册失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Logo 区域 */}
      <div style={styles.header}>
        <div style={styles.logo}>💭</div>
        <h1 style={styles.title}>Mind Shot</h1>
        <p style={styles.subtitle}>你的异步思维推进器</p>
      </div>

      {/* 表单区域 */}
      <div style={styles.formContainer}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.Tab title="登录" key="login">
            <Form
              layout="vertical"
              onFinish={handleLogin}
              style={styles.form}
              footer={
                <Button
                  block
                  type="submit"
                  color="primary"
                  size="large"
                  loading={loading}
                  style={styles.submitButton}
                >
                  登录
                </Button>
              }
            >
              <Form.Item name="username" label="用户名">
                <Input placeholder="请输入用户名" clearable />
              </Form.Item>
              <Form.Item name="password" label="密码">
                <Input type="password" placeholder="请输入密码" clearable />
              </Form.Item>
            </Form>
          </Tabs.Tab>

          <Tabs.Tab title="注册" key="register">
            <Form
              layout="vertical"
              onFinish={handleRegister}
              style={styles.form}
              footer={
                <Button
                  block
                  type="submit"
                  color="primary"
                  size="large"
                  loading={loading}
                  style={styles.submitButton}
                >
                  注册
                </Button>
              }
            >
              <Form.Item name="username" label="用户名">
                <Input placeholder="2-20 个字符" clearable />
              </Form.Item>
              <Form.Item name="password" label="密码">
                <Input type="password" placeholder="至少 6 位" clearable />
              </Form.Item>
              <Form.Item name="confirmPassword" label="确认密码">
                <Input type="password" placeholder="再次输入密码" clearable />
              </Form.Item>
            </Form>
          </Tabs.Tab>
        </Tabs>
      </div>

      {/* 底部说明 */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          像发微信一样，把脑子里的杂念、灵感、任务丢进去
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    padding: '40px 20px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logo: {
    fontSize: '60px',
    marginBottom: '10px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  },
  form: {
    marginTop: '16px',
  },
  submitButton: {
    marginTop: '20px',
    borderRadius: '8px',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '30px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
  },
};

export default LoginPage;
