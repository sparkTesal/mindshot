"""
Mind Shot MVP 数据模型
使用 SQLite 数据库
"""
import sqlite3
import json
from datetime import datetime
from contextlib import contextmanager

DATABASE_PATH = 'mindshot.db'


@contextmanager
def get_db():
    """获取数据库连接的上下文管理器"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """初始化数据库表"""
    with get_db() as conn:
        c = conn.cursor()
        
        # 用户表
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        
        # 消息表
        c.execute('''CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text',
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )''')
        
        # 附件表
        c.execute('''CREATE TABLE IF NOT EXISTS attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            file_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES messages (id)
        )''')
        
        conn.commit()


class User:
    """用户模型"""
    
    @staticmethod
    def create(username: str, password_hash: str) -> int:
        """创建用户，返回用户ID"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute(
                'INSERT INTO users (username, password_hash) VALUES (?, ?)',
                (username, password_hash)
            )
            conn.commit()
            return c.lastrowid
    
    @staticmethod
    def get_by_username(username: str) -> dict | None:
        """根据用户名获取用户"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE username = ?', (username,))
            row = c.fetchone()
            return dict(row) if row else None
    
    @staticmethod
    def get_by_id(user_id: int) -> dict | None:
        """根据ID获取用户"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            row = c.fetchone()
            return dict(row) if row else None


class Message:
    """消息模型"""
    
    @staticmethod
    def create(user_id: int, role: str, content: str, 
               message_type: str = 'text', metadata: dict = None) -> int:
        """创建消息，返回消息ID"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute(
                '''INSERT INTO messages (user_id, role, content, message_type, metadata) 
                   VALUES (?, ?, ?, ?, ?)''',
                (user_id, role, content, message_type, 
                 json.dumps(metadata) if metadata else None)
            )
            conn.commit()
            return c.lastrowid
    
    @staticmethod
    def get_by_user(user_id: int, limit: int = 100) -> list:
        """获取用户的消息列表"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute(
                '''SELECT * FROM messages 
                   WHERE user_id = ? 
                   ORDER BY created_at ASC
                   LIMIT ?''',
                (user_id, limit)
            )
            messages = []
            for row in c.fetchall():
                msg = dict(row)
                # 解析 metadata JSON
                if msg.get('metadata'):
                    try:
                        msg['metadata'] = json.loads(msg['metadata'])
                    except json.JSONDecodeError:
                        pass
                messages.append(msg)
            return messages
    
    @staticmethod
    def get_by_id(message_id: int) -> dict | None:
        """根据ID获取消息"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute('SELECT * FROM messages WHERE id = ?', (message_id,))
            row = c.fetchone()
            if row:
                msg = dict(row)
                if msg.get('metadata'):
                    try:
                        msg['metadata'] = json.loads(msg['metadata'])
                    except json.JSONDecodeError:
                        pass
                return msg
            return None
    
    @staticmethod
    def get_by_ids(message_ids: list) -> list:
        """根据ID列表获取消息"""
        if not message_ids:
            return []
        with get_db() as conn:
            c = conn.cursor()
            placeholders = ','.join('?' * len(message_ids))
            c.execute(
                f'SELECT * FROM messages WHERE id IN ({placeholders}) ORDER BY created_at ASC',
                message_ids
            )
            messages = []
            for row in c.fetchall():
                msg = dict(row)
                if msg.get('metadata'):
                    try:
                        msg['metadata'] = json.loads(msg['metadata'])
                    except json.JSONDecodeError:
                        pass
                messages.append(msg)
            return messages


class Attachment:
    """附件模型"""
    
    @staticmethod
    def create(message_id: int, file_name: str, file_url: str) -> int:
        """创建附件，返回附件ID"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute(
                '''INSERT INTO attachments (message_id, file_name, file_url) 
                   VALUES (?, ?, ?)''',
                (message_id, file_name, file_url)
            )
            conn.commit()
            return c.lastrowid
    
    @staticmethod
    def get_by_message(message_id: int) -> list:
        """获取消息的附件列表"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute(
                'SELECT * FROM attachments WHERE message_id = ?',
                (message_id,)
            )
            return [dict(row) for row in c.fetchall()]
