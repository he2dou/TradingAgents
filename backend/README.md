# backend

`backend` 是本仓库中的自动交易系统后端原型，负责承接 `tradingagents` 产出的研究信号，并完成：

- signal ingest
- risk evaluate
- paper order submit
- cash ledger update
- portfolio snapshot
- audit event logging

当前阶段采用：

- FastAPI
- SQLite
- Alembic
- Paper Broker

## 本地启动

默认在仓库根目录执行。

### 1. 创建虚拟环境

```bash
python3 -m venv backend/.venv
```

### 2. 安装依赖

```bash
backend/.venv/bin/python -m pip install -e ./backend
```

### 3. 执行数据库迁移

```bash
cd backend
python -m alembic upgrade head
```

### 4. 启动服务

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8010
```

如果前端运行在 `5173`、`3000` 或 `4173` 端口，当前后端默认已经允许这些本地来源跨域访问。

### 5. 健康检查

```bash
curl -i http://127.0.0.1:8010/health
```

返回 `200` 和 `{"status":"ok"}` 之后，再打开前端页面。

## 接口验证顺序

### 初始化默认账户

```bash
curl -s -X POST http://127.0.0.1:8010/v1/accounts/bootstrap
```

### 注入研究信号

```bash
curl -s -X POST http://127.0.0.1:8010/v1/signals/ingest \
  -H 'Content-Type: application/json' \
  -d '{
    "run_id": "run_001",
    "symbol": "NVDA",
    "as_of_date": "2026-05-10",
    "signal": "BUY",
    "confidence": 0.74,
    "suggested_position_pct": 0.03,
    "time_horizon_days": 5,
    "thesis": "AI demand remains strong",
    "risks": ["valuation stretched", "earnings volatility"],
    "invalidators": ["guidance cut"],
    "evidence": {
      "market": "trend intact",
      "news": "AI demand remains strong",
      "fundamentals": "revenue momentum healthy",
      "sentiment": "constructive"
    }
  }'
```

### 执行风险审核

```bash
curl -s -X POST http://127.0.0.1:8010/v1/risk/evaluate/1
```

### 提交 paper order

```bash
curl -s -X POST http://127.0.0.1:8010/v1/orders/submit/1
```

### 查看组合

```bash
curl -s http://127.0.0.1:8010/v1/portfolio
```
