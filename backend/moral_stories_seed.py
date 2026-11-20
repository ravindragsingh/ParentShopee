from sqlalchemy.orm import Session

from helpers import now
from models import DBLearningModule
from seed import AGE_BANDS, _insert_topic_if_missing

# Starter catalog for the Moral Stories section (see routers/moral_stories.py).
# Same insert-only-if-missing convention as seed.migrate_legacy_learning_content
# -- never touches a row that already exists (including one an admin has since
# edited through the Content panel), so it's safe to run on every boot. More
# topics/stories from here on are meant to be added through the admin Content
# panel, not by growing this file -- this just seeds enough real content for
# the section to be useful on day one.
#
# Each story reuses Future-Ready's exact {"slides": [...], "quiz": [...]}
# content shape -- a story page is a "slide" (just emoji/title/text, no
# interactive widget needed), the post-story questions are its "quiz". Three
# age bands per topic for now (4-6, 7-9, 10-13); 13-17 is left for an admin to
# add later, same as any other topic/age-band gap.

_TOPICS = [
    # (topic_id, title, emoji)
    ("honesty", "Honesty", "🤝"),
    ("sharing-kindness", "Sharing & Kindness", "💝"),
    ("courage", "Courage & Perseverance", "🦁"),
]

_BANDS = [b for b in AGE_BANDS if b[1] <= 13]  # (4,6,10), (7,9,12), (10,13,15)


def _story(emoji, pages, quiz):
    return {
        "slides": [{"emoji": emoji, "title": t, "text": txt} for t, txt in pages],
        "quiz": [
            {"question": q, "choices": choices, "correctIndex": correct, "explanation": expl}
            for q, choices, correct, expl in quiz
        ],
    }


_HONESTY_4_6 = _story("🏺", [
    ("Oops!", "Max was playing ball inside. He threw it too high and -- CRASH! Mommy's favorite vase broke into pieces."),
    ("Uh oh...", "Max felt scared. \"Mommy will be so upset,\" he thought. He wanted to hide the pieces and say nothing."),
    ("A little voice", "But a little voice inside him said, \"Telling the truth is the brave thing to do.\""),
    ("Telling Mommy", "Max found his mom. \"Mommy, I broke your vase. I was playing ball inside and I shouldn't have.\""),
    ("A big hug", "Mommy was sad about the vase, but she hugged Max tight. \"Thank you for telling me the truth. That took courage.\""),
    ("Being a hero", "From that day on, Max always remembered: telling the truth, even when it's hard, makes you a hero."),
], [
    ("What did Max break?", ["Mommy's vase", "His toy car"], 0, "Max broke mommy's favorite vase while playing ball inside."),
    ("What did Max do after he broke the vase?", ["He hid and said nothing", "He told his mommy the truth"], 1, "Max was brave and told his mommy what happened, even though he was scared."),
    ("How did Mommy feel when Max told the truth?", ["Proud of him for being honest", "Angry that he told her"], 0, "Mommy was sad about the vase but proud that Max was honest."),
])

_HONESTY_7_9 = _story("🏺", [
    ("A wild throw", "Priya loved playing catch with her brother in the living room, even though Mom always said \"Not inside!\" One afternoon, a wild throw sent the ball flying -- and it smashed straight into Grandma's antique vase."),
    ("Shattered", "The vase shattered into a dozen pieces. Priya's heart started pounding. That vase had been in the family for fifty years."),
    ("A tempting idea", "\"What if I just swept it up and said the cat knocked it over?\" Priya thought. Nobody would ever know... except her."),
    ("That twisty feeling", "She sat with that thought for a minute, but it made her stomach twist. Blaming the cat felt worse than breaking the vase ever could."),
    ("Telling Mom", "When Mom came home, Priya took a deep breath. \"Mom, I need to tell you something. I was playing ball inside and I broke Grandma's vase. I'm really sorry.\""),
    ("Proud, not just upset", "Mom was quiet for a moment, clearly disappointed about the vase -- but then she said, \"I'm proud of you for telling me, even knowing I might be upset.\""),
    ("Something stronger", "They couldn't fix the vase, but they glued a few pieces into a little flowerpot together. Priya realized that the truth, even when it costs something, always builds something stronger in its place: trust."),
], [
    ("What almost tempted Priya to lie?", ["Blaming the family cat for breaking the vase", "Blaming her brother for breaking the vase"], 0, "Priya considered saying the cat had knocked the vase over, so no one would know it was her."),
    ("Why did Priya decide to tell the truth instead?", ["Lying felt worse than the mistake itself", "She thought she'd get a reward"], 0, "The thought of lying made her stomach twist -- it felt worse than owning up to the mistake."),
    ("What did Priya and her mom do with the broken vase in the end?", ["Threw all the pieces away and forgot about it", "Turned some of the pieces into a little flowerpot together"], 1, "They couldn't fix the vase, but they made something new out of some of its pieces together."),
    ("What's the main lesson of this story?", ["Honesty builds trust, even when it's hard", "You should never play ball indoors"], 0, "Telling the truth, even when it costs something, builds trust."),
])

