from sqlmodel import SQLModel, Field, Relationship, JSON, Column
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


# Enums for better type safety
class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuizStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


# Persistent models (stored in database)
class Teacher(SQLModel, table=True):
    __tablename__ = "teachers"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    email: str = Field(unique=True, max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    department: str = Field(max_length=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    subjects: List["Subject"] = Relationship(back_populates="teacher")
    quizzes: List["Quiz"] = Relationship(back_populates="teacher")


class Subject(SQLModel, table=True):
    __tablename__ = "subjects"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)
    teacher_id: int = Field(foreign_key="teachers.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    teacher: Teacher = Relationship(back_populates="subjects")
    topics: List["Topic"] = Relationship(back_populates="subject")
    questions: List["Question"] = Relationship(back_populates="subject")


class Topic(SQLModel, table=True):
    __tablename__ = "topics"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)
    subject_id: int = Field(foreign_key="subjects.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    subject: Subject = Relationship(back_populates="topics")
    questions: List["Question"] = Relationship(back_populates="topic")


class Question(SQLModel, table=True):
    __tablename__ = "questions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    question_text: str = Field(max_length=1000)
    answer_text: str = Field(max_length=1000)
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.MEDIUM)
    points: int = Field(default=1, ge=1, le=10)  # Points range 1-10
    subject_id: int = Field(foreign_key="subjects.id")
    topic_id: int = Field(foreign_key="topics.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Additional metadata stored as JSON
    question_metadata: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))

    # Relationships
    subject: Subject = Relationship(back_populates="questions")
    topic: Topic = Relationship(back_populates="questions")
    quiz_questions: List["QuizQuestion"] = Relationship(back_populates="question")


class Quiz(SQLModel, table=True):
    __tablename__ = "quizzes"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    teacher_id: int = Field(foreign_key="teachers.id")
    status: QuizStatus = Field(default=QuizStatus.DRAFT)
    total_points: int = Field(default=0, ge=0)
    time_limit_minutes: Optional[int] = Field(default=None, ge=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Generation criteria stored as JSON
    generation_criteria: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))

    # Relationships
    teacher: Teacher = Relationship(back_populates="quizzes")
    quiz_questions: List["QuizQuestion"] = Relationship(back_populates="quiz")


class QuizQuestion(SQLModel, table=True):
    __tablename__ = "quiz_questions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    quiz_id: int = Field(foreign_key="quizzes.id")
    question_id: int = Field(foreign_key="questions.id")
    order_index: int = Field(ge=0)  # Order of question in quiz
    points_assigned: int = Field(default=1, ge=1, le=10)  # Points for this question in this quiz
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    quiz: Quiz = Relationship(back_populates="quiz_questions")
    question: Question = Relationship(back_populates="quiz_questions")


# Non-persistent schemas (for validation, forms, API requests/responses)
class TeacherCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    department: str = Field(max_length=100)


class TeacherUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    department: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = Field(default=None)


class SubjectCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)
    teacher_id: int


class SubjectUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class TopicCreate(SQLModel, table=False):
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)
    subject_id: int


class TopicUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class QuestionCreate(SQLModel, table=False):
    question_text: str = Field(max_length=1000)
    answer_text: str = Field(max_length=1000)
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.MEDIUM)
    points: int = Field(default=1, ge=1, le=10)
    subject_id: int
    topic_id: int
    question_metadata: Dict[str, Any] = Field(default={})


class QuestionUpdate(SQLModel, table=False):
    question_text: Optional[str] = Field(default=None, max_length=1000)
    answer_text: Optional[str] = Field(default=None, max_length=1000)
    difficulty: Optional[DifficultyLevel] = Field(default=None)
    points: Optional[int] = Field(default=None, ge=1, le=10)
    question_metadata: Optional[Dict[str, Any]] = Field(default=None)


class QuizCreate(SQLModel, table=False):
    title: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    teacher_id: int
    time_limit_minutes: Optional[int] = Field(default=None, ge=1)
    generation_criteria: Dict[str, Any] = Field(default={})


class QuizUpdate(SQLModel, table=False):
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[QuizStatus] = Field(default=None)
    time_limit_minutes: Optional[int] = Field(default=None, ge=1)
    generation_criteria: Optional[Dict[str, Any]] = Field(default=None)


class QuizGenerationRequest(SQLModel, table=False):
    title: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    teacher_id: int
    subject_ids: List[int] = Field(default=[])
    topic_ids: List[int] = Field(default=[])
    difficulty_levels: List[DifficultyLevel] = Field(default=[])
    question_count: int = Field(ge=1, le=100)
    total_points: Optional[int] = Field(default=None, ge=1)
    time_limit_minutes: Optional[int] = Field(default=None, ge=1)


class QuizQuestionCreate(SQLModel, table=False):
    quiz_id: int
    question_id: int
    order_index: int = Field(ge=0)
    points_assigned: int = Field(default=1, ge=1, le=10)


class QuizExportRequest(SQLModel, table=False):
    quiz_id: int
    include_answers: bool = Field(default=False)
    format_options: Dict[str, Any] = Field(default={})
