import random
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import ClassRoom, Exam, ExamAttempt, ExamQuestion, Grade, User
from .auth import get_current_user

router = APIRouter(prefix='/exams', tags=['exams'])

MAX_AWAY_SECONDS = 120  # ۲ دقیقه مجاز


# ─── Schemas ─────────────────────────────────────────────────────────────────

class ExamCreate(BaseModel):
    title: str
    subject: str
    time_limit_minutes: int = 0
    class_id: Optional[int] = None
    grade_id: Optional[int] = None
    shuffle_questions: bool = True
    shuffle_options: bool = False


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    class_id: Optional[int] = None
    grade_id: Optional[int] = None
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None


class QuestionCreate(BaseModel):
    text: str
    image_data: Optional[str] = None
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct: str  # 'a', 'b', 'c', 'd'
    order: int = 0


class SubmitAnswers(BaseModel):
    answers: dict


class AwayReport(BaseModel):
    action: str  # 'return'
    away_seconds: int = 0


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _exam_summary(exam: Exam, q_count: int, a_count: int) -> dict:
    return {
        'id': exam.id,
        'title': exam.title,
        'subject': exam.subject,
        'status': exam.status,
        'time_limit_minutes': exam.time_limit_minutes,
        'shuffle_questions': exam.shuffle_questions,
        'shuffle_options': exam.shuffle_options,
        'question_count': q_count,
        'attempt_count': a_count,
        'created_at': exam.created_at.isoformat(),
        'scheduled_at': exam.scheduled_at.isoformat() if exam.scheduled_at else None,
        'class_id': exam.class_id,
        'grade_id': exam.grade_id,
    }


def _question_out(q: ExamQuestion, with_correct: bool = True) -> dict:
    d = {
        'id': q.id,
        'order': q.order,
        'text': q.text,
        'image_data': q.image_data,
        'option_a': q.option_a,
        'option_b': q.option_b,
        'option_c': q.option_c,
        'option_d': q.option_d,
    }
    if with_correct:
        d['correct'] = q.correct
    return d


# ─── Teacher: list / create ───────────────────────────────────────────────────

