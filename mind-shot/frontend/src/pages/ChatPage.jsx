import React, { useState, useEffect, useRef } from 'react';
import { NavBar, Toast, DotLoading } from 'antd-mobile';
import { SetOutline } from 'antd-mobile-icons';
import MessageBubble from '../components/MessageBubble';
import InputBar from '../components/InputBar';
import DetailDrawer from '../components/DetailDrawer';
import { getMessages, sendMessage } from '../api/api';
import { logout, getUser } from '../utils/auth';

const ChatPage = ({ setToken }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const user = getUser();

  // 加载消息
  useEffect(() => {
    loadMessages();
  }, []);

  // 滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getMessages();
      setMessages(data.messages || []);
    } catch (error) {
      Toast.show({ content: error.message || '加载消息失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const handleSend = async (content) => {
    if (!content.trim()) return;

    setSending(true);
    try {
      const data = await sendMessage(content);
      // 添加新消息到列表
      setMessages((prev) => [...prev, ...data.messages]);
    } catch (error) {
      Toast.show({ content: error.message || '发送失败', icon: 'fail' });
    } finally {
      setSending(false);
    }
  };

  // 处理消息点击
  const handleMessageClick = (message) => {
    // 只有 Agent 的富卡片消息才能点击展开详情
    if (message.role === 'agent' && message.message_type === 'rich_card') {
      setSelectedMessage(message);
    }
  };

  // 处理登出
  const handleLogout = () => {
    logout();
    setToken(null);
    Toast.show({ content: '已退出登录', icon: 'success' });
  };

  return (
    <div style={styles.container}>
      {/* 顶部导航 */}
      <NavBar
        style={styles.navbar}
        back={null}
        right={
          <SetOutline
            style={styles.settingsIcon}
            onClick={handleLogout}
          />
        }
      >
        <div style={styles.navTitle}>
          <span>Mind Shot</span>
          {user && (
            <span style={styles.username}>@{user.username}</span>
          )}
        </div>
      </NavBar>

      {/* 消息列表 */}
      <div style={styles.messageList}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <DotLoading color="primary" />
            <span style={styles.loadingText}>加载中...</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}>💭</div>
            <p style={styles.emptyText}>还没有消息</p>
            <p style={styles.emptyHint}>试着发送一条消息吧</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onClick={() => handleMessageClick(msg)}
              />
            ))}
            {sending && (
              <div style={styles.thinkingBubble}>
                <DotLoading color="#999" />
                <span style={styles.thinkingText}>Agent 正在思考...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入栏 */}
      <InputBar onSend={handleSend} disabled={sending} />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={!!selectedMessage}
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ededed',
  },
  navbar: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e8e8e8',
    '--height': '50px',
  },
  navTitle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    lineHeight: 1.2,
  },
  username: {
    fontSize: '11px',
    color: '#999',
    fontWeight: 'normal',
  },
  settingsIcon: {
    fontSize: '22px',
    color: '#666',
    cursor: 'pointer',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    paddingBottom: '20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: '#999',
  },
  loadingText: {
    marginTop: '12px',
    fontSize: '14px',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
  },
  emptyIcon: {
    fontSize: '60px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 8px 0',
  },
  emptyHint: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  thinkingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: 'fit-content',
    marginBottom: '12px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  thinkingText: {
    fontSize: '13px',
    color: '#999',
  },
};

export default ChatPage;
