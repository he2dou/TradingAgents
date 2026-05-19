"""add news tables

Revision ID: 0007_add_news_tables
Revises: 0006_add_research_jobs
Create Date: 2026-05-19 10:20:00
"""

from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0007_add_news_tables"
down_revision: Union[str, None] = "0006_add_research_jobs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "news_items",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=128), nullable=False),
        sa.Column("source_url", sa.String(length=512), nullable=True),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("impact", sa.String(length=8), nullable=False),
        sa.Column("symbols_json", sa.JSON(), nullable=False),
        sa.Column("tags_json", sa.JSON(), nullable=False),
        sa.Column("sentiment", sa.String(length=16), nullable=True),
        sa.Column("source_score", sa.Float(), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_news_items_title", "news_items", ["title"])
    op.create_index("ix_news_items_source", "news_items", ["source"])
    op.create_index("ix_news_items_category", "news_items", ["category"])
    op.create_index("ix_news_items_impact", "news_items", ["impact"])
    op.create_index("ix_news_items_published_at", "news_items", ["published_at"])

    op.create_table(
        "news_user_states",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("news_id", sa.String(length=64), sa.ForeignKey("news_items.id"), nullable=False),
        sa.Column("is_bookmarked", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("user_id", "news_id", name="uq_news_user_state"),
    )
    op.create_index("ix_news_user_states_user_id", "news_user_states", ["user_id"])
    op.create_index("ix_news_user_states_news_id", "news_user_states", ["news_id"])

    news_items = sa.table(
        "news_items",
        sa.column("id", sa.String),
        sa.column("title", sa.String),
        sa.column("summary", sa.Text),
        sa.column("content", sa.Text),
        sa.column("source", sa.String),
        sa.column("source_url", sa.String),
        sa.column("category", sa.String),
        sa.column("impact", sa.String),
        sa.column("symbols_json", sa.JSON),
        sa.column("tags_json", sa.JSON),
        sa.column("sentiment", sa.String),
        sa.column("source_score", sa.Float),
        sa.column("published_at", sa.DateTime),
    )
    op.bulk_insert(
        news_items,
        [
            {
                "id": "NEWS-001",
                "title": "BTC 短线突破 64,000 USDT，现货成交量同步放大",
                "summary": "BTC 在亚洲交易时段突破关键整数位，主动买盘增强，短线波动率回升。",
                "content": "BTC 在亚洲交易时段突破关键整数位，主动买盘增强，短线波动率回升。成交量同步放大，说明价格突破并非孤立波动，后续需关注能否站稳关键价位并带动主流币跟涨。",
                "source": "Market Watch",
                "source_url": None,
                "category": "市场快讯",
                "impact": "高",
                "symbols_json": ["BTC/USDT"],
                "tags_json": ["BTC", "放量突破", "短线波动"],
                "sentiment": "positive",
                "source_score": 88.0,
                "published_at": datetime(2026, 5, 11, 10, 18, 0),
            },
            {
                "id": "NEWS-002",
                "title": "某主流交易所发布合约保证金阶梯调整公告",
                "summary": "公告涉及 BTC、ETH、SOL 多个合约交易对，部分高杠杆档位维持保证金上调。",
                "content": "某主流交易所更新了合约保证金阶梯规则，BTC、ETH、SOL 多个交易对的高杠杆档位保证金要求上调。此举通常意味着平台对短线波动和风险敞口更为谨慎。",
                "source": "Exchange Notice",
                "source_url": None,
                "category": "交易所公告",
                "impact": "中",
                "symbols_json": ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
                "tags_json": ["交易所", "杠杆", "保证金"],
                "sentiment": "neutral",
                "source_score": 91.0,
                "published_at": datetime(2026, 5, 11, 9, 50, 0),
            },
            {
                "id": "NEWS-003",
                "title": "ETH 链上 Gas 费用回落，DeFi 交互活跃度小幅恢复",
                "summary": "链上数据显示 DEX 交易和借贷协议交互次数回升，但整体资金流入仍偏温和。",
                "content": "ETH 链上 Gas 费用回落后，DeFi 用户交互次数有所改善，DEX 与借贷协议活跃度小幅恢复。当前信号偏中性偏多，但仍需观察持续性。",
                "source": "On-chain Daily",
                "source_url": None,
                "category": "项目动态",
                "impact": "中",
                "symbols_json": ["ETH/USDT"],
                "tags_json": ["ETH", "DeFi", "链上活跃"],
                "sentiment": "positive",
                "source_score": 84.0,
                "published_at": datetime(2026, 5, 11, 9, 12, 0),
            },
            {
                "id": "NEWS-004",
                "title": "多地监管机构提示高杠杆加密衍生品风险",
                "summary": "监管提示强调投资者需关注保证金、强平机制与极端波动风险。",
                "content": "多地监管机构同步提示高杠杆加密衍生品存在极端波动与强平风险，强调平台适当性管理与投资者教育。该信息通常会在短期压制高风险偏好交易。",
                "source": "Regulation Wire",
                "source_url": None,
                "category": "政策监管",
                "impact": "高",
                "symbols_json": ["BTC/USDT", "ETH/USDT"],
                "tags_json": ["监管", "杠杆", "风险提示"],
                "sentiment": "negative",
                "source_score": 94.0,
                "published_at": datetime(2026, 5, 10, 22, 30, 0),
            },
            {
                "id": "NEWS-005",
                "title": "美元指数小幅走弱，风险资产情绪边际改善",
                "summary": "美元指数回落带动市场风险偏好改善，加密资产与美股科技板块同步反弹。",
                "content": "美元指数小幅走弱带动市场风险偏好改善，风险资产整体表现回暖。加密市场与美股科技板块联动增强，宏观流动性情绪对价格形成支撑。",
                "source": "Macro Lens",
                "source_url": None,
                "category": "宏观财经",
                "impact": "中",
                "symbols_json": ["BTC/USDT"],
                "tags_json": ["美元指数", "宏观", "风险偏好"],
                "sentiment": "positive",
                "source_score": 82.0,
                "published_at": datetime(2026, 5, 10, 20, 5, 0),
            },
            {
                "id": "NEWS-006",
                "title": "SOL 生态 Meme 交易热度回升，短线资金分歧加大",
                "summary": "SOL 链上交易活跃，但高频资金撤退速度也较快，需警惕短线回撤。",
                "content": "SOL 生态 Meme 交易热度回升，链上活跃和交易量同步走高，但高频资金切换速度也明显加快。短线情绪驱动增强，回撤风险同样上升。",
                "source": "Crypto Pulse",
                "source_url": None,
                "category": "市场快讯",
                "impact": "低",
                "symbols_json": ["SOL/USDT"],
                "tags_json": ["SOL", "Meme", "短线分歧"],
                "sentiment": "neutral",
                "source_score": 76.0,
                "published_at": datetime(2026, 5, 10, 18, 42, 0),
            },
            {
                "id": "NEWS-007",
                "title": "稳定币供应量连续三周增长，场内流动性维持改善",
                "summary": "稳定币总供应持续增长，为加密市场风险偏好提供流动性基础。",
                "content": "稳定币总供应量连续三周增长，通常意味着场内流动性环境维持改善。对于加密市场而言，这类信号往往与风险资产承接能力增强有关。",
                "source": "Stablecoin Monitor",
                "source_url": None,
                "category": "宏观财经",
                "impact": "高",
                "symbols_json": ["BTC/USDT", "ETH/USDT"],
                "tags_json": ["稳定币", "流动性", "宏观"],
                "sentiment": "positive",
                "source_score": 86.0,
                "published_at": datetime(2026, 5, 9, 16, 15, 0),
            },
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_news_user_states_news_id", table_name="news_user_states")
    op.drop_index("ix_news_user_states_user_id", table_name="news_user_states")
    op.drop_table("news_user_states")

    op.drop_index("ix_news_items_published_at", table_name="news_items")
    op.drop_index("ix_news_items_impact", table_name="news_items")
    op.drop_index("ix_news_items_category", table_name="news_items")
    op.drop_index("ix_news_items_source", table_name="news_items")
    op.drop_index("ix_news_items_title", table_name="news_items")
    op.drop_table("news_items")
