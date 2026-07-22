from datetime import date, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from helpers import now
from models import DBChore, DBShopItem, DBTransaction, DBUser, DBWallet


def seed_db(db: Session):
    if db.query(DBUser).count() > 0:
        return   # already seeded

    today = date.today()

    for u in [
        DBUser(id="parent1", name="Mom",     username="parent1", password="pass1", role="parent", email="mom@family.com", date_of_birth="1980-03-10", gender="female", created_at=now(), pin="246810", pin_auto_generated="0"),
        DBUser(id="parent2", name="Dad",     username="parent2", password="pass2", role="parent", email="dad@family.com", date_of_birth="1978-07-22", gender="male", created_at=now(), pin="864203", pin_auto_generated="0"),
        DBUser(id="kid1",    name="Alice",   username="kid1",    password="pass1", role="kid",    parent_id="parent1", avatar="🐱", created_at=now(), pin="123456", pin_auto_generated="0"),
        DBUser(id="kid2",    name="Bob",     username="kid2",    password="pass1", role="kid",    parent_id="parent1", avatar="🐶", created_at=now(), pin="284917", pin_auto_generated="0"),
        DBUser(id="kid3",    name="Charlie", username="kid3",    password="pass1", role="kid",    parent_id="parent2", avatar="🦁", created_at=now(), pin="573920", pin_auto_generated="0"),
    ]:
        db.add(u)

    for c in [
        # parent1 family chores (kid1 = Alice, kid2 = Bob)
        DBChore(id=str(uuid4()), title="Wash the dishes",           description="Wash and dry all dishes after dinner.",                   points=10, image_emoji="🍽️", status="open",     assigned_kid_id="kid1", due_date=(today+timedelta(days=3)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Take out the trash",        description="Take all trash bags to the bin outside.",                  points= 5, image_emoji="🗑️", status="open",     due_date=(today+timedelta(days=1)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Make your bed",             description="Straighten sheets, fluff pillows, and tidy your bedroom.", points= 5, image_emoji="🛏️", status="open",     assigned_kid_id="kid1", created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Water the plants",          description="Water all indoor and balcony plants.",                     points= 8, image_emoji="🌿", status="open",     assigned_kid_id="kid2", due_date=(today+timedelta(days=2)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Set the dinner table",      description="Lay out plates, cutlery, and glasses for the family.",     points= 5, image_emoji="🥄", status="open",     created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Feed the pet",              description="Fill the food and water bowl for the family pet.",         points= 6, image_emoji="🐕", status="open",     created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Sweep the porch",           description="Sweep leaves and dirt off the front porch.",               points= 8, image_emoji="🧹", status="open",     assigned_kid_id="kid2", due_date=(today+timedelta(days=4)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Wash the car",              description="Rinse, soap, and dry the family car.",                     points=20, image_emoji="🚗", status="open",     assigned_kid_id="kid2", due_date=(today-timedelta(days=1)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Vacuum the living room",    description="Vacuum carpets and clean under the sofa.",                 points=15, image_emoji="🏠", status="pending",  assigned_kid_id="kid2", completed_by_kid_id="kid2", due_date=(today+timedelta(days=1)).isoformat(), created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Wipe down kitchen counter", description="Clean all kitchen surfaces with a damp cloth.",            points= 7, image_emoji="🧼", status="pending",  completed_by_kid_id="kid1", created_at=now(), family_id="parent1"),
        DBChore(id=str(uuid4()), title="Take out recycling",        description="Sort and take the recycling bins to the kerb.",            points= 8, image_emoji="♻️", status="complete", completed_by_kid_id="kid1", created_at=now(), family_id="parent1", completed_at=now()),
        DBChore(id=str(uuid4()), title="Mop the kitchen floor",     description="Mop the kitchen floor after sweeping.",                    points=15, image_emoji="🪣", status="complete", assigned_kid_id="kid2", completed_by_kid_id="kid2", created_at=now(), family_id="parent1", completed_at=now()),
        # parent2 family chores (kid3 = Charlie)
        DBChore(id=str(uuid4()), title="Fold the laundry",          description="Fold clean clothes from the dryer and put them away.",     points=12, image_emoji="🧺", status="open",     assigned_kid_id="kid3", due_date=(today+timedelta(days=5)).isoformat(), created_at=now(), family_id="parent2"),
        DBChore(id=str(uuid4()), title="Clean the garage",          description="Tidy up and sweep the garage floor.",                      points=25, image_emoji="🏡", status="open",     due_date=(today-timedelta(days=2)).isoformat(), created_at=now(), family_id="parent2"),
        DBChore(id=str(uuid4()), title="Organise the bookshelf",    description="Sort books by size and put them back neatly.",             points=10, image_emoji="📚", status="pending",  assigned_kid_id="kid3", completed_by_kid_id="kid3", due_date=(today-timedelta(days=1)).isoformat(), created_at=now(), family_id="parent2"),
        DBChore(id=str(uuid4()), title="Clean the bathroom",        description="Scrub the sink, toilet, and wipe down surfaces.",          points=20, image_emoji="🚽", status="complete", assigned_kid_id="kid3", completed_by_kid_id="kid3", created_at=now(), family_id="parent2", completed_at=now()),
    ]:
        db.add(c)

    for s in [
        DBShopItem(id=str(uuid4()), name="Extra Screen Time (30 min)", description="Get 30 extra minutes of screen time today.", cost=10, image_emoji="📱", created_at=now(), family_id="parent1"),
        DBShopItem(id=str(uuid4()), name="Choose Dinner",              description="Pick what the family eats for dinner.",       cost=25, image_emoji="🍕", created_at=now(), family_id="parent1"),
        DBShopItem(id=str(uuid4()), name="Stay Up 1 Hour Later",       description="Extend bedtime by one hour on a weekend.",   cost=20, image_emoji="🌙", created_at=now(), family_id="parent1"),
        DBShopItem(id=str(uuid4()), name="Movie Night Pick",           description="Choose the movie for family movie night.",   cost=15, image_emoji="🎬", created_at=now(), family_id="parent1"),
        DBShopItem(id=str(uuid4()), name="Extra Screen Time (30 min)", description="Get 30 extra minutes of screen time today.", cost=10, image_emoji="📱", created_at=now(), family_id="parent2"),
        DBShopItem(id=str(uuid4()), name="Choose Dinner",              description="Pick what the family eats for dinner.",       cost=25, image_emoji="🍕", created_at=now(), family_id="parent2"),
        DBShopItem(id=str(uuid4()), name="Stay Up 1 Hour Later",       description="Extend bedtime by one hour on a weekend.",   cost=20, image_emoji="🌙", created_at=now(), family_id="parent2"),
        DBShopItem(id=str(uuid4()), name="Movie Night Pick",           description="Choose the movie for family movie night.",   cost=15, image_emoji="🎬", created_at=now(), family_id="parent2"),
    ]:
        db.add(s)

    for kid_id, balance in [("kid1", 30), ("kid2", 0), ("kid3", 20)]:
        db.add(DBWallet(kid_id=kid_id, balance=balance))

    db.add(DBTransaction(id=str(uuid4()), kid_id="kid1", type="earned", amount=30, description="Bonus points (seed)",        timestamp=now()))
    db.add(DBTransaction(id=str(uuid4()), kid_id="kid3", type="earned", amount=20, description="Earned: Clean the bathroom", timestamp=now()))

    db.commit()
