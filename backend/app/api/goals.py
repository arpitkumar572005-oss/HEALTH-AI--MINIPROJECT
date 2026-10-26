"""
Health Goals API
Tracks user targets for Weight, Steps, Sleep, Hydration, and Exercise.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User, HealthGoal
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/goals", tags=["Health Goals"])

class GoalCreate(BaseModel):
    category: str = Field(..., description="'weight', 'steps', 'exercise', 'sleep', 'water', 'screening'")
    title: str
    current_value: float
    target_value: float
    unit: str
    status: str = "active"
    deadline: Optional[str] = "Ongoing"

class GoalUpdate(BaseModel):
    current_value: Optional[float] = None
    target_value: Optional[float] = None
    status: Optional[str] = None
    title: Optional[str] = None
    deadline: Optional[str] = None

class GoalResponse(BaseModel):
    id: str
    category: str
    title: str
    current_value: float
    target_value: float
    unit: str
    status: str
    deadline: Optional[str]
    progress_percentage: int

@router.get("", response_model=List[GoalResponse])
def get_user_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(HealthGoal).filter(HealthGoal.user_id == current_user.id).order_by(HealthGoal.created_at.asc()).all()
    res = []
    for g in items:
        # Calculate progress
        if g.target_value > 0:
            if g.category == "weight":
                # For weight loss towards target
                pct = min(100, max(0, int(round((1 - abs(g.current_value - g.target_value) / g.target_value) * 100))))
            else:
                pct = min(100, int(round((g.current_value / g.target_value) * 100)))
        else:
            pct = 100 if g.status == "completed" else 0
            
        res.append({
            "id": g.id,
            "category": g.category,
            "title": g.title,
            "current_value": g.current_value,
            "target_value": g.target_value,
            "unit": g.unit,
            "status": g.status,
            "deadline": g.deadline,
            "progress_percentage": pct
        })
    return res

@router.post("", response_model=GoalResponse)
def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = HealthGoal(
        user_id=current_user.id,
        category=data.category.lower(),
        title=data.title,
        current_value=data.current_value,
        target_value=data.target_value,
        unit=data.unit,
        status=data.status,
        deadline=data.deadline
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    pct = min(100, int(round((goal.current_value / goal.target_value) * 100))) if goal.target_value > 0 else 0
    return {
        "id": goal.id,
        "category": goal.category,
        "title": goal.title,
        "current_value": goal.current_value,
        "target_value": goal.target_value,
        "unit": goal.unit,
        "status": goal.status,
        "deadline": goal.deadline,
        "progress_percentage": pct
    }

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(HealthGoal).filter(HealthGoal.id == goal_id, HealthGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(goal, k, v)
        
    db.commit()
    db.refresh(goal)
    
    pct = min(100, int(round((goal.current_value / goal.target_value) * 100))) if goal.target_value > 0 else 0
    return {
        "id": goal.id,
        "category": goal.category,
        "title": goal.title,
        "current_value": goal.current_value,
        "target_value": goal.target_value,
        "unit": goal.unit,
        "status": goal.status,
        "deadline": goal.deadline,
        "progress_percentage": pct
    }

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(HealthGoal).filter(HealthGoal.id == goal_id, HealthGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal removed successfully"}
