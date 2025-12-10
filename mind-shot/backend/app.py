"""
Mind Shot MVP 后端应用
Flask 单应用实现
"""
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, 
    jwt_required, get_jwt_identity
)
import hashlib
import json
import os
from datetime import datetime

from config import (
    SECRET_KEY, JWT_SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRES,
    UPLOAD_FOLDER, MAX_CONTENT_LENGTH, CORS_ORIGINS
)
from models import init_db, User, Message, Attachment

# 创建 Flask 应用
app = Flask(__name__)

# 配置
app.config['SECRET_KEY'] = SECRET_KEY
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = JWT_ACCESS_TOKEN_EXPIRES
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# 初始化扩展
CORS(app, origins=CORS_ORIGINS, supports_credentials=True)
jwt = JWTManager(app)

# 确保上传目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def hash_password(password: str) -> str:
    """密码哈希"""
    return hashlib.sha256(password.encode()).hexdigest()


def get_agent_response(user_input: str) -> dict:
    """
    简单的 Agent 逻辑（Mock 版本）
    后续可以接入真实的 LLM API
    """
    user_input_lower = user_input.lower()
    
    # 日程/提醒相关
    if any(keyword in user_input for keyword in ['提醒', '日程', '日历', '安排']):
        return {
            'content': '📅 好的，我已经帮你记下了！',
            'type': 'rich_card',
            'metadata': {
                'card_type': 'schedule',
                'title': '日程提醒',
                'description': user_input,
                'actions': ['添加到日历', '设置提醒', '归档']
            }
        }
    
    # 灵感/想法相关
    elif any(keyword in user_input for keyword in ['想做', '灵感', '想法', '创意', '点子']):
        return {
            'content': '💡 关于这个想法，我整理了一些思路',
            'type': 'rich_card',
            'metadata': {
                'card_type': 'idea',
                'title': '灵感收集',
                'description': user_input,
                'actions': ['继续完善', '转为待办', '归档']
            }
        }
    
    # 链接/文章相关
    elif any(keyword in user_input for keyword in ['http', 'www', '文章', '链接', '网址']):
        return {
            'content': '📄 链接已收藏，稍后我会帮你整理摘要',
            'type': 'rich_card',
            'metadata': {
                'card_type': 'article',
                'title': '文章收藏',
                'description': user_input,
                'actions': ['查看摘要', '原文链接', '归档']
            }
        }
    
    # 任务/待办相关
    elif any(keyword in user_input for keyword in ['任务', '待办', '要做', '需要']):
        return {
            'content': '✅ 任务已记录，我会帮你跟进',
            'type': 'rich_card',
            'metadata': {
                'card_type': 'task',
                'title': '待办任务',
                'description': user_input,
                'actions': ['标记完成', '设置截止日期', '归档']
            }
        }
    
    # 默认回复
    else:
        return {
            'content': f'收到："{user_input}"。我正在理解你的意图...',
            'type': 'text',
            'metadata': None
        }


# ============ 路由 ============

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({'status': 'ok', 'message': 'Mind Shot API is running'}), 200


@app.route('/api/register', methods=['POST'])
def register():
    """用户注册"""
    data = request.json
    
    if not data:
        return jsonify({'error': '请求数据为空'}), 400
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    if len(username) < 2 or len(username) > 20:
        return jsonify({'error': '用户名长度应为 2-20 个字符'}), 400
    
    if len(password) < 6:
        return jsonify({'error': '密码长度至少 6 个字符'}), 400
    
    # 检查用户名是否已存在
    existing_user = User.get_by_username(username)
    if existing_user:
        return jsonify({'error': '用户名已存在'}), 400
    
    # 创建用户
    password_hash = hash_password(password)
    try:
        user_id = User.create(username, password_hash)
        return jsonify({
            'message': '注册成功',
            'user_id': user_id
        }), 201
    except Exception as e:
        return jsonify({'error': f'注册失败: {str(e)}'}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.json
    
    if not data:
        return jsonify({'error': '请求数据为空'}), 400
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    # 验证用户
    user = User.get_by_username(username)
    if not user:
        return jsonify({'error': '用户名或密码错误'}), 401
    
    password_hash = hash_password(password)
    if user['password_hash'] != password_hash:
        return jsonify({'error': '用户名或密码错误'}), 401
    
    # 生成 token
    token = create_access_token(identity=user['id'])
    
    return jsonify({
        'message': '登录成功',
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username']
        }
    }), 200


@app.route('/api/messages', methods=['GET'])
@jwt_required()
def get_messages():
    """获取消息列表"""
    user_id = get_jwt_identity()
    
    # 获取分页参数
    limit = request.args.get('limit', 100, type=int)
    limit = min(limit, 500)  # 最多返回 500 条
    
    messages = Message.get_by_user(user_id, limit)
    
    return jsonify({
        'messages': messages,
        'count': len(messages)
    }), 200


@app.route('/api/messages', methods=['POST'])
@jwt_required()
def send_message():
    """发送消息（同步处理）"""
    user_id = get_jwt_identity()
    data = request.json
    
    if not data:
        return jsonify({'error': '请求数据为空'}), 400
    
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': '消息内容不能为空'}), 400
    
    # 1. 保存用户消息
    user_msg_id = Message.create(
        user_id=user_id,
        role='user',
        content=content,
        message_type='text'
    )
    
    # 2. 获取 Agent 回复
    agent_response = get_agent_response(content)
    
    # 3. 保存 Agent 消息
    agent_msg_id = Message.create(
        user_id=user_id,
        role='agent',
        content=agent_response['content'],
        message_type=agent_response['type'],
        metadata=agent_response.get('metadata')
    )
    
    # 4. 返回新消息
    new_messages = Message.get_by_ids([user_msg_id, agent_msg_id])
    
    return jsonify({
        'messages': new_messages
    }), 201


@app.route('/api/messages/<int:message_id>', methods=['GET'])
@jwt_required()
def get_message_detail(message_id):
    """获取消息详情"""
    user_id = get_jwt_identity()
    
    message = Message.get_by_id(message_id)
    if not message:
        return jsonify({'error': '消息不存在'}), 404
    
    if message['user_id'] != user_id:
        return jsonify({'error': '无权访问此消息'}), 403
    
    # 获取附件
    attachments = Attachment.get_by_message(message_id)
    message['attachments'] = attachments
    
    return jsonify({'message': message}), 200


@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """上传文件"""
    if 'file' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '文件名为空'}), 400
    
    # 生成安全的文件名
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    original_filename = file.filename
    safe_filename = f"{timestamp}_{original_filename}"
    
    # 保存文件
    filepath = os.path.join(UPLOAD_FOLDER, safe_filename)
    file.save(filepath)
    
    # 返回文件 URL
    file_url = f'/uploads/{safe_filename}'
    
    return jsonify({
        'url': file_url,
        'filename': original_filename
    }), 201


@app.route('/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    """提供上传文件的访问"""
    return send_from_directory(UPLOAD_FOLDER, filename)


# ============ 错误处理 ============

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': '资源不存在'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': '服务器内部错误'}), 500


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token 已过期，请重新登录'}), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': '无效的 Token'}), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': '请先登录'}), 401


# ============ 启动应用 ============

if __name__ == '__main__':
    # 初始化数据库
    init_db()
    print("✅ 数据库初始化完成")
    print("🚀 Mind Shot API 启动中...")
    print("📍 访问地址: http://localhost:5000")
    
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )
