from typing import Optional, List

from pydantic import BaseModel


class LoginBody(BaseModel):
    username: str
    password: str

class RegisterBody(BaseModel):
    name: str
    email: str
    username: str
    password: str
    dateOfBirth: str
    gender: str

class ActivateBody(BaseModel):
    token: str

class ResendActivationBody(BaseModel):
    username: str

class ForgotPasswordBody(BaseModel):
    username: str
    email: str

class ResetPasswordBody(BaseModel):
    token: str
    password: str

class ForgotUsernameBody(BaseModel):
    email: str

class AddKidBody(BaseModel):
    name: str
    username: str
    password: str
    avatar: Optional[str] = "🐶"
    birthMonth: int   # 1-12
    birthYear: int

class UpdateKidPasswordBody(BaseModel):
    password: str

class CoParentBody(BaseModel):
    name: str
    username: str
    password: str

class BonusPointsBody(BaseModel):
    points: float
    reason: Optional[str] = "Bonus points"

class WalletAdjustBody(BaseModel):
    amount: float          # positive = add, negative = deduct
    reason: Optional[str] = ""

class BehaviourBody(BaseModel):
    points: int  # positive = award, negative = remove

class ContactTicketBody(BaseModel):
    category: Optional[str] = "General Inquiry"
    subject: str
    message: str
    screenshot_b64: Optional[str] = None  # base64 data-URL of attached image

class MessageBody(BaseModel):
    receiver_id: str
    content: str
    quote_content: Optional[str] = None

class ChangeOwnPasswordBody(BaseModel):
    password: str

class ChoreCreate(BaseModel):
    title: str
    points: float
    description: Optional[str] = ""
    assignedKidId: Optional[str] = None        # single kid (legacy / repeat button)
    assignedKidIds: Optional[List[str]] = []   # multiple kids (new multi-assign)
    dueDate: Optional[str] = None
    imageEmoji: Optional[str] = "📋"

class RecurringCreate(BaseModel):
    title: str
    points: float
    description: Optional[str] = ""
    imageEmoji: Optional[str] = "📋"
    assignedKidId: Optional[str] = None
    recurrenceType: str                      # daily | weekly | monthly
    recurrenceDays: Optional[List[int]] = [] # weekday ints (0=Mon) for weekly
    recurrenceDom: Optional[int] = None      # day of month for monthly

class ChoreUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    points: Optional[float] = None
    assignedKidId: Optional[str] = None
    status: Optional[str] = None
    dueDate: Optional[str] = None
    imageEmoji: Optional[str] = None

class ShopItemCreate(BaseModel):
    name: str
    cost: float
    description: Optional[str] = ""
    imageEmoji: Optional[str] = "🎁"

class ShopItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    imageEmoji: Optional[str] = None

class ShopSettingsUpdate(BaseModel):
    enabled: bool

class DailyChoreItemCreate(BaseModel):
    kidId: str
    title: str
    points: Optional[float] = 2
    imageEmoji: Optional[str] = "✅"

class DailyChoreItemUpdate(BaseModel):
    title: Optional[str] = None
    points: Optional[float] = None
    imageEmoji: Optional[str] = None

class DailyChoreSettingsUpdate(BaseModel):
    kidId: str
    deductionEnabled: bool

class AdminUserUpdate(BaseModel):
    name:     Optional[str] = None
    email:    Optional[str] = None
    password: Optional[str] = None
    avatar:   Optional[str] = None

class AdminChoreUpdate(BaseModel):
    title:         Optional[str]   = None
    description:   Optional[str]   = None
    points:        Optional[float] = None
    status:        Optional[str]   = None
    assignedKidId: Optional[str]   = None
    dueDate:       Optional[str]   = None
    imageEmoji:    Optional[str]   = None
