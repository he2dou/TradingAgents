from pydantic import BaseModel, Field


class NewsListItem(BaseModel):
    id: str
    title: str
    summary: str
    source: str
    source_url: str | None = None
    category: str
    impact: str
    symbols: list[str] = Field(default_factory=list)
    published_at: str
    is_read: bool = False
    is_bookmarked: bool = False


class NewsDetail(NewsListItem):
    content: str | None = None
    sentiment: str | None = None
    source_score: float | None = None
    tags: list[str] = Field(default_factory=list)


class NewsListResponse(BaseModel):
    items: list[NewsListItem] = Field(default_factory=list)
    total: int
    page: int
    page_size: int


class NewsStateResponse(BaseModel):
    news_id: str
    is_read: bool
    is_bookmarked: bool
    read_at: str | None = None
