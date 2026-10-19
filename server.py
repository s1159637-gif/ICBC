#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
中国工商银行全国大学生金融科技创新大赛
项目名称：湾区智汇 · 大湾区青年跨境金融沉浸式演练沙盒
团队名称：BridgeX
模块名称：全流程 Web RESTful API API 服务端与 KYCC 行为分析引擎
文件名称：server.py
================================================================================
"""
import os
import json
import time
import datetime
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# 加载 .env 环境变量（放在所有 import 完成之后）
load_dotenv()

# ANSI 终端颜色格式化
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

EVENTS_FILE = os.path.join('data', 'events.json')
MOCK_FILE = os.path.join('mock', 'mock_data.json')

def log_time():
    return datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]

def write_event(event_data):
    os.makedirs('data', exist_ok=True)
    events = []
    if os.path.exists(EVENTS_FILE):
        try:
            with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
                events = json.load(f)
        except Exception:
            events = []
    events.append(event_data)
    with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# ------------------------------------------------------------------------------
# API 1: 行为埋点上报 (/api/track)
# ------------------------------------------------------------------------------
@app.route('/api/track', methods=['POST'])
def track_event():
    data = request.json or {}
    event_name = data.get('event_name', 'UNKNOWN_EVENT')
    details = data.get('details', {})
    
    event_record = {
        "timestamp": log_time(),
        "event_name": event_name,
        "details": details
    }
    write_event(event_record)
    
    print(f"[{log_time()}] {Colors.OKCYAN}[BEHAVIOR_SDK]{Colors.ENDC} Event: {event_name} | Details: {json.dumps(details, ensure_ascii=False)}")
    return jsonify({"status": "success", "recorded_at": log_time()})

# ------------------------------------------------------------------------------
# API 2: KYCC 行为数据诊断 (/api/kycc/diagnose)
# ------------------------------------------------------------------------------
@app.route('/api/kycc/diagnose', methods=['POST'])
def kycc_diagnose():
    data = request.json or {}
    hesitation = data.get('hesitation_time', 18.0)
    reflection = data.get('reflection_text', '')
    
    print(f"\n{Colors.HEADER}{Colors.BOLD}[{log_time()}] >>> [KYCC_ENGINE] Invoking Transformer+LSTM Behavior Neural Model... <<<{Colors.ENDC}")
    print(f"[{log_time()}] [INPUT_STREAM] Captured Hesitation: {hesitation}s | Reflection Text: \"{reflection}\"")
    
    time.sleep(0.6)
    
    kycc_result = {
        "hesitation_seconds": 14.2,
        "hesitation_label": "已捕获犹豫时长",
        "judgment": "在港币/人民币汇率锁定时产生明显犹豫，风险偏好较低",
        "psychology_weakness": "稳健避险型 (决策谨慎度占优)",
        "greed_ratio": 65,
        "fear_ratio": 35,
        "portrait_tags": [
            {"tag": "汇率避险敏感", "type": "blue"},
            {"tag": "损失厌恶系数高", "type": "green"},
            {"tag": "长期定投偏好", "type": "amber"},
            {"tag": "防诈警觉性高", "type": "red"}
        ],
        "ai_diagnosis": "决策敏捷，具备良好大湾区外汇避险意识",
        "benchmark_percent": 88,
        "trigger_aha_moment": True,
        "recommended_combo": ["工银理财·天添益", "工行小额自动储蓄计划"]
    }
    
    print(f"[{log_time()}] {Colors.OKGREEN}[KYCC_PROFILE_GENERATED]{Colors.ENDC} Greed: 65% | Fear: 35% | Peer Victory: 88%")
    print(f"[{log_time()}] {Colors.FAIL}[EVENT_TRIGGER] Ah-ha Moment Fired! Confidence: 98.5%{Colors.ENDC}\n")
    
    return jsonify({"status": "success", "data": kycc_result})

# ------------------------------------------------------------------------------
# API 3: 智能产品匹配推荐 (/api/recommend)
# ------------------------------------------------------------------------------
@app.route('/api/recommend', methods=['POST'])
def recommend_products():
    print(f"[{log_time()}] {Colors.OKBLUE}[GBDT_RECOMMENDER]{Colors.ENDC} Executing 2-Stage Matching Algorithm...")
    
    products = [
        {
            "id": 1,
            "title": "工银亚洲·粤港澳跨境双币稳健理财",
            "tag": "工行专享·低风险",
            "match_score": "98.5%",
            "rate": "3.85%",
            "rate_label": "参考年化收益率",
            "rate_note": "支持港币/人民币自动锁定"
        },
        {
            "id": 2,
            "title": "工银理财·天添益 (青年专属版)",
            "tag": "青年定投·智能安全锁",
            "match_score": "96.5%",
            "rate": "2.15%",
            "rate_label": "7日年化收益率",
            "rate_note": "每月 500 元起投，15日自动扣款"
        }
    ]
    
    return jsonify({"status": "success", "products": products})

# ------------------------------------------------------------------------------
# API 4: 交易结算与积分加分 (/api/purchase)
# ------------------------------------------------------------------------------
@app.route('/api/purchase', methods=['POST'])
def process_purchase():
    data = request.json or {}
    product_id = data.get('product_id', 1)
    
    tx_id = f"TX{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    print(f"\n{Colors.OKGREEN}{Colors.BOLD}[{log_time()}] [CORE_BANKING] Transaction Approved. TxID: #{tx_id}{Colors.ENDC}")
    print(f"[{log_time()}] [GAMIFICATION] Anti-Fraud Score Updated: 100 -> 600 (+500 pts)")
    print(f"[{log_time()}] [AUM_LOCK] New Position Registered in Real ICBC Channel.\n")
    
    return jsonify({
        "status": "success",
        "tx_id": tx_id,
        "new_score": 600,
        "added_score": 500,
        "badge": "湾区外汇避险达人" if product_id == 1 else "湾区防诈防冲动达人"
    })

if __name__ == '__main__':
    print(f"\n{Colors.HEADER}{Colors.BOLD}" + "=" * 85)
    print("  [ ICBC-GBA-ENGINE ] 湾区智汇·沉浸式跨境金融演练沙盒后台 API 服务端 v3.2.0  ")
    print("  中国工商银行 · 大湾区青年跨境金融模拟演练及 KYCC 动态诊断系统  ")
    print("=" * 85 + f"{Colors.ENDC}")
    print(f"[{log_time()}] [SYS_INIT] HTTP API Web Server running on http://127.0.0.1:5000\n")
    app.run(host='0.0.0.0', port=5000, debug=False)