_HONESTY_10_13 = _story("🏺", [
    ("A quiet afternoon", "Arjun was home alone studying when his cousin Dev came over to hang out. They started tossing a cricket ball back and forth in the hallway -- just for fun, just for a minute. Then Dev's throw went wide, and it hit the glass cabinet, shattering his grandmother's ceramic vase -- the one she'd brought all the way from her village forty years ago."),
    ("An easy excuse", "Dev panicked. \"Your parents will never know it was us. Let's just say it fell on its own -- maybe the shelf wasn't stable.\""),
    ("Who he wanted to be", "Arjun's mind raced. A convincing lie was right there, practically ready-made. No one would question it. But something about it didn't sit right -- this wasn't just about getting caught, it was about who he wanted to be."),
    ("Saying it out loud", "\"I don't think I can do that,\" Arjun said finally. \"Even if no one ever finds out, I'll know. And Grandma deserves to know the truth about something that mattered to her.\""),
    ("The whole story", "When his parents got home, Arjun explained everything -- including that Dev had wanted to cover it up, and that he'd almost gone along with it."),
    ("What it really costs", "His dad was upset about the vase, but said something Arjun never forgot: \"Anyone can tell the truth when it's easy. It only really counts when it costs you something.\""),
    ("Worth more than before", "Dev was a little embarrassed, but he admitted later that he respected Arjun for not caving to the easy way out. The vase was gone -- but Arjun's word, going forward, was worth more than it had been before."),
], [
    ("What excuse did Dev suggest they use?", ["Blame it on an unstable shelf", "Blame it on a neighbor's cat"], 0, "Dev suggested they say the vase fell on its own because the shelf wasn't stable."),
    ("What ultimately convinced Arjun to tell the truth?", ["Fear of being grounded", "Caring about who he wanted to be, regardless of being caught"], 1, "Arjun realized the decision mattered beyond just avoiding punishment -- it was about his own character."),
    ("What did Arjun's dad mean by \"it only really counts when it costs you something\"?", ["Honesty is only meaningful when it's easy", "Real honesty is proven in moments when lying would actually benefit you"], 1, "Telling the truth is most meaningful exactly when a lie would have been easier or more convenient."),
    ("How did Dev react afterward?", ["He stopped being friends with Arjun", "He respected Arjun for not taking the easy way out"], 1, "Dev admitted he respected Arjun's choice, even though it was awkward for him."),
])

_SHARING_4_6 = _story("☔", [
    ("Rainy recess", "It started raining hard at recess. Mia had a big umbrella. Her friend Sam had none and was getting all wet."),
    ("Shivering alone", "Sam stood under a tree, shivering, watching the other kids run to their buses."),
    ("Come on over!", "Mia walked over. \"Come under my umbrella! We can both fit.\""),
    ("A big smile", "Sam smiled big. They walked together, laughing, under one umbrella."),
    ("A little wet, a lot happy", "Mia got a little wet on her side -- but she didn't mind one bit. Sharing made the rainy day feel warm and happy."),
    ("A simple truth", "Being kind doesn't cost anything, but it means everything."),
], [
    ("Why was Sam getting wet?", ["He didn't have an umbrella", "He wanted to get wet"], 0, "Sam didn't have an umbrella of his own, so he was getting soaked in the rain."),
    ("What did Mia do to help?", ["She shared her umbrella with Sam", "She ran home without Sam"], 0, "Mia invited Sam to walk under her umbrella with her."),
    ("How did sharing make Mia feel?", ["Happy and warm inside", "Annoyed that she got wet"], 0, "Even though she got a little wet, Mia felt happy that she had helped her friend."),
])

_SHARING_7_9 = _story("☔", [
    ("Dark clouds", "On the way home from school, dark clouds rolled in and the sky opened up. Leah had grabbed her umbrella that morning (her mom always made her), but most kids hadn't."),
    ("Soaked and alone", "She noticed Tom, a quiet kid from her class, standing alone at the bus stop with his backpack pulled over his head, completely soaked."),
    ("A moment of doubt", "Leah hesitated. She didn't know Tom very well -- what if it was weird to just walk over? But he looked so cold."),
    ("Room for two", "She walked up anyway. \"Hey, want to share? There's room for two.\" Tom looked surprised, then grinned and ducked under."),
    ("Not strangers anymore", "They talked the whole walk home about a video game they both liked. By the time they reached Tom's street, they weren't strangers anymore -- they were friends."),
    ("Worth the wet shoes", "Leah's shoes got soaked from the puddles on her side, but she didn't mind. She'd gained a friend and learned that a small kindness can be the start of something bigger."),
], [
    ("Why did Leah hesitate before helping Tom?", ["She didn't know him very well and felt unsure", "She didn't like him"], 0, "Leah wasn't sure if it would be weird to approach someone she didn't know well, even though he needed help."),
    ("What happened after Leah shared her umbrella?", ["They became friends on the walk home", "They argued the whole way"], 0, "Sharing the umbrella gave them a chance to talk and become friends."),
    ("What's the lesson of this story?", ["A small act of kindness can turn a stranger into a friend", "You should never talk to people you don't know well"], 0, "A simple kind gesture opened the door to a new friendship."),
])

