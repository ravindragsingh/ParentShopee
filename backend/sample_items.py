SAMPLE_CHORE_TITLES = {t.lower() for t in [
    "Clean up your toys", "Put dirty clothes in hamper", "Pack your school bag",
    "Put shoes away", "Clear your plate after eating", "Feed the pet",
    "Water the plants", "Make your bed", "Tidy your bedroom", "Sort the recycling",
    "Dust the furniture", "Help carry groceries", "Set the dinner table",
    "Wipe down the bathroom sink", "Empty small bins", "Put books back on shelf",
    "Wash the dishes", "Take out the trash", "Fold the laundry", "Sweep the floor",
    "Vacuum the living room", "Clean the bathroom", "Wash the car", "Mop the floor",
    "Empty the dishwasher", "Wipe kitchen surfaces", "Tidy the living room",
    "Sweep the porch",
]}

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

def is_sample_chore(title: str) -> bool:
    return (title or "").strip().lower() in SAMPLE_CHORE_TITLES

def is_sample_shop_item(name: str) -> bool:
    return (name or "").strip().lower() in SAMPLE_SHOP_ITEM_NAMES
