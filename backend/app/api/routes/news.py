from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_permission
from app.core.db import get_db
from app.models.user import User
from app.schemas.news import NewsDetail, NewsListItem, NewsListResponse, NewsStateResponse
from app.services.news_service import NewsDetailRecord, NewsListItemRecord, NewsService, NewsStateRecord


router = APIRouter(prefix="/v1/news", tags=["news"])


def serialize_news_list_item(item: NewsListItemRecord) -> NewsListItem:
    return NewsListItem(
        id=item.id,
        title=item.title,
        summary=item.summary,
        source=item.source,
        source_url=item.source_url,
        category=item.category,
        impact=item.impact,
        symbols=item.symbols,
        published_at=item.published_at,
        is_read=item.is_read,
        is_bookmarked=item.is_bookmarked,
    )


def serialize_news_detail(item: NewsDetailRecord) -> NewsDetail:
    return NewsDetail(
        **serialize_news_list_item(item).model_dump(),
        content=item.content,
        sentiment=item.sentiment,
        source_score=item.source_score,
        tags=item.tags,
    )


def serialize_news_state(item: NewsStateRecord) -> NewsStateResponse:
    return NewsStateResponse(
        news_id=item.news_id,
        is_read=item.is_read,
        is_bookmarked=item.is_bookmarked,
        read_at=item.read_at,
    )


@router.get("", response_model=NewsListResponse)
def list_news(
    keyword: str | None = Query(None, description="按标题、摘要或来源搜索"),
    category: str | None = Query(None, description="按新闻分类筛选"),
    impact: str | None = Query(None, description="按影响级别筛选"),
    symbol: str | None = Query(None, description="按关联标的筛选"),
    time_range: str | None = Query(None, description="按时间范围筛选"),
    is_bookmarked: bool | None = Query(None, description="仅查看收藏新闻"),
    is_read: bool | None = Query(None, description="按已读状态筛选"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("published_at", pattern="^(published_at|impact)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(require_permission("news.view")),
    db: Session = Depends(get_db),
):
    items, total = NewsService(db).list_news(
        user_id=current_user.id,
        keyword=keyword,
        category=category,
        impact=impact,
        symbol=symbol,
        time_range=time_range,
        is_bookmarked=is_bookmarked,
        is_read=is_read,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return NewsListResponse(
        items=[serialize_news_list_item(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{news_id}", response_model=NewsDetail, dependencies=[Depends(require_permission("news.view"))])
def get_news_detail(news_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = NewsService(db).get_news(news_id=news_id, user_id=current_user.id)
    if item is None:
        raise HTTPException(status_code=404, detail="news not found")
    return serialize_news_detail(item)


@router.post("/{news_id}/read", response_model=NewsStateResponse, dependencies=[Depends(require_permission("news.markRead"))])
def mark_news_read(news_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        item = NewsService(db).mark_read(news_id=news_id, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return serialize_news_state(item)


@router.post("/{news_id}/bookmark", response_model=NewsStateResponse, dependencies=[Depends(require_permission("news.bookmark"))])
def bookmark_news(news_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        item = NewsService(db).bookmark(news_id=news_id, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return serialize_news_state(item)


@router.delete("/{news_id}/bookmark", response_model=NewsStateResponse, dependencies=[Depends(require_permission("news.bookmark"))])
def unbookmark_news(news_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        item = NewsService(db).unbookmark(news_id=news_id, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return serialize_news_state(item)