_SHARING_10_13 = _story("☔", [
    ("An unexpected storm", "Zara had just finished a long debate practice when the storm hit without warning. As she opened her umbrella, she spotted Imran -- a boy from her class who mostly kept to himself and whom some kids teased for being \"weird\" -- standing drenched near the gate, clearly debating whether to just make a run for it."),
    ("What would they think?", "A part of her hesitated. What would her friends think if she walked over to the \"weird kid\"? It felt easier to just look away and keep walking."),
    ("Standing alone", "But then she thought about how it would feel to be the one standing alone in the rain while everyone just walked past."),
    ("Crossing over", "She crossed over. \"Hey, I'm heading your way -- want to share?\" Imran blinked, surprised anyone had noticed him, then nodded."),
    ("More in common than she thought", "They ended up talking the whole way -- turned out he was really into the same sci-fi books she loved, something none of her other friends knew about."),
    ("Caring more about the right thing", "The next day, a couple of her friends gave her a funny look for walking with Imran. Zara just shrugged. \"He's actually really cool once you talk to him.\" Kindness, she realized, sometimes means caring more about doing the right thing than about what people might think."),
], [
    ("Why did Zara almost not help Imran?", ["She worried what her friends would think", "She didn't have an umbrella herself"], 0, "Zara hesitated because she was worried about how it would look to her friends to be seen with Imran."),
    ("What did Zara and Imran have in common?", ["They both loved the same sci-fi books", "They were both on the debate team"], 0, "They discovered a shared love of sci-fi books while walking together."),
    ("What does Zara's response to her friends show?", ["She valued doing the right thing over fitting in", "She regretted helping Imran"], 0, "Zara didn't back down from her choice, even when her friends questioned it."),
    ("What's the deeper lesson here?", ["Real kindness sometimes means going against what's socially \"easy\"", "You should only be kind to people who are popular"], 0, "True kindness can mean doing the right thing even when it's not the popular choice."),
])

_COURAGE_4_6 = _story("🚲", [
    ("First try", "Ben wanted to ride his bike without training wheels. He tried... and fell down. Ouch!"),
    ("Feeling like giving up", "\"I can't do it,\" Ben said, feeling like giving up."),
    ("A reminder", "His dad said, \"Remember the turtle in your story? Slow and steady, try again.\""),
    ("Back up again", "Ben got back up. He wobbled... but this time he pedaled a little further before falling."),
    ("A little better each time", "He tried again. And again. Each time, a little bit better."),
    ("All the way across!", "By the end of the day, Ben rode all the way across the yard without falling! \"I didn't give up!\" he cheered."),
], [
    ("What happened when Ben first tried to ride without training wheels?", ["He fell down", "He rode perfectly"], 0, "Ben fell down on his very first try without training wheels."),
    ("What did Ben's dad remind him to do?", ["Keep trying, slow and steady", "Give up and use training wheels forever"], 0, "Ben's dad reminded him of the slow-and-steady turtle and encouraged him to keep trying."),
    ("How did Ben feel at the end?", ["Proud that he didn't give up", "Upset that it took so long"], 0, "Ben felt proud and cheered because he didn't give up."),
])

_COURAGE_7_9 = _story("🏊", [
    ("Halfway, again", "Aisha had been trying to swim across the pool without stopping for weeks. Every time, she'd get halfway and have to grab the lane rope, gasping."),
    ("Maybe I'm just not good", "\"Maybe I'm just not a good swimmer,\" she told her coach after yet another attempt fell short."),
    ("Twice as far", "Her coach shook her head. \"You're twice as far as you were two weeks ago. That's not 'not good' -- that's improving.\""),
    ("A different way to look at it", "Aisha thought about it. She HAD gotten further each week, even though it never felt like enough in the moment."),
    ("One more stroke", "The next practice, instead of focusing on the whole pool, she just focused on one more stroke than last time. She made it three-quarters of the way."),
    ("A hundred small tries", "Two weeks later, she touched the far wall without stopping once. It wasn't instant -- it was a hundred small \"one more strokes\" that finally added up."),
], [
    ("Why did Aisha think she wasn't a good swimmer?", ["She kept stopping halfway across the pool", "She didn't like swimming"], 0, "Aisha kept having to stop halfway across the pool, which made her doubt herself."),
    ("What did her coach point out?", ["She was actually improving each week", "She should quit swim team"], 0, "Her coach pointed out that she was swimming further each week, which was real progress."),
    ("What strategy helped Aisha finally make it across?", ["Focusing on just one more stroke at a time", "Giving up and trying a different sport"], 0, "Aisha focused on small, achievable goals -- just one more stroke at a time -- instead of the whole pool."),
    ("What's the lesson here?", ["Small, steady improvement adds up to big success", "You should only try things you're already good at"], 0, "Consistent small improvements eventually add up to a big achievement."),
])

