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

class GoogleAuthBody(BaseModel):
    credential: str   # Google Identity Services ID token (JWT)

class GoogleCompleteBody(BaseModel):
    credential: str
    dateOfBirth: str
    gender: str

class ResolveLoginIdentifierBody(BaseModel):
    identifier: str   # username or email

class FirebaseSessionBody(BaseModel):
    idToken: str   # Firebase Auth ID token (JWT), from the client SDK

class RegisterPrecheckBody(BaseModel):
    name: str
    email: str
    username: str
    dateOfBirth: str
    gender: str

class RegisterFinalizeBody(BaseModel):
    idToken: str
    name: str
    dateOfBirth: str
    gender: str
    username: Optional[str] = None   # omitted for Google sign-ups (auto-generated from email)
    referralCode: Optional[str] = None   # the referring guardian's shareable code, if any

class ActivateBody(BaseModel):
    token: str

class ResendActivationBody(BaseModel):
    username: str

class ForgotPasswordBody(BaseModel):
    username: str
    email: str

class ForgotUsernameBody(BaseModel):
    email: str

class AddKidBody(BaseModel):
    name: str
    pin: str
    avatar: Optional[str] = "🐶"
    birthMonth: int   # 1-12
    birthYear: int

class UpdatePinBody(BaseModel):
    pin: str

class UpdateKidBirthdateBody(BaseModel):
    birthMonth: int   # 1-12
    birthYear: int

class PushTokenBody(BaseModel):
    token: str

class CoGuardianBody(BaseModel):
    name: str
    pin: str
    avatar: Optional[str] = "🧑"

class CoGuardianInviteBody(BaseModel):
    email: str

class CoGuardianInviteAcceptBody(BaseModel):
    token: str
    # Unused for a "resend device access" link -- that one re-logs in an
    # existing profile unchanged, no new name/PIN needed.
    name: Optional[str] = None
    pin: Optional[str] = None
    avatar: Optional[str] = "🧑"

class ResendCoGuardianAccessBody(BaseModel):
    email: Optional[str] = None

class ProfileEnterBody(BaseModel):
    pin: Optional[str] = None

class RecoverPinBody(BaseModel):
    idToken: str   # fresh Firebase Auth ID token (JWT) -- password or Google sign-in, either works
    newPin: str

class BonusPointsBody(BaseModel):
    points: float
    reason: Optional[str] = "Bonus points"

class WalletAdjustBody(BaseModel):
    amount: float          # positive = add, negative = deduct
    reason: Optional[str] = ""

class SavingsTransferBody(BaseModel):
    amount: float           # always positive; direction is which endpoint you call

class WalletGoalBody(BaseModel):
    name: Optional[str] = None     # null/empty clears the goal, alongside target
    target: Optional[float] = None

class BehaviourBody(BaseModel):
    points: int  # positive = award, negative = remove

class ContactTicketBody(BaseModel):
    category: Optional[str] = "General Inquiry"
    subject: str
    message: str
    screenshot_b64: Optional[str] = None  # base64 data-URL of attached image

class TicketReplyBody(BaseModel):
    message: str

class ReferralPayoutActionBody(BaseModel):
    note: Optional[str] = None   # gift card confirmation code (fulfill) or rejection reason (reject)

class AdminMessageUserBody(BaseModel):
    subject: str
    message: str

class MessageBody(BaseModel):
    receiver_id: str
    content: str
    quote_content: Optional[str] = None

class ChoreCreate(BaseModel):
    title: str
    points: float
    description: Optional[str] = ""
    assignedKidId: Optional[str] = None        # single kid (legacy / repeat button)
    assignedKidIds: Optional[List[str]] = []   # multiple kids (new multi-assign)
    dueDate: Optional[str] = None
    imageEmoji: Optional[str] = "📋"
    sampleId: Optional[str] = None   # which SAMPLE_CHORES entry this was picked from, if any

