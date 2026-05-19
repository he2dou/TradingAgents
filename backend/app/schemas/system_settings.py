from pydantic import BaseModel, Field


class ResearchCenterConfig(BaseModel):
    llm_provider: str = Field(default="deepseek", description="LLM 提供商")
    quick_think_llm: str = Field(default="deepseek-v4-flash", description="快速思考模型")
    deep_think_llm: str = Field(default="deepseek-v4-pro", description="深度思考模型")
    max_debate_rounds: int = Field(default=1, ge=1, le=5, description="最大辩论轮数")
    max_risk_discuss_rounds: int = Field(default=1, ge=1, le=5, description="最大风险讨论轮数")
    checkpoint_enabled: bool = Field(default=True, description="启用检查点恢复")
    default_analysts: list[str] = Field(
        default_factory=lambda: ["market", "news", "fundamentals"],
        description="默认分析师列表",
    )
    output_language: str = Field(default="Chinese", description="输出语言")
    generation_timeout_seconds: int = Field(default=1800, ge=60, description="生成超时(秒)")


class NewsConfig(BaseModel):
    auto_fetch_enabled: bool = Field(default=True, description="启用自动抓取")
    fetch_interval_minutes: int = Field(default=30, ge=5, description="抓取间隔(分钟)")
    max_news_per_fetch: int = Field(default=50, ge=1, le=200, description="每次最大抓取数")
    default_category: str = Field(default="all", description="默认分类")
    sentiment_analysis_enabled: bool = Field(default=True, description="启用情感分析")
    impact_filter: str = Field(default="all", description="影响级别过滤")
    retention_days: int = Field(default=90, ge=1, description="新闻保留天数")


class SystemConfig(BaseModel):
    app_name: str = Field(default="TradingAgents", description="应用名称")
    log_level: str = Field(default="INFO", description="日志级别")
    max_single_position_pct: float = Field(default=0.05, ge=0.01, le=1.0, description="单仓位最大占比")
    max_total_exposure_pct: float = Field(default=0.30, ge=0.01, le=1.0, description="总敞口最大占比")
    max_daily_new_positions: int = Field(default=5, ge=1, description="每日最大新建仓数")
    kill_switch_enabled: bool = Field(default=False, description="紧急止损开关")
    maintenance_mode: bool = Field(default=False, description="维护模式")
    session_timeout_minutes: int = Field(default=60, ge=5, description="会话超时(分钟)")


class SettingsCategoryItem(BaseModel):
    category: str
    label: str
    description: str | None = None
    updated_at: str
    updated_by: int | None = None


class SettingsCategoryDetail(BaseModel):
    category: str
    label: str
    description: str | None = None
    config: dict
    updated_at: str
    updated_by: int | None = None


class SettingsUpdateRequest(BaseModel):
    config: dict