_COURAGE_10_13 = _story("🎻", [
    ("Three weeks to go", "Kabir had been learning violin for eight months, and he still sounded, in his own words, \"like a dying cat.\" His first recital was in three weeks, and he was seriously considering faking being sick that day."),
    ("The same frustration", "Every practice session felt the same: squeaky notes, frustrated sighs, and the nagging thought that some of his classmates had picked it up so much faster."),
    ("Chapter one versus chapter twenty", "His teacher noticed him slumping during practice. \"You're comparing your chapter one to someone else's chapter twenty. That's not a fair fight -- and it's not the point anyway.\""),
    ("What he'd been missing", "Kabir realized he'd been so focused on sounding \"good\" that he'd stopped noticing he actually COULD now play things that would've been impossible for him two months ago."),
    ("Tracking himself instead", "He stopped comparing and started tracking his own progress instead -- recording himself each week, listening back, noticing small improvements he'd have missed otherwise."),
    ("Proud, mistakes and all", "On recital day, he wasn't the best player in the room. His hands shook a little. But he played the whole piece, mistakes and all, and felt something he hadn't expected: proud. Not because he was the best -- because three weeks ago, giving up had felt easier than this moment did now."),
], [
    ("What was Kabir seriously considering before his recital?", ["Faking being sick to avoid performing", "Quitting violin forever"], 0, "Kabir considered faking being sick so he wouldn't have to perform at the recital."),
    ("What mistake was Kabir making in how he judged his progress?", ["Comparing himself to classmates further along than him", "Practicing too much"], 0, "He was comparing his own early progress to classmates who had been playing longer or picked it up faster."),
    ("What did Kabir start doing instead of comparing himself to others?", ["Tracking his own progress week to week", "Avoiding practice altogether"], 0, "He started recording himself weekly to track his own improvement instead of comparing to others."),
    ("Why did Kabir feel proud after the recital, even with mistakes?", ["Because he didn't give up, compared to how he felt three weeks earlier", "Because he played better than everyone else"], 0, "He felt proud because he pushed through and performed despite wanting to quit three weeks earlier."),
])

# (topic_id, age_min, age_max, points, story)
_STORIES = [
    ("honesty", 4, 6, 10, _HONESTY_4_6),
    ("honesty", 7, 9, 12, _HONESTY_7_9),
    ("honesty", 10, 13, 15, _HONESTY_10_13),
    ("sharing-kindness", 4, 6, 10, _SHARING_4_6),
    ("sharing-kindness", 7, 9, 12, _SHARING_7_9),
    ("sharing-kindness", 10, 13, 15, _SHARING_10_13),
    ("courage", 4, 6, 10, _COURAGE_4_6),
    ("courage", 7, 9, 12, _COURAGE_7_9),
    ("courage", 10, 13, 15, _COURAGE_10_13),
]


def seed_moral_stories(db: Session) -> None:
    topic_meta = {t_id: (title, emoji) for t_id, title, emoji in _TOPICS}
    for order_index, (topic_id, title, emoji) in enumerate(_TOPICS, start=1):
        _insert_topic_if_missing(db, topic_id, "moral-story", title, emoji, order_index)
    db.commit()

    ts_now = now()
    order_index = 0
    for topic_id, age_min, age_max, points, story in _STORIES:
        order_index += 1
        module_id = f"{topic_id}-{age_min}-{age_max}"
        if db.query(DBLearningModule).get(module_id):
            continue  # already seeded (or admin-created with this id) -- never touch it
        topic_title, topic_emoji = topic_meta[topic_id]
        db.add(DBLearningModule(
            id=module_id, section="moral-story", section_title="Moral Stories", section_emoji="📖",
            topic=topic_id, topic_title=topic_title, topic_emoji=topic_emoji,
            age_min=age_min, age_max=age_max, title=f"Ages {age_min}–{age_max}", points=points, order_index=order_index,
            is_active="1", status="published", is_premium="0",
            content=story, created_at=ts_now,
        ))
    db.commit()
