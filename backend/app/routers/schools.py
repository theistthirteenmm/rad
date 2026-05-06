from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..database import get_db
from ..models import School, Grade, ClassRoom, User
from ..schemas import SchoolOut, GradeOut, ClassOut, AddGradeRequest, AddClassRequest
from .auth import get_current_user

router = APIRouter(prefix='/api/schools', tags=['schools'])


def _school_out(s: School) -> SchoolOut:
    return SchoolOut(
        id=str(s.id),
        name=s.name,
        grades=[
            GradeOut(
                id=str(g.id),
                name=g.name,
                classes=[ClassOut(id=str(c.id), name=c.name) for c in g.classes],
            )
            for g in s.grades
        ],
    )


async def _load_school(db: AsyncSession, school_id: int) -> School | None:
    r = await db.execute(
        select(School)
        .options(selectinload(School.grades).selectinload(Grade.classes))
        .where(School.id == school_id)
    )
    return r.scalar_one_or_none()


@router.get('/', response_model=list[SchoolOut])
async def list_schools(db: AsyncSession = Depends(get_db)):
    r = await db.execute(
        select(School).options(selectinload(School.grades).selectinload(Grade.classes))
    )
    return [_school_out(s) for s in r.scalars().all()]


@router.get('/{school_id}', response_model=SchoolOut)
async def get_school(school_id: int, db: AsyncSession = Depends(get_db)):
    s = await _load_school(db, school_id)
    if not s:
        raise HTTPException(404, 'مدرسه یافت نشد')
    return _school_out(s)


@router.post('/{school_id}/grades', response_model=SchoolOut)
async def add_grade(
    school_id: int,
    data: AddGradeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != 'admin' or user.school_id != school_id:
        raise HTTPException(403, 'Forbidden')
    dup = await db.execute(
        select(Grade).where(Grade.school_id == school_id, Grade.name == data.name.strip())
    )
    if dup.scalar_one_or_none():
        raise HTTPException(400, 'این پایه قبلاً اضافه شده است')
    db.add(Grade(name=data.name.strip(), school_id=school_id))
    await db.commit()
    s = await _load_school(db, school_id)
    return _school_out(s)


@router.delete('/{school_id}/grades/{grade_id}', response_model=SchoolOut)
async def delete_grade(
    school_id: int,
    grade_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != 'admin' or user.school_id != school_id:
        raise HTTPException(403, 'Forbidden')
    r = await db.execute(select(Grade).where(Grade.id == grade_id, Grade.school_id == school_id))
    grade = r.scalar_one_or_none()
    if not grade:
        raise HTTPException(404, 'پایه یافت نشد')
    await db.delete(grade)
    await db.commit()
    s = await _load_school(db, school_id)
    return _school_out(s)


@router.post('/{school_id}/grades/{grade_id}/classes', response_model=SchoolOut)
async def add_class(
    school_id: int,
    grade_id: int,
    data: AddClassRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != 'admin' or user.school_id != school_id:
        raise HTTPException(403, 'Forbidden')
    dup = await db.execute(
        select(ClassRoom).where(ClassRoom.grade_id == grade_id, ClassRoom.name == data.name.strip())
    )
    if dup.scalar_one_or_none():
        raise HTTPException(400, 'این کلاس قبلاً اضافه شده است')
    db.add(ClassRoom(name=data.name.strip(), grade_id=grade_id, school_id=school_id))
    await db.commit()
    s = await _load_school(db, school_id)
    return _school_out(s)


@router.delete('/{school_id}/grades/{grade_id}/classes/{class_id}', response_model=SchoolOut)
async def delete_class(
    school_id: int,
    grade_id: int,
    class_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != 'admin' or user.school_id != school_id:
        raise HTTPException(403, 'Forbidden')
    r = await db.execute(
        select(ClassRoom).where(ClassRoom.id == class_id, ClassRoom.grade_id == grade_id)
    )
    cls = r.scalar_one_or_none()
    if not cls:
        raise HTTPException(404, 'کلاس یافت نشد')
    await db.delete(cls)
    await db.commit()
    s = await _load_school(db, school_id)
    return _school_out(s)
