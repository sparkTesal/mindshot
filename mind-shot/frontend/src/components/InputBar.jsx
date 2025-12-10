import React, { useState, useRef } from 'react';
import { Input, Button, Toast } from 'antd-mobile';
import { AddOutline, SendOutline } from 'antd-mobile-icons';

const InputBar = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  // 处理发送
  const handleSend = () => {
    const content = input.trim();
    if (!content) {
      Toast.show({ content: '请输入内容', position: 'center' });
      return;
    }
    
    onSend(content);
    setInput('');
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    // 按下回车键发送（不是 Shift+Enter）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理附件按钮点击（预留功能）
  const handleAttachment = () => {
    Toast.show({ 
      content: '附件功能开发中...', 
      position: 'center',
      duration: 1500 
    });
  };

  return (
    <div style={styles.container}>
      {/* 附件按钮 */}
      <div style={styles.attachButton} onClick={handleAttachment}>
        <AddOutline style={styles.attachIcon} />
      </div>

      {/* 输入框 */}
      <div style={styles.inputWrapper}>
        <Input
          ref={inputRef}
          placeholder="像发微信一样..."
          value={input}
          onChange={setInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={styles.input}
        />
      </div>

      {/* 发送按钮 */}
      <Button
        color="primary"
        size="small"
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        style={styles.sendButton}
      >
        <SendOutline style={styles.sendIcon} />
      </Button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: '#f7f7f7',
    borderTop: '1px solid #e8e8e8',
  },
  attachButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    border: '1px solid #e8e8e8',
  },
  attachIcon: {
    fontSize: '20px',
    color: '#666',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '6px 16px',
    border: '1px solid #e8e8e8',
  },
  input: {
    '--font-size': '15px',
    '--color': '#333',
    '--placeholder-color': '#999',
  },
  sendButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendIcon: {
    fontSize: '18px',
  },
};

export default InputBar;
