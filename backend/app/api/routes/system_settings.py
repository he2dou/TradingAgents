from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_permission
from app.core.db import get_db
from app.models.user import User
from app.schemas.system_settings import (
    SettingsCategoryDetail,
    SettingsCategoryItem,
    SettingsUpdateRequest,
)
from app.services.system_settings_service import SystemSettingsService


router = APIRouter(prefix="/v1/system/settings", tags=["system-settings"])


def _serialize_category(row) -> SettingsCategoryItem:
    return SettingsCategoryItem(
        category=row.category,
        label=row.label,
        description=row.description,
        updated_at=row.updated_at.isoformat() + "Z",
        updated_by=row.updated_by,
    )


def _serialize_detail(row) -> SettingsCategoryDetail:
    return SettingsCategoryDetail(
        category=row.category,
        label=row.label,
        description=row.description,
        config=row.config,
        updated_at=row.updated_at.isoformat() + "Z",
        updated_by=row.updated_by,
    )


@router.get("", response_model=list[SettingsCategoryItem], dependencies=[Depends(require_permission("settings.view"))])
def list_settings(db: Session = Depends(get_db)):
    rows = SystemSettingsService(db).list_categories()
    return [_serialize_category(row) for row in rows]


@router.get("/{category}", response_model=SettingsCategoryDetail, dependencies=[Depends(require_permission("settings.view"))])
def get_setting(category: str, db: Session = Depends(get_db)):
    row = SystemSettingsService(db).get_category(category)
    if row is None:
        raise HTTPException(status_code=404, detail=f"配置分类不存在: {category}")
    return _serialize_detail(row)


@router.put("/{category}", response_model=SettingsCategoryDetail, dependencies=[Depends(require_permission("settings.edit"))])
def update_setting(
    category: str,
    payload: SettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        row = SystemSettingsService(db).update_category(category, payload.config, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialize_detail(row)


@router.post("/{category}/reset", response_model=SettingsCategoryDetail, dependencies=[Depends(require_permission("settings.edit"))])
def reset_setting(category: str, db: Session = Depends(get_db)):
    try:
        row = SystemSettingsService(db).reset_category(category)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _serialize_detail(row)
