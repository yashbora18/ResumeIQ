from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
)
from app.services.notification_service import (
    clear_read_notifications,
    get_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)


router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["Notifications"],
)


@router.get(
    "",
    response_model=NotificationListResponse,
)
def get_notifications(
    limit: int = Query(
        default=30,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications, unread_count, total = get_user_notifications(
        db,
        user_id=current_user.id,
        limit=limit,
    )

    return NotificationListResponse(
        notifications=notifications,
        unread_count=unread_count,
        total=total,
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = mark_notification_read(
        db,
        notification_id=notification_id,
        user_id=current_user.id,
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    db.commit()
    db.refresh(notification)

    return notification


@router.post("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_count = mark_all_notifications_read(
        db,
        user_id=current_user.id,
    )

    db.commit()

    return {
        "message": "All notifications marked as read.",
        "updated_count": updated_count,
    }


@router.delete("/read")
def clear_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted_count = clear_read_notifications(
        db,
        user_id=current_user.id,
    )

    db.commit()

    return {
        "message": "Read notifications cleared.",
        "deleted_count": deleted_count,
    }