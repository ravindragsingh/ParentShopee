from sqlalchemy import Column, String, Float

from database import Base


class DBUser(Base):
    __tablename__ = "users"
    id            = Column(String, primary_key=True)
    name          = Column(String, nullable=False)
    username      = Column(String, unique=True, nullable=False, index=True)
    password      = Column(String, nullable=False)
    role          = Column(String, nullable=False)   # parent | kid
    email         = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    gender        = Column(String, nullable=True)
    parent_id     = Column(String, nullable=True)    # for kids: their parent's id
    co_parent_of  = Column(String, nullable=True)    # for co-parents: primary parent's id
    avatar        = Column(String, nullable=True)
    country            = Column(String, nullable=True)  # best-effort, from IP at registration
    city               = Column(String, nullable=True)  # best-effort, from IP at registration
    last_login_country = Column(String, nullable=True)  # best-effort, from IP on most recent login
    last_login_city    = Column(String, nullable=True)  # best-effort, from IP on most recent login
    chores_added_count     = Column(Float, default=0)  # lifetime count, shared by co-parent
    shop_items_added_count = Column(Float, default=0)  # lifetime count, shared by co-parent
    is_active               = Column(String, default="1")  # "1"/"0" — "0" only for parents pending email activation
    activation_token        = Column(String, nullable=True)
    activation_token_expires = Column(String, nullable=True)  # ISO timestamp
    reset_token              = Column(String, nullable=True)
    reset_token_expires      = Column(String, nullable=True)  # ISO timestamp


class DBChore(Base):
    __tablename__ = "chores"
    id                  = Column(String, primary_key=True)
    title               = Column(String, nullable=False)
    description         = Column(String, default="")
    points              = Column(Float,  default=0)
    image_emoji         = Column(String, default="📋")
    status              = Column(String, default="open", index=True)
    assigned_kid_id     = Column(String, nullable=True)
    completed_by_kid_id = Column(String, nullable=True)
    due_date            = Column(String, nullable=True)
    expired_at          = Column(String, nullable=True)
    completed_at        = Column(String, nullable=True)
    created_at          = Column(String, nullable=False)
    family_id           = Column(String, nullable=True, index=True)
    template_id         = Column(String, nullable=True, index=True)
    scheduled_date      = Column(String, nullable=True)


class DBRecurringTemplate(Base):
    __tablename__ = "recurring_templates"
    id              = Column(String, primary_key=True)
    title           = Column(String, nullable=False)
    description     = Column(String, default="")
    points          = Column(Float,  default=0)
    image_emoji     = Column(String, default="📋")
    assigned_kid_id = Column(String, nullable=True)
    recurrence_type = Column(String, nullable=False)   # daily | weekly | monthly
    recurrence_days = Column(String, nullable=True)    # CSV of weekday ints e.g. "0,2,4"
    recurrence_dom  = Column(String, nullable=True)    # day-of-month for monthly
    family_id       = Column(String, nullable=True, index=True)
    is_active       = Column(String, default="1")      # "1" or "0"
    created_at      = Column(String, nullable=False)


class DBShopItem(Base):
    __tablename__ = "shop_items"
    id          = Column(String, primary_key=True)
    name        = Column(String, nullable=False)
    description = Column(String, default="")
    cost        = Column(Float,  nullable=False)
    image_emoji = Column(String, default="🎁")
    created_at  = Column(String, nullable=False)
    family_id   = Column(String, nullable=True, index=True)


class DBMessage(Base):
    __tablename__ = "messages"
    id            = Column(String, primary_key=True)
    sender_id     = Column(String, nullable=False, index=True)
    receiver_id   = Column(String, nullable=False, index=True)
    content       = Column(String, nullable=False)
    timestamp     = Column(String, nullable=False)
    is_read       = Column(String, default="false")
    quote_content = Column(String, nullable=True)   # quoted message for replies


class DBWallet(Base):
    __tablename__ = "wallets"
    kid_id  = Column(String, primary_key=True)
    balance = Column(Float,  default=0)


class DBTransaction(Base):
    __tablename__ = "transactions"
    id          = Column(String, primary_key=True)
    kid_id      = Column(String, nullable=False, index=True)
    type        = Column(String, nullable=False)   # earned | spent
    amount      = Column(Float,  nullable=False)
    description = Column(String, nullable=False)
    timestamp   = Column(String, nullable=False)
