from sqlalchemy import Column, String, Float, Integer

from database import Base


class DBUser(Base):
    __tablename__ = "users"
    id            = Column(String, primary_key=True)
    name          = Column(String, nullable=False)
    username      = Column(String, unique=True, nullable=False, index=True)
    password      = Column(String, nullable=False)
    google_id     = Column(String, unique=True, nullable=True, index=True)  # set for guardians who signed up/in via Google
    role          = Column(String, nullable=False)   # guardian | kid
    email         = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    gender        = Column(String, nullable=True)
    guardian_id     = Column(String, nullable=True)    # for kids: their guardian's id
    co_guardian_of  = Column(String, nullable=True)    # for co-guardians: primary guardian's id
    avatar        = Column(String, nullable=True)
    birth_month   = Column(Integer, nullable=True)   # kids: month of birth (1-12), used for approximate age
    birth_year    = Column(Integer, nullable=True)   # kids: year of birth, used for approximate age
    country            = Column(String, nullable=True)  # best-effort, from IP at registration
    city               = Column(String, nullable=True)  # best-effort, from IP at registration
    last_login_country = Column(String, nullable=True)  # best-effort, from IP on most recent login
    last_login_city    = Column(String, nullable=True)  # best-effort, from IP on most recent login
    last_login_at      = Column(String, nullable=True)  # ISO timestamp of most recent login
    chores_added_count     = Column(Float, default=0)  # lifetime count, shared by co-guardian
    shop_items_added_count = Column(Float, default=0)  # lifetime count, shared by co-guardian
    is_active               = Column(String, default="1")  # "1"/"0" — "0" only for guardians pending email activation
    activation_token        = Column(String, nullable=True)
    activation_token_expires = Column(String, nullable=True)  # ISO timestamp
    reset_token              = Column(String, nullable=True)
    reset_token_expires      = Column(String, nullable=True)  # ISO timestamp
    daily_deduction_enabled  = Column(String, default="1")  # kids: "1"/"0" — deduct points for unchecked daily chores at day's end
    shop_approval_enabled    = Column(String, default="0")  # family owner: "1"/"0" — kid purchases need guardian approval
    created_at    = Column(String, nullable=True)  # ISO timestamp of signup; NULL for accounts that predate this field
    last_active_at = Column(String, nullable=True)  # ISO timestamp of most recent authenticated request (any activity, not just login)
    is_suspended  = Column(String, default="0")     # "1"/"0" — admin moderation flag; blocks login and API access
    pin                = Column(String, nullable=True)   # 6-digit PIN — kid/co-guardian profiles unlock with this instead of a password
    pin_attempts       = Column(Integer, default=0)      # consecutive failed PIN attempts, for lockout
    pin_locked_until   = Column(String, nullable=True)    # ISO timestamp; PIN entry blocked until this passes
    pin_auto_generated = Column(String, default="0")      # "1" = system-generated during migration, guardian hasn't set their own yet
    push_token         = Column(String, nullable=True)    # FCM token for the device this profile was last active on (native apps only)


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


class DBDailyChoreItem(Base):
    __tablename__ = "daily_chore_items"
    id          = Column(String, primary_key=True)
    kid_id      = Column(String, nullable=False, index=True)
    title       = Column(String, nullable=False)
    image_emoji = Column(String, default="✅")
    points      = Column(Float, default=2)
    order_index = Column(Integer, default=0)
    is_active   = Column(String, default="1")   # "1"/"0" — soft delete
    status      = Column(String, default="open")  # open | pending | complete — for `reset_date`
    reset_date  = Column(String, nullable=True)  # YYYY-MM-DD the `status` cycle applies to
    created_at  = Column(String, nullable=False)


class DBShopPurchase(Base):
    __tablename__ = "shop_purchases"
    id          = Column(String, primary_key=True)
    kid_id      = Column(String, nullable=False, index=True)
    shop_item_id = Column(String, nullable=True)   # best-effort link; item may later be edited/deleted
    item_name   = Column(String, nullable=False)   # snapshot at request time
    image_emoji = Column(String, default="🎁")
    cost        = Column(Float, nullable=False)
    status      = Column(String, default="pending")  # pending | approved | rejected
    created_at  = Column(String, nullable=False)
    resolved_at = Column(String, nullable=True)


class DBGame(Base):
    """Catalog of first-party mini-games kids can unlock with points. Global for
    now (not per-family) -- a single small catalog to prove the buy -> approve ->
    timed-unlock mechanic before building out a per-age-group library."""
    __tablename__ = "games"
    id               = Column(String, primary_key=True)   # slug, e.g. "memory-match"
    name             = Column(String, nullable=False)
    description      = Column(String, default="")
    image_emoji      = Column(String, default="🎮")
    cost             = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    is_active        = Column(String, default="1")   # "1"/"0"


class DBGameSession(Base):
    """One kid's purchased play session for a game. Unlike a shop purchase
    (consumed instantly), a game pass sits unopened until the kid taps Play --
    that's when started_at/expires_at are set and the countdown actually begins."""
    __tablename__ = "game_sessions"
    id               = Column(String, primary_key=True)
    kid_id           = Column(String, nullable=False, index=True)
    game_id          = Column(String, nullable=False)
    game_name        = Column(String, nullable=False)   # snapshot at purchase time
    image_emoji      = Column(String, default="🎮")
    cost             = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    status           = Column(String, default="pending", index=True)  # pending | approved | active | rejected | expired
    created_at       = Column(String, nullable=False)
    resolved_at      = Column(String, nullable=True)   # approved/rejected timestamp
    started_at       = Column(String, nullable=True)   # kid tapped Play
    expires_at       = Column(String, nullable=True)   # started_at + duration_minutes


class DBFamilyGameSetting(Base):
    """Per-family visibility for a catalog game. Opt-in: no row (or enabled='0')
    means hidden from that family's kids, even though the game exists globally --
    a guardian must explicitly turn a game on before their kids can buy it."""
    __tablename__ = "family_game_settings"
    family_id = Column(String, primary_key=True)
    game_id   = Column(String, primary_key=True)
    enabled   = Column(String, default="0")   # "1"/"0"


class DBSupportTicket(Base):
    __tablename__ = "support_tickets"
    id          = Column(String, primary_key=True)
    user_id     = Column(String, nullable=False, index=True)
    user_name   = Column(String, nullable=False)   # snapshot at submission time
    username    = Column(String, nullable=False)   # snapshot at submission time
    user_role   = Column(String, nullable=False)
    category    = Column(String, nullable=False)
    subject     = Column(String, nullable=False)
    message     = Column(String, nullable=False)
    status      = Column(String, default="open")   # open | resolved
    created_at  = Column(String, nullable=False)
    resolved_at = Column(String, nullable=True)


class DBSupportTicketReply(Base):
    __tablename__ = "support_ticket_replies"
    id          = Column(String, primary_key=True)
    ticket_id   = Column(String, nullable=False, index=True)
    is_admin    = Column(String, default="0")   # "1" = support team reply, "0" = ticket owner's follow-up
    sender_name = Column(String, nullable=False)
    message     = Column(String, nullable=False)
    created_at  = Column(String, nullable=False)
