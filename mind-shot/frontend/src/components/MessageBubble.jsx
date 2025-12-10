import React from 'react';

const MessageBubble = ({ message, onClick }) => {
  const isUser = message.role === 'user';
  const isRichCard = message.message_type === 'rich_card';
  const metadata = message.metadata || {};

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 获取卡片类型图标
  const getCardIcon = (cardType) => {
    const icons = {
      schedule: '📅',
      idea: '💡',
      article: '📄',
      task: '✅',
    };
    return icons[cardType] || '📋';
  };

  return (
    <div
      style={{
        ...styles.container,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {/* 消息气泡 */}
      <div
        onClick={isRichCard ? onClick : undefined}
        style={{
          ...styles.bubble,
          ...(isUser ? styles.userBubble : styles.agentBubble),
          ...(isRichCard ? styles.richCardBubble : {}),
          cursor: isRichCard ? 'pointer' : 'default',
        }}
      >
        {/* 富卡片头部 */}
        {isRichCard && metadata.card_type && (
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>{getCardIcon(metadata.card_type)}</span>
            <span style={styles.cardTitle}>{metadata.title || '详情'}</span>
          </div>
        )}

        {/* 消息内容 */}
        <div style={styles.content}>{message.content}</div>

        {/* 富卡片提示 */}
        {isRichCard && (
          <div style={styles.cardFooter}>
            <span style={styles.tapHint}>点击查看详情 →</span>
          </div>
        )}

        {/* 时间戳 */}
        <div style={{
          ...styles.timestamp,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    marginBottom: '12px',
    padding: '0 4px',
  },
  bubble: {
    maxWidth: '75%',
    minWidth: '60px',
    padding: '10px 14px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  userBubble: {
    backgroundColor: '#95ec69',
    borderTopRightRadius: '4px',
  },
  agentBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: '4px',
  },
  richCardBubble: {
    borderLeft: '3px solid #1677ff',
    paddingLeft: '12px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid #f0f0f0',
  },
  cardIcon: {
    fontSize: '18px',
    marginRight: '8px',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1677ff',
  },
  content: {
    fontSize: '15px',
    lineHeight: '1.5',
    color: '#333',
    wordBreak: 'break-word',
  },
  cardFooter: {
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #f0f0f0',
  },
  tapHint: {
    fontSize: '12px',
    color: '#1677ff',
  },
  timestamp: {
    fontSize: '11px',
    color: '#999',
    marginTop: '6px',
  },
};

export default MessageBubble;
