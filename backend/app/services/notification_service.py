from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    *,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        is_read=False,
    )

    db.add(notification)
    db.flush()

    return notification


def get_user_notifications(
    db: Session,
    *,
    user_id: int,
    limit: int = 30,
) -> tuple[list[Notification], int, int]:
    notifications = list(
        db.scalars(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        ).all()
    )

    total = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id
        )
    ) or 0

    unread_count = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
    ) or 0

    return notifications, int(unread_count), int(total)


def mark_notification_read(
    db: Session,
    *,
    notification_id: int,
    user_id: int,
) -> Notification | None:
    notification = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )

    if notification is None:
        return None

    notification.is_read = True
    db.flush()

    return notification


def mark_all_notifications_read(
    db: Session,
    *,
    user_id: int,
) -> int:
    notifications = list(
        db.scalars(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        ).all()
    )

    for notification in notifications:
        notification.is_read = True

    db.flush()

    return len(notifications)


def clear_read_notifications(
    db: Session,
    *,
    user_id: int,
) -> int:
    """
    Permanently delete only notifications that are already read
    and belong to the authenticated user.

    Unread notifications are never deleted.
    """

    result = db.execute(
        delete(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(True),
        )
    )

    db.flush()

    return int(result.rowcount or 0)