class RecurringCreate(BaseModel):
    title: str
    points: float
    description: Optional[str] = ""
    imageEmoji: Optional[str] = "📋"
    assignedKidId: Optional[str] = None
    recurrenceType: str                      # daily | weekly | monthly
    recurrenceDays: Optional[List[int]] = [] # weekday ints (0=Mon) for weekly
    recurrenceDom: Optional[int] = None      # day of month for monthly
    sampleId: Optional[str] = None   # which SAMPLE_CHORES entry this was picked from, if any

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
    name:       Optional[str] = None
    email:      Optional[str] = None
    pin:        Optional[str] = None   # kid / co-guardian profiles only -- guardian passwords go through /send-password-reset now
    avatar:     Optional[str] = None
    birthMonth: Optional[int] = None   # 1-12 -- guardians and kids alike
    birthYear:  Optional[int] = None

class AdminContentAdminCreate(BaseModel):
    name:     str
    username: str
    email:    str

class AdminContentAdminUpdate(BaseModel):
    name:     Optional[str] = None
    username: Optional[str] = None

class AdminChoreUpdate(BaseModel):
    title:         Optional[str]   = None
    description:   Optional[str]   = None
    points:        Optional[float] = None
    status:        Optional[str]   = None
    assignedKidId: Optional[str]   = None
    dueDate:       Optional[str]   = None
    imageEmoji:    Optional[str]   = None

class AdminLimitsUpdate(BaseModel):
    choresLimit:    Optional[float] = None   # null = clear override, use the site-wide default
    shopItemsLimit: Optional[float] = None

class LearningVisibilityUpdate(BaseModel):
    enabled: bool
    kidIds: Optional[List[str]] = None   # None = every kid in the family; otherwise just these

class LearningPointsUpdate(BaseModel):
    points: float

class LearningCompleteBody(BaseModel):
    score: int
    total: int

class QuestLogBody(BaseModel):
    note: str

class ReadingLogAssignBody(BaseModel):
    kidId: str
    volumeId: Optional[str] = None
    title: str
    author: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    description: Optional[str] = None
    totalPages: Optional[int] = None
    genre: Optional[str] = None
    gradeLevel: Optional[int] = None
    format: Optional[str] = None
    points: float = 10

class ReadingLogStartBody(BaseModel):
    volumeId: Optional[str] = None
    title: str
    author: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    description: Optional[str] = None
    totalPages: Optional[int] = None
    genre: Optional[str] = None
    gradeLevel: Optional[int] = None
    format: Optional[str] = None

class ReadingLogEntryBody(BaseModel):
    note: str
    pages: Optional[int] = None

class ReadingLogCompleteBody(BaseModel):
    summary: str

class ReadingLogPointsBody(BaseModel):
    points: float

class AdminTopicCreate(BaseModel):
    id: str              # slug, admin-supplied
    section: str          # "future-ready" | "quest"
    title: str
    emoji: Optional[str] = "📘"

class AdminTopicUpdate(BaseModel):
    title:      Optional[str] = None
    emoji:      Optional[str] = None
    orderIndex: Optional[int] = None
    isActive:   Optional[bool] = None

class AdminModuleCreate(BaseModel):
    id: str               # slug, admin-supplied (e.g. "ai-4-6-p3")
    section: str           # "future-ready" | "quest"
    topic: str             # DBContentTopic.id
    ageMin: int
    ageMax: int
    title: str
    points: float
    orderIndex: Optional[int] = None

class AdminModuleMetaUpdate(BaseModel):
    title:      Optional[str] = None
    points:     Optional[float] = None
    ageMin:     Optional[int] = None
    ageMax:     Optional[int] = None
    orderIndex: Optional[int] = None
    isPremium:  Optional[bool] = None
    isActive:   Optional[bool] = None   # lets an admin undo a deactivation

class AdminModuleContentUpdate(BaseModel):
    content: dict          # {"slides":[...],"quiz":[...]} or {"activities":[...]} -- shape not enforced here

class AdminModuleStatusUpdate(BaseModel):
    status: str            # "draft" | "published"
