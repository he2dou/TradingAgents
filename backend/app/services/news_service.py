from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import String, and_, case, func, or_, select
from sqlalchemy.orm import Session

from app.models.news import NewsItem, NewsUserState


def _serialize_dt(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.isoformat() + "Z"


def _resolve_time_range(time_range: str | None) -> datetime | None:
    if not time_range or time_range == "全部时间":
        return None

    now = datetime.utcnow()
    if time_range == "今日":
        return datetime(now.year, now.month, now.day)
    if time_range == "近24小时":
        return now - timedelta(hours=24)
    if time_range == "近3天":
        return now - timedelta(days=3)
    if time_range == "近7天":
        return now - timedelta(days=7)
    return None


@dataclass
class NewsListItemRecord:
    id: str
    title: str
    summary: str
    source: str
    source_url: str | None
    category: str
    impact: str
    symbols: list[str]
    published_at: str
    is_read: bool
    is_bookmarked: bool


@dataclass
class NewsDetailRecord(NewsListItemRecord):
    content: str | None
    sentiment: str | None
    source_score: float | None
    tags: list[str]


@dataclass
class NewsStateRecord:
    news_id: str
    is_read: bool
    is_bookmarked: bool
    read_at: str | None


class NewsService:
    def __init__(self, db: Session):
        self.db = db

    def list_news(
        self,
        *,
        user_id: int,
        keyword: str | None = None,
        category: str | None = None,
        impact: str | None = None,
        symbol: str | None = None,
        time_range: str | None = None,
        is_bookmarked: bool | None = None,
        is_read: bool | None = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "published_at",
        sort_order: str = "desc",
    ) -> tuple[list[NewsListItemRecord], int]:
        filters = self._build_filters(
            keyword=keyword,
            category=category,
            impact=impact,
            symbol=symbol,
            time_range=time_range,
            is_bookmarked=is_bookmarked,
            is_read=is_read,
        )

        join_condition = and_(NewsUserState.news_id == NewsItem.id, NewsUserState.user_id == user_id)
        count_stmt = (
            select(func.count(NewsItem.id))
            .select_from(NewsItem)
            .outerjoin(NewsUserState, join_condition)
            .where(*filters)
        )
        total = int(self.db.execute(count_stmt).scalar() or 0)

        impact_order = case(
            (NewsItem.impact == "高", 3),
            (NewsItem.impact == "中", 2),
            (NewsItem.impact == "低", 1),
            else_=0,
        )

        if sort_by == "impact":
            primary_order = impact_order
        else:
            primary_order = NewsItem.published_at

        order_clause = primary_order.asc() if sort_order == "asc" else primary_order.desc()
        secondary_clause = NewsItem.published_at.desc() if sort_order != "asc" else NewsItem.published_at.asc()

        stmt = (
            select(NewsItem, NewsUserState)
            .outerjoin(NewsUserState, join_condition)
            .where(*filters)
            .order_by(order_clause, secondary_clause)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        items = []
        for news, state in self.db.execute(stmt).all():
            items.append(self._build_list_item(news, state))
        return items, total

    def get_news(self, *, news_id: str, user_id: int) -> NewsDetailRecord | None:
        join_condition = and_(NewsUserState.news_id == NewsItem.id, NewsUserState.user_id == user_id)
        stmt = (
            select(NewsItem, NewsUserState)
            .outerjoin(NewsUserState, join_condition)
            .where(NewsItem.id == news_id)
        )
        row = self.db.execute(stmt).first()
        if row is None:
            return None
        news, state = row
        base = self._build_list_item(news, state)
        return NewsDetailRecord(
            **base.__dict__,
            content=news.content,
            sentiment=news.sentiment,
            source_score=news.source_score,
            tags=list(news.tags_json or []),
        )

    def mark_read(self, *, news_id: str, user_id: int) -> NewsStateRecord:
        news = self.db.get(NewsItem, news_id)
        if news is None:
            raise ValueError("news not found")

        state = self._get_or_create_state(news_id=news_id, user_id=user_id)
        state.read_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(state)
        return self._build_state_record(state)

    def bookmark(self, *, news_id: str, user_id: int) -> NewsStateRecord:
        news = self.db.get(NewsItem, news_id)
        if news is None:
            raise ValueError("news not found")

        state = self._get_or_create_state(news_id=news_id, user_id=user_id)
        state.is_bookmarked = True
        self.db.commit()
        self.db.refresh(state)
        return self._build_state_record(state)

    def unbookmark(self, *, news_id: str, user_id: int) -> NewsStateRecord:
        news = self.db.get(NewsItem, news_id)
        if news is None:
            raise ValueError("news not found")

        state = self._get_or_create_state(news_id=news_id, user_id=user_id)
        state.is_bookmarked = False
        self.db.commit()
        self.db.refresh(state)
        return self._build_state_record(state)

    def _build_filters(
        self,
        *,
        keyword: str | None,
        category: str | None,
        impact: str | None,
        symbol: str | None,
        time_range: str | None,
        is_bookmarked: bool | None,
        is_read: bool | None,
    ) -> list:
        filters = []
        if keyword:
            q = f"%{keyword.strip()}%"
            filters.append(
                or_(
                    NewsItem.title.ilike(q),
                    NewsItem.summary.ilike(q),
                    NewsItem.source.ilike(q),
                )
            )
        if category:
            filters.append(NewsItem.category == category)
        if impact:
            filters.append(NewsItem.impact == impact)
        if symbol:
            normalized_symbol = symbol.strip().upper()
            filters.append(NewsItem.symbols_json.cast(String).ilike(f'%"{normalized_symbol}"%'))

        published_after = _resolve_time_range(time_range)
        if published_after is not None:
            filters.append(NewsItem.published_at >= published_after)

        if is_bookmarked is True:
            filters.append(NewsUserState.is_bookmarked.is_(True))
        elif is_bookmarked is False:
            filters.append(or_(NewsUserState.is_bookmarked.is_(False), NewsUserState.is_bookmarked.is_(None)))

        if is_read is True:
            filters.append(NewsUserState.read_at.is_not(None))
        elif is_read is False:
            filters.append(NewsUserState.read_at.is_(None))

        return filters

    def _get_or_create_state(self, *, news_id: str, user_id: int) -> NewsUserState:
        stmt = select(NewsUserState).where(
            NewsUserState.news_id == news_id,
            NewsUserState.user_id == user_id,
        )
        state = self.db.execute(stmt).scalar_one_or_none()
        if state is not None:
            return state

        state = NewsUserState(news_id=news_id, user_id=user_id, is_bookmarked=False, read_at=None)
        self.db.add(state)
        self.db.flush()
        return state

    def _build_list_item(self, news: NewsItem, state: NewsUserState | None) -> NewsListItemRecord:
        return NewsListItemRecord(
            id=news.id,
            title=news.title,
            summary=news.summary,
            source=news.source,
            source_url=news.source_url,
            category=news.category,
            impact=news.impact,
            symbols=list(news.symbols_json or []),
            published_at=_serialize_dt(news.published_at) or "",
            is_read=state is not None and state.read_at is not None,
            is_bookmarked=state is not None and bool(state.is_bookmarked),
        )

    def _build_state_record(self, state: NewsUserState) -> NewsStateRecord:
        return NewsStateRecord(
            news_id=state.news_id,
            is_read=state.read_at is not None,
            is_bookmarked=bool(state.is_bookmarked),
            read_at=_serialize_dt(state.read_at),
        )
