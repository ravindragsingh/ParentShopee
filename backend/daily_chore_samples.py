from typing import List, Optional, TypedDict


class DailyChoreSample(TypedDict):
    title: str
    imageEmoji: str


# Age bands for auto-generating a kid's Daily Chores checklist. Each band lists
# more than 10 candidates so there's variety; generation takes the first 10.
# (max_age, label, items)
_BANDS = [
    (5, "Ages 3-5", [
        ("Brush Your Teeth", "🦷"), ("Wash Your Hands", "🧼"), ("Put Away Your Toys", "🧸"),
        ("Put Shoes By the Door", "👟"), ("Hang Up Your Towel", "🛁"), ("Comb Your Hair", "💇"),
        ("Put Cup in the Sink", "🥤"), ("Feed the Family Pet", "🐾"), ("Water One Plant", "🌱"),
        ("Pick Up Your Books", "📖"), ("Put Dirty Clothes Away", "👕"), ("Zip Up Your Jacket", "🧥"),
    ]),
    (8, "Ages 6-8", [
        ("Make Your Bed", "🛏️"), ("Brush Teeth Twice Daily", "🦷"), ("Pack Your School Bag", "🎒"),
        ("Set Out Tomorrow's Clothes", "👕"), ("Clear Your Plate", "🍽️"), ("Feed the Pet", "🐕"),
        ("Wipe the Bathroom Sink", "🪥"), ("Tidy Your Desk", "🖊️"), ("Put Away Clean Clothes", "🧺"),
        ("Water the Plants", "🌿"), ("Help Pack Your Lunch", "🍱"), ("Put Shoes on the Rack", "👟"),
        ("Straighten Your Bookshelf", "📚"),
    ]),
    (12, "Ages 9-12", [
        ("Pack Your Own Bag", "🎒"), ("Tidy Your Bedroom", "🏠"), ("Empty Your Lunchbox", "🍱"),
        ("Wipe Down the Table", "🧽"), ("Take Out Small Trash", "🗑️"), ("Charge Your Devices", "🔌"),
        ("Set Your Morning Alarm", "⏰"), ("Put Away Shoes and Bag", "🎒"), ("Help Set the Table", "🥄"),
        ("Fold Your Own Laundry", "🧺"), ("Wipe Bathroom Counter", "🪥"), ("Check Your School Planner", "📋"),
        ("Walk the Dog", "🐕"),
    ]),
    (999, "Ages 13-17", [
        ("Make Your Bed", "🛏️"), ("Do a Quick Room Tidy", "🧹"), ("Pack Your Bag for Tomorrow", "🎒"),
        ("Wipe Down Bathroom Counter", "🪥"), ("Check Tomorrow's Schedule", "📅"), ("Log Off Screens on Time", "📵"),
        ("Take Out Personal Trash", "🗑️"), ("Feed and Walk the Pet", "🐕"), ("Put Away Clean Laundry", "🧺"),
        ("Prep Your Own Lunch", "🥪"), ("Charge Devices Overnight", "🔌"), ("Wipe Kitchen Counter After Use", "🧽"),
        ("Set a Study Reminder", "⏰"), ("Check In on Chores App", "✅"),
    ]),
]

# Used when a kid's age isn't known yet (no birth month/year set) — a safe, general
# middle-ground list so the feature still works out of the box.
_DEFAULT_BAND = _BANDS[1][2]

MAX_DAILY_CHORE_ITEMS = 10


def get_daily_chore_bank(age: Optional[int]) -> List[DailyChoreSample]:
    """Up to MAX_DAILY_CHORE_ITEMS age-appropriate daily chore suggestions."""
    if age is None:
        items = _DEFAULT_BAND
    else:
        items = next((band for max_age, _label, band in _BANDS if age <= max_age), _BANDS[-1][2])
    return [{"title": t, "imageEmoji": e} for t, e in items[:MAX_DAILY_CHORE_ITEMS]]


def get_all_daily_chore_templates() -> List[dict]:
    """Full template catalog grouped by age band, for a parent's optional
    "start from template" picker when manually adding a daily chore."""
    return [
        {"label": label, "items": [{"title": t, "imageEmoji": e} for t, e in items]}
        for _max_age, label, items in _BANDS
    ]
