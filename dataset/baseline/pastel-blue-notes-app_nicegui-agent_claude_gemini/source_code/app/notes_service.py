from typing import List, Optional
from datetime import datetime
from sqlmodel import select, and_
from app.database import get_session
from app.models import Note, NoteCreate, NoteUpdate


class NotesService:
    @staticmethod
    def create_note(user_id: int, note_data: NoteCreate) -> Optional[Note]:
        """Create a new note for the user"""
        with get_session() as session:
            note = Note(
                title=note_data.title,
                content=note_data.content,
                category_id=note_data.category_id,
                user_id=user_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            session.add(note)
            session.commit()
            session.refresh(note)
            return note

    @staticmethod
    def get_user_notes(user_id: int, category_id: Optional[int] = None) -> List[Note]:
        """Get all notes for a user, optionally filtered by category"""
        with get_session() as session:
            query = select(Note).where(Note.user_id == user_id)

            if category_id is not None:
                query = query.where(Note.category_id == category_id)

            # Order by pinned status (pinned first), then by updated date (most recent first)
            query = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc())  # type: ignore[attr-defined]

            notes = session.exec(query).all()
            return list(notes)

    @staticmethod
    def get_uncategorized_notes(user_id: int) -> List[Note]:
        """Get all uncategorized notes for a user"""
        with get_session() as session:
            notes = session.exec(
                select(Note)
                .where(and_(Note.user_id == user_id, Note.category_id.is_(None)))  # type: ignore[attr-defined]
                .order_by(Note.is_pinned.desc(), Note.updated_at.desc())  # type: ignore[attr-defined]  # type: ignore[attr-defined]
            ).all()
            return list(notes)

    @staticmethod
    def get_note_by_id(note_id: int, user_id: int) -> Optional[Note]:
        """Get note by ID, ensuring it belongs to the user"""
        with get_session() as session:
            return session.exec(select(Note).where(Note.id == note_id, Note.user_id == user_id)).first()

    @staticmethod
    def update_note(note_id: int, user_id: int, update_data: NoteUpdate) -> Optional[Note]:
        """Update a note"""
        with get_session() as session:
            note = session.exec(select(Note).where(Note.id == note_id, Note.user_id == user_id)).first()

            if note is None:
                return None

            # Update fields that are not None
            if update_data.title is not None:
                note.title = update_data.title
            if update_data.content is not None:
                note.content = update_data.content
            if update_data.category_id is not None:
                note.category_id = update_data.category_id
            if update_data.is_pinned is not None:
                note.is_pinned = update_data.is_pinned

            note.updated_at = datetime.utcnow()

            session.add(note)
            session.commit()
            session.refresh(note)
            return note

    @staticmethod
    def delete_note(note_id: int, user_id: int) -> bool:
        """Delete a note"""
        with get_session() as session:
            note = session.exec(select(Note).where(Note.id == note_id, Note.user_id == user_id)).first()

            if note is None:
                return False

            session.delete(note)
            session.commit()
            return True

    @staticmethod
    def search_notes(user_id: int, search_term: str) -> List[Note]:
        """Search notes by title or content"""
        with get_session() as session:
            search_pattern = f"%{search_term}%"
            notes = session.exec(
                select(Note)
                .where(
                    and_(
                        Note.user_id == user_id,
                        (Note.title.ilike(search_pattern) | Note.content.ilike(search_pattern)),  # type: ignore[attr-defined]
                    )
                )
                .order_by(Note.is_pinned.desc(), Note.updated_at.desc())  # type: ignore[attr-defined]
            ).all()
            return list(notes)
