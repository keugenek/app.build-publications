from sqlmodel import SQLModel, Field, Relationship, JSON, Column
from datetime import datetime
from typing import Optional, List, Dict
from enum import Enum
from decimal import Decimal


class JLPTLevel(str, Enum):
    N5 = "N5"
    N4 = "N4"
    N3 = "N3"
    N2 = "N2"
    N1 = "N1"


class SRSStage(int, Enum):
    """Spaced Repetition System stages with intervals in days"""

    APPRENTICE_1 = 1  # 4 hours
    APPRENTICE_2 = 2  # 8 hours
    APPRENTICE_3 = 3  # 1 day
    APPRENTICE_4 = 4  # 2 days
    GURU_1 = 5  # 1 week
    GURU_2 = 6  # 2 weeks
    MASTER = 7  # 1 month
    ENLIGHTENED = 8  # 4 months
    BURNED = 9  # Never review again


# Persistent models (stored in database)
class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(max_length=50, unique=True)
    email: str = Field(max_length=255, unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)

    # Statistics
    total_reviews: int = Field(default=0)
    correct_reviews: int = Field(default=0)
    current_streak: int = Field(default=0)
    max_streak: int = Field(default=0)

    # Relationships
    study_records: List["UserKanjiProgress"] = Relationship(back_populates="user")


class Kanji(SQLModel, table=True):
    __tablename__ = "kanji"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    character: str = Field(max_length=1, unique=True, index=True)
    meaning: str = Field(max_length=500)
    onyomi: str = Field(default="", max_length=200)  # On'yomi readings (Chinese-derived)
    kunyomi: str = Field(default="", max_length=200)  # Kun'yomi readings (Japanese)
    jlpt_level: JLPTLevel = Field(index=True)
    stroke_count: int = Field(ge=1, le=30)
    frequency_rank: Optional[int] = Field(default=None)  # Frequency ranking in Japanese
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Additional learning aids
    mnemonics: Optional[str] = Field(default=None, max_length=1000)
    example_words: List[str] = Field(default=[], sa_column=Column(JSON))

    # Relationships
    user_progress: List["UserKanjiProgress"] = Relationship(back_populates="kanji")
    review_sessions: List["ReviewSession"] = Relationship(back_populates="kanji")


class UserKanjiProgress(SQLModel, table=True):
    __tablename__ = "user_kanji_progress"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    kanji_id: int = Field(foreign_key="kanji.id")

    # SRS tracking
    srs_stage: SRSStage = Field(default=SRSStage.APPRENTICE_1)
    next_review_date: datetime = Field(default_factory=datetime.utcnow)
    last_reviewed_date: Optional[datetime] = Field(default=None)

    # Performance tracking
    times_reviewed: int = Field(default=0)
    times_correct: int = Field(default=0)
    times_incorrect: int = Field(default=0)
    consecutive_correct: int = Field(default=0)

    # Accuracy percentage
    accuracy_percentage: Decimal = Field(default=Decimal("0"), max_digits=5, decimal_places=2)

    # Metadata
    first_learned_date: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="study_records")
    kanji: Kanji = Relationship(back_populates="user_progress")


class ReviewSession(SQLModel, table=True):
    __tablename__ = "review_sessions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    kanji_id: int = Field(foreign_key="kanji.id")

    # Session data
    session_date: datetime = Field(default_factory=datetime.utcnow)
    was_correct: bool
    response_time_seconds: Optional[Decimal] = Field(default=None, max_digits=8, decimal_places=3)

    # SRS data at time of review
    srs_stage_before: SRSStage
    srs_stage_after: SRSStage

    # Review type
    review_type: str = Field(default="flashcard", max_length=50)  # flashcard, typing, etc.

    # Relationships
    user: User = Relationship()
    kanji: Kanji = Relationship(back_populates="review_sessions")


class StudySession(SQLModel, table=True):
    __tablename__ = "study_sessions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")

    # Session metadata
    session_start: datetime = Field(default_factory=datetime.utcnow)
    session_end: Optional[datetime] = Field(default=None)
    session_duration_minutes: Optional[int] = Field(default=None)

    # Session statistics
    total_reviews: int = Field(default=0)
    correct_reviews: int = Field(default=0)
    accuracy_percentage: Decimal = Field(default=Decimal("0"), max_digits=5, decimal_places=2)

    # Session type and focus
    session_type: str = Field(default="review", max_length=50)  # review, lesson, practice
    jlpt_levels_studied: List[str] = Field(default=[], sa_column=Column(JSON))

    # Relationship
    user: User = Relationship()


# Non-persistent schemas (for validation, forms, API requests/responses)
class UserCreate(SQLModel, table=False):
    username: str = Field(max_length=50)
    email: str = Field(max_length=255)


class UserRead(SQLModel, table=False):
    id: int
    username: str
    email: str
    total_reviews: int
    correct_reviews: int
    current_streak: int
    max_streak: int
    created_at: str  # Will be converted from datetime


class KanjiCreate(SQLModel, table=False):
    character: str = Field(max_length=1)
    meaning: str = Field(max_length=500)
    onyomi: str = Field(default="", max_length=200)
    kunyomi: str = Field(default="", max_length=200)
    jlpt_level: JLPTLevel
    stroke_count: int = Field(ge=1, le=30)
    frequency_rank: Optional[int] = Field(default=None)
    mnemonics: Optional[str] = Field(default=None, max_length=1000)
    example_words: List[str] = Field(default=[])


class KanjiRead(SQLModel, table=False):
    id: int
    character: str
    meaning: str
    onyomi: str
    kunyomi: str
    jlpt_level: JLPTLevel
    stroke_count: int
    frequency_rank: Optional[int]
    mnemonics: Optional[str]
    example_words: List[str]


class ReviewRequest(SQLModel, table=False):
    kanji_id: int
    was_correct: bool
    response_time_seconds: Optional[Decimal] = Field(default=None, max_digits=8, decimal_places=3)
    review_type: str = Field(default="flashcard", max_length=50)


class ReviewResponse(SQLModel, table=False):
    success: bool
    new_srs_stage: SRSStage
    next_review_date: str  # Will be converted from datetime
    accuracy_percentage: Decimal


class ProgressSummary(SQLModel, table=False):
    user_id: int
    total_kanji: int
    apprentice_count: int
    guru_count: int
    master_count: int
    enlightened_count: int
    burned_count: int
    reviews_due_today: int
    jlpt_progress: Dict[str, Dict[str, int]]  # {level: {stage: count}}


class StudySessionCreate(SQLModel, table=False):
    session_type: str = Field(default="review", max_length=50)
    jlpt_levels_studied: List[str] = Field(default=[])


class StudySessionUpdate(SQLModel, table=False):
    session_end: datetime
    total_reviews: int
    correct_reviews: int
    accuracy_percentage: Decimal
