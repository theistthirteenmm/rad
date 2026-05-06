from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Student, SubjectProgress
from ..schemas import StudentCreate, StudentOut, StudentUpdate

router = APIRouter(prefix="/api/students", tags=["students"])

SUBJECTS = ["farsi", "riazi", "olum", "ghoran", "negaresh"]

@router.post("/", response_model=StudentOut)
async def create_student(data: StudentCreate, db: AsyncSession = Depends(get_db)):
    student = Student(**data.model_dump())
    db.add(student)
    await db.flush()

    for subject in SUBJECTS:
        progress = SubjectProgress(student_id=student.id, subject=subject)
        db.add(progress)

    await db.commit()
    await db.refresh(student)
    return student

@router.get("/{student_id}", response_model=StudentOut)
async def get_student(student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="دانش‌آموز یافت نشد")
    return student

@router.get("/", response_model=list[StudentOut])
async def list_students(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).order_by(Student.created_at.desc()))
    return result.scalars().all()

@router.patch("/{student_id}", response_model=StudentOut)
async def update_student(student_id: int, data: StudentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="دانش‌آموز یافت نشد")

    if data.avatar is not None:
        student.avatar = data.avatar
    if data.character_items is not None:
        student.character_items = data.character_items

    await db.commit()
    await db.refresh(student)
    return student
