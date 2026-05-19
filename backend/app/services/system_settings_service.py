from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.system_settings import SystemSettings
from app.repositories.system_settings_repo import SystemSettingsRepository
from app.schemas.system_settings import (
    NewsConfig,
    ResearchCenterConfig,
    SystemConfig,
)


DEFAULT_CATEGORIES: list[dict] = [
    {
        "category": "research_center",
        "label": "研报中心配置",
        "description": "管理研报生成的 LLM 参数、分析师选择、辩论轮次等核心配置",
        "config": ResearchCenterConfig().model_dump(),
    },
    {
        "category": "news",
        "label": "新闻资讯配置",
        "description": "管理新闻数据源的抓取频率、分类过滤、情感分析等配置",
        "config": NewsConfig().model_dump(),
    },
    {
        "category": "system",
        "label": "系统配置",
        "description": "管理应用名称、仓位限制、风控参数、会话超时等全局系统配置",
        "config": SystemConfig().model_dump(),
    },
]

CATEGORY_SCHEMA_MAP: dict[str, type] = {
    "research_center": ResearchCenterConfig,
    "news": NewsConfig,
    "system": SystemConfig,
}


class SystemSettingsService:
    def __init__(self, db: Session):
        self.repo = SystemSettingsRepository(db)

    def list_categories(self) -> list[SystemSettings]:
        rows = self.repo.list_all()
        if not rows:
            self._seed_defaults()
            rows = self.repo.list_all()
        return rows

    def get_category(self, category: str) -> SystemSettings | None:
        row = self.repo.get_by_category(category)
        if row is None and category in CATEGORY_SCHEMA_MAP:
            self._seed_defaults()
            row = self.repo.get_by_category(category)
        return row

    def update_category(self, category: str, config: dict, user_id: int) -> SystemSettings:
        row = self.repo.get_by_category(category)
        if row is None:
            raise ValueError(f"配置分类不存在: {category}")

        schema_cls = CATEGORY_SCHEMA_MAP.get(category)
        if schema_cls:
            validated = schema_cls(**config)
            merged = validated.model_dump()
        else:
            merged = config

        row.config = merged
        row.updated_by = user_id
        row.updated_at = datetime.utcnow()
        return self.repo.save(row)

    def reset_category(self, category: str) -> SystemSettings:
        row = self.repo.get_by_category(category)
        if row is None:
            raise ValueError(f"配置分类不存在: {category}")

        for default in DEFAULT_CATEGORIES:
            if default["category"] == category:
                row.config = default["config"]
                row.updated_by = None
                row.updated_at = datetime.utcnow()
                return self.repo.save(row)

        raise ValueError(f"无法重置未知分类: {category}")

    def _seed_defaults(self) -> None:
        for default in DEFAULT_CATEGORIES:
            existing = self.repo.get_by_category(default["category"])
            if existing is None:
                self.repo.create(**default)