@router.get('/active/list')
async def get_active_exams(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """دانش‌آموز: لیست آزمون‌های فعال برای کلاس او"""
    if user.role != 'student':
        raise HTTPException(403)

    r = await db.execute(
        select(Exam).where(Exam.status == 'active', Exam.school_id == user.school_id)
    )
    exams = r.scalars().all()

    result = []
    for exam in exams:
        if exam.class_id is not None and exam.class_id != user.class_id:
            continue
        if exam.grade_id is not None and exam.grade_id != user.grade_id:
            continue
        ar = await db.execute(
            select(ExamAttempt).where(
                ExamAttempt.exam_id == exam.id,
                ExamAttempt.student_id == user.id,
            )
        )
        attempt = ar.scalar_one_or_none()
        result.append({
            'id': exam.id,
            'title': exam.title,
            'subject': exam.subject,
            'time_limit_minutes': exam.time_limit_minutes,
            'attempt_status': attempt.status if attempt else None,
        })
    return result


@router.get('/')
async def list_exams(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in ('teacher', 'admin'):
        raise HTTPException(403)
    r = await db.execute(
        select(Exam).where(Exam.teacher_id == user.id).order_by(Exam.created_at.desc())
    )
    exams = r.scalars().all()
    result = []
    for exam in exams:
        qr = await db.execute(select(func.count()).select_from(ExamQuestion).where(ExamQuestion.exam_id == exam.id))
        q_count = qr.scalar()
        ar = await db.execute(select(func.count()).select_from(ExamAttempt).where(ExamAttempt.exam_id == exam.id))
        a_count = ar.scalar()
        result.append(_exam_summary(exam, q_count, a_count))
    return result


@router.post('/')
async def create_exam(
    data: ExamCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in ('teacher', 'admin'):
        raise HTTPException(403)
    exam = Exam(
        title=data.title,
        subject=data.subject,
        teacher_id=user.id,
        school_id=user.school_id,
        time_limit_minutes=data.time_limit_minutes,
        class_id=data.class_id,
        grade_id=data.grade_id,
        shuffle_questions=data.shuffle_questions,
        shuffle_options=data.shuffle_options,
    )
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    return {'id': exam.id, 'title': exam.title, 'status': exam.status}


# ─── Teacher: get / update / delete one exam ─────────────────────────────────

@router.get('/{exam_id}')
async def get_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(404)
    if user.role == 'teacher' and exam.teacher_id != user.id:
        raise HTTPException(403)
    r = await db.execute(
        select(ExamQuestion).where(ExamQuestion.exam_id == exam_id).order_by(ExamQuestion.order)
    )
    questions = r.scalars().all()
    return {
        'id': exam.id,
        'title': exam.title,
        'subject': exam.subject,
        'status': exam.status,
        'time_limit_minutes': exam.time_limit_minutes,
        'shuffle_questions': exam.shuffle_questions,
        'shuffle_options': exam.shuffle_options,
        'class_id': exam.class_id,
        'grade_id': exam.grade_id,
        'scheduled_at': exam.scheduled_at.isoformat() if exam.scheduled_at else None,
        'questions': [_question_out(q) for q in questions],
    }


@router.patch('/{exam_id}')
async def update_exam(
    exam_id: int,
    data: ExamUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(404)
    if user.role == 'teacher' and exam.teacher_id != user.id:
        raise HTTPException(403)
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(exam, field, val)
    await db.commit()
    return {'id': exam.id, 'status': exam.status}


@router.delete('/{exam_id}')
async def delete_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(404)
    if user.role == 'teacher' and exam.teacher_id != user.id:
        raise HTTPException(403)
    await db.delete(exam)
    await db.commit()
    return {'ok': True}


# ─── Teacher: questions CRUD ──────────────────────────────────────────────────

@router.post('/{exam_id}/questions')
async def add_question(
    exam_id: int,
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(404)
    if user.role == 'teacher' and exam.teacher_id != user.id:
        raise HTTPException(403)
    if data.correct not in ('a', 'b', 'c', 'd'):
        raise HTTPException(400, 'correct باید a/b/c/d باشد')
    q = ExamQuestion(
        exam_id=exam_id,
        text=data.text,
        image_data=data.image_data,
        option_a=data.option_a,
        option_b=data.option_b,
        option_c=data.option_c,
        option_d=data.option_d,
        correct=data.correct,
        order=data.order,
    )
    db.add(q)
    await db.commit()
    await db.refresh(q)
    return _question_out(q)


@router.put('/{exam_id}/questions/{qid}')
async def update_question(
    exam_id: int,
    qid: int,
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = await db.get(ExamQuestion, qid)
    if not q or q.exam_id != exam_id:
        raise HTTPException(404)
    exam = await db.get(Exam, exam_id)
    if user.role == 'teacher' and exam.teacher_id != user.id:
        raise HTTPException(403)
    if data.correct not in ('a', 'b', 'c', 'd'):
        raise HTTPException(400, 'correct باید a/b/c/d باشد')
    for field, val in data.model_dump().items():
        setattr(q, field, val)
    await db.commit()
    return _question_out(q)


@router.delete('/{exam_id}/questions/{qid}')
async def delete_question(
    exam_id: int,
    qid: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = await db.get(ExamQuestion, qid)
    if not q or q.exam_id != exam_id:
        raise HTTPException(404)
    exam = await db.get(Exam, exam_id)
    if user.role == 'teacher' and exam.teacher_id != user.id:
        raise HTTPException(403)
    await db.delete(q)
    await db.commit()
    return {'ok': True}


# ─── Teacher: results ─────────────────────────────────────────────────────────

@router.get('/{exam_id}/results')
async def get_results(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exam = await db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(404)
    if user.role == 'teacher' and exam.teacher_id != user.id:
        raise HTTPException(403)
    r = await db.execute(select(ExamAttempt).where(ExamAttempt.exam_id == exam_id))
    attempts = r.scalars().all()
    result = []
    for attempt in attempts:
        student = await db.get(User, attempt.student_id)
        class_name = ''
        if student and student.class_id:
            cls = await db.get(ClassRoom, student.class_id)
            class_name = cls.name if cls else ''
        result.append({
            'student_name': student.name if student else '?',
            'class_name': class_name,
            'score': attempt.score,
            'total': attempt.total,
            'percent': round(attempt.score / attempt.total * 100) if attempt.total > 0 else 0,
            'status': attempt.status,
            'submitted_at': attempt.submitted_at.isoformat() if attempt.submitted_at else None,
            'away_count': attempt.away_count,
            'away_seconds': attempt.away_seconds,
        })
    result.sort(key=lambda x: x['percent'], reverse=True)
    return result


# ─── Student: start / submit / away ──────────────────────────────────────────

@router.post('/{exam_id}/start')
async def start_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != 'student':
        raise HTTPException(403)
    exam = await db.get(Exam, exam_id)
    if not exam or exam.status != 'active':
        raise HTTPException(400, 'آزمون فعال نیست')

    r = await db.execute(
        select(ExamAttempt).where(
            ExamAttempt.exam_id == exam_id,
            ExamAttempt.student_id == user.id,
        )
    )
    attempt = r.scalar_one_or_none()

    if attempt and attempt.status == 'submitted':
        raise HTTPException(400, 'این آزمون را قبلاً انجام داده‌اید')
    if attempt and attempt.status == 'force_closed':
        raise HTTPException(400, 'آزمون شما به دلیل تقلب بسته شده است')

    qs_r = await db.execute(
        select(ExamQuestion).where(ExamQuestion.exam_id == exam_id).order_by(ExamQuestion.order)
    )
    questions = qs_r.scalars().all()

    if not attempt:
        attempt = ExamAttempt(
            exam_id=exam_id,
            student_id=user.id,
            total=len(questions),
        )
        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)

    q_list = [_question_out(q, with_correct=False) for q in questions]
    if exam.shuffle_questions:
        random.shuffle(q_list)

    return {
        'attempt_id': attempt.id,
        'exam': {
            'id': exam.id,
            'title': exam.title,
            'subject': exam.subject,
            'time_limit_minutes': exam.time_limit_minutes,
        },
        'questions': q_list,
        'existing_answers': attempt.answers or {},
        'started_at': attempt.started_at.isoformat(),
        'away_count': attempt.away_count,
    }


@router.post('/{exam_id}/submit')
async def submit_exam(
    exam_id: int,
    data: SubmitAnswers,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != 'student':
        raise HTTPException(403)
    r = await db.execute(
        select(ExamAttempt).where(
            ExamAttempt.exam_id == exam_id,
            ExamAttempt.student_id == user.id,
        )
    )
    attempt = r.scalar_one_or_none()
    if not attempt or attempt.status != 'in_progress':
        raise HTTPException(400, 'امتحانی فعال وجود ندارد')

    qs_r = await db.execute(select(ExamQuestion).where(ExamQuestion.exam_id == exam_id))
    questions = qs_r.scalars().all()

    score = sum(
        1 for q in questions
        if str(q.id) in data.answers and data.answers[str(q.id)] == q.correct
    )

    attempt.answers = data.answers
    attempt.score = score
    attempt.total = len(questions)
    attempt.status = 'submitted'
    attempt.submitted_at = datetime.utcnow()
    await db.commit()

    return {
        'score': score,
        'total': len(questions),
        'percent': round(score / len(questions) * 100) if questions else 0,
    }


@router.patch('/{exam_id}/away')
async def report_away(
    exam_id: int,
    data: AwayReport,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != 'student':
        raise HTTPException(403)
    r = await db.execute(
        select(ExamAttempt).where(
            ExamAttempt.exam_id == exam_id,
            ExamAttempt.student_id == user.id,
        )
    )
    attempt = r.scalar_one_or_none()
    if not attempt or attempt.status != 'in_progress':
        return {'ok': True}

    attempt.away_count += 1
    attempt.away_seconds += data.away_seconds

    force_close = attempt.away_count >= 3 or attempt.away_seconds > MAX_AWAY_SECONDS
    if force_close:
        attempt.status = 'force_closed'
        await db.commit()
        return {
            'force_close': True,
            'message': f'آزمون به دلیل خروج بیش از حد ({attempt.away_seconds} ثانیه) بسته شد',
        }

    if attempt.away_count == 1:
        msg = f'⚠️ هشدار اول: {data.away_seconds} ثانیه خارج از آزمون بودید. دفعه بعد آزمون بسته می‌شود.'
    else:
        msg = f'⚠️ هشدار آخر! مجموعاً {attempt.away_seconds} ثانیه خارج شده‌اید. دفعه بعد آزمون بسته می‌شود.'

    await db.commit()
    return {
        'force_close': False,
        'warning': True,
        'message': msg,
        'away_count': attempt.away_count,
    }
