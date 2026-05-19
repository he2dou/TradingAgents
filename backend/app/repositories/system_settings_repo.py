from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.system_settings import SystemSettings


class SystemSettingsRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[SystemSettings]:
        stmt = select(SystemSettings).order_by(SystemSettings.category)
        return list(self.db.scalars(stmt).all())

    def get_by_category(self, category: str) -> SystemSettings | None:
        stmt = select(SystemSettings).where(SystemSettings.category == category)
        return self.db.scalars(stmt).first()

    def create(self, **kwargs) -> SystemSettings:
        obj = SystemSettings(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def save(self, obj: SystemSettings) -> SystemSettings:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: SystemSettings) -> None:
        self.db.delete(obj)
        self.db.commit()
