# The canonical suggested-chore list -- each entry's `id` is what actually
# defines "picked from the list" (see routers/chores.py's sampleId handling
# and DBChore.sample_id): a chore created by selecting one of these keeps
# that id for life, regardless of how its title is edited afterward. Anything
# a guardian types that doesn't match one of these ids is custom by
# definition, no title matching involved -- ids are permanent identifiers,
# so don't reuse or repurpose one for a different chore; add a new entry and
# retire the old one if a suggestion is ever replaced.
SAMPLE_CHORES = [
    {"id": "clean-up-your-toys",         "title": "Clean up your toys"},
    {"id": "put-dirty-clothes-in-hamper","title": "Put dirty clothes in hamper"},
    {"id": "pack-your-school-bag",       "title": "Pack your school bag"},
    {"id": "put-shoes-away",             "title": "Put shoes away"},
    {"id": "clear-your-plate-after-eating","title": "Clear your plate after eating"},
    {"id": "feed-the-pet",               "title": "Feed the pet"},
    {"id": "water-the-plants",           "title": "Water the plants"},
    {"id": "make-your-bed",              "title": "Make your bed"},
    {"id": "tidy-your-bedroom",          "title": "Tidy your bedroom"},
    {"id": "sort-the-recycling",         "title": "Sort the recycling"},
    {"id": "dust-the-furniture",         "title": "Dust the furniture"},
    {"id": "help-carry-groceries",       "title": "Help carry groceries"},
    {"id": "set-the-dinner-table",       "title": "Set the dinner table"},
    {"id": "wipe-down-the-bathroom-sink","title": "Wipe down the bathroom sink"},
    {"id": "empty-small-bins",           "title": "Empty small bins"},
    {"id": "put-books-back-on-shelf",    "title": "Put books back on shelf"},
    {"id": "wash-the-dishes",            "title": "Wash the dishes"},
    {"id": "take-out-the-trash",         "title": "Take out the trash"},
    {"id": "fold-the-laundry",           "title": "Fold the laundry"},
    {"id": "sweep-the-floor",            "title": "Sweep the floor"},
    {"id": "vacuum-the-living-room",     "title": "Vacuum the living room"},
    {"id": "clean-the-bathroom",         "title": "Clean the bathroom"},
    {"id": "wash-the-car",               "title": "Wash the car"},
    {"id": "mop-the-floor",              "title": "Mop the floor"},
    {"id": "empty-the-dishwasher",       "title": "Empty the dishwasher"},
    {"id": "wipe-kitchen-surfaces",      "title": "Wipe kitchen surfaces"},
    {"id": "tidy-the-living-room",       "title": "Tidy the living room"},
    {"id": "sweep-the-porch",            "title": "Sweep the porch"},
]

SAMPLE_CHORE_IDS = {c["id"] for c in SAMPLE_CHORES}
# Kept only for the one-time sample_id backfill of pre-existing rows (see
# main.py startup) -- title matching is otherwise retired in favor of the
# permanent id above.
SAMPLE_CHORE_TITLES = {c["title"].lower() for c in SAMPLE_CHORES}

def sample_chore_id_for_title(title: str) -> str:
    """Best-effort id lookup by title, for the one-time legacy-row backfill
    only -- new chores must supply their id directly, never re-derive it
    from title text."""
    t = (title or "").strip().lower()
    for c in SAMPLE_CHORES:
        if c["title"].lower() == t:
            return c["id"]
    return None

SAMPLE_SHOP_ITEM_NAMES = {n.lower() for n in [
    "Extra Screen Time (30 min)", "Extra Screen Time (1 hour)", "Video Game Session",
    "Download a New App or Game", "YouTube / Streaming Hour", "Choose Dinner Tonight",
    "Dessert of Your Choice", "Ice Cream Trip", "Skip Vegetables at Dinner",
    "Breakfast in Bed", "Stay Up 30 Minutes Later", "Stay Up 1 Hour Later",
    "Skip One Chore (one-time)", "Movie Night Pick", "Friend Can Come Over",
    "Sleepover with a Friend", "Trip to the Park", "Bowling / Mini Golf Trip",
    "Choose Weekend Activity", "New Book of Your Choice", "New Toy or Small Gift",
    "Extra Pocket Money", "No Chores Day",
]}

def is_sample_shop_item(name: str) -> bool:
    return (name or "").strip().lower() in SAMPLE_SHOP_ITEM_NAMES
