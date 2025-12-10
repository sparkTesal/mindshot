import React from 'react';
import { Popup, Button, Divider, Tag, Toast } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';

const DetailDrawer = ({ visible, message, onClose }) => {
  if (!message) return null;

  const metadata = message.metadata || {};
  const actions = metadata.actions || [];

  // 获取卡片类型配置
  const getCardConfig = (cardType) => {
    const configs = {
      schedule: {
        icon: '📅',
        title: '日程提醒',
        color: '#ff6b6b',
        bgColor: '#fff5f5',
      },
      idea: {
        icon: '💡',
        title: '灵感收集',
        color: '#ffd43b',
        bgColor: '#fffbeb',
      },
      article: {
        icon: '📄',
        title: '文章收藏',
        color: '#339af0',
        bgColor: '#e7f5ff',
      },
      task: {
        icon: '✅',
        title: '待办任务',
        color: '#51cf66',
        bgColor: '#ebfbee',
      },
    };
    return configs[cardType] || {
      icon: '📋',
      title: '详情',
      color: '#868e96',
      bgColor: '#f8f9fa',
    };
  };

  const cardConfig = getCardConfig(metadata.card_type);

  // 处理操作按钮点击
  const handleAction = (action) => {
    Toast.show({
      content: `${action} - 功能开发中...`,
      position: 'center',
      duration: 1500,
    });
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        minHeight: '60vh',
        maxHeight: '85vh',
        overflow: 'auto',
      }}
    >
      <div style={styles.container}>
        {/* 头部 */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>{cardConfig.icon}</span>
            <span style={styles.headerTitle}>{metadata.title || cardConfig.title}</span>
          </div>
          <div style={styles.closeButton} onClick={onClose}>
            <CloseOutline style={styles.closeIcon} />
          </div>
        </div>

        <Divider style={styles.divider} />

        {/* 内容区域 */}
        <div style={styles.content}>
          {/* 主要内容卡片 */}
          <div
            style={{
              ...styles.contentCard,
              backgroundColor: cardConfig.bgColor,
              borderLeft: `4px solid ${cardConfig.color}`,
            }}
          >
            <p style={styles.contentText}>{message.content}</p>
          </div>

          {/* 原始输入 */}
          {metadata.description && (
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>📝 原始输入</h4>
              <div style={styles.descriptionBox}>
                <p style={styles.descriptionText}>{metadata.description}</p>
              </div>
            </div>
          )}

          {/* 标签 */}
          {metadata.card_type && (
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>🏷️ 分类</h4>
              <Tag
                color="primary"
                fill="outline"
                style={styles.tag}
              >
                {cardConfig.title}
              </Tag>
            </div>
          )}

          {/* 时间信息 */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>⏰ 创建时间</h4>
            <p style={styles.timeText}>{formatTime(message.created_at)}</p>
          </div>
        </div>

        <Divider style={styles.divider} />

        {/* 操作按钮区域 */}
        <div style={styles.actionSection}>
          <h4 style={styles.actionTitle}>🎯 后续操作</h4>
          <div style={styles.actionList}>
            {actions.length > 0 ? (
              actions.map((action, index) => (
                <Button
                  key={index}
                  color="primary"
                  fill="outline"
                  size="middle"
                  style={styles.actionButton}
                  onClick={() => handleAction(action)}
                >
                  {action}
                </Button>
              ))
            ) : (
              <p style={styles.noActionText}>暂无可用操作</p>
            )}
          </div>
        </div>

        {/* 底部安全区域 */}
        <div style={styles.safeArea} />
      </div>
    </Popup>
  );
};

const styles = {
  container: {
    padding: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: '24px',
    marginRight: '10px',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  closeIcon: {
    fontSize: '18px',
    color: '#666',
  },
  divider: {
    margin: '12px 0',
  },
  content: {
    marginBottom: '16px',
  },
  contentCard: {
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  contentText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#333',
    margin: 0,
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    margin: '0 0 10px 0',
  },
  descriptionBox: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '8px',
  },
  descriptionText: {
    fontSize: '14px',
    color: '#555',
    margin: 0,
    lineHeight: '1.5',
  },
  tag: {
    fontSize: '12px',
  },
  timeText: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  actionSection: {
    marginTop: '8px',
  },
  actionTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    margin: '0 0 12px 0',
  },
  actionList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  actionButton: {
    borderRadius: '20px',
    fontSize: '14px',
  },
  noActionText: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  safeArea: {
    height: '20px',
  },
};

export default DetailDrawer;
