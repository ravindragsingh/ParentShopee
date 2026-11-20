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
# interactive widget needed), the post-story questions are its "quiz". A
# topic is a theme (e.g. "Honesty"), not a single story -- each topic holds
# several distinct, separately-titled stories per age band (same "-p1"/"-p2"
# id convention Future-Ready uses for multiple parts under one topic), so a
# kid sees a shelf of different stories under "Honesty", not one story split
# into numbered chapters. Three age bands per topic for now (4-6, 7-9,
# 10-13); 13-17 is left for an admin to add later, same as any other
# topic/age-band gap.

_TOPICS = [
    # (topic_id, title, emoji)
    ("honesty", "Honesty", "🤝"),
    ("sharing-kindness", "Sharing & Kindness", "💝"),
    ("courage", "Courage & Perseverance", "🦁"),
]


def _story(emoji, pages, quiz):
    return {
        "slides": [{"emoji": emoji, "title": t, "text": txt} for t, txt in pages],
        "quiz": [
            {"question": q, "choices": choices, "correctIndex": correct, "explanation": expl}
            for q, choices, correct, expl in quiz
        ],
    }


# ── Honesty · Story 1: "The Broken Vase" (same incident, three reading levels) ──

_HONESTY_P1_4_6 = _story("🏺", [
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

_HONESTY_P1_7_9 = _story("🏺", [
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

_HONESTY_P1_10_13 = _story("🏺", [
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

# ── Honesty · Story 2: a found item, three different scenarios ──────────────

_HONESTY_P2_4_6 = _story("🚂", [
    ("At the Park", "Leo was swinging at the park when he spotted a shiny toy train under the bench. It wasn't his, but it looked so cool!"),
    ("Finder's keepers?", "\"Maybe I could just take it home,\" Leo thought. \"No one's looking...\""),
    ("A funny feeling", "But as he held the train, Leo thought about how sad HE would feel if he lost his favorite toy and no one gave it back."),
    ("Telling Mom", "Leo showed his mom the train. \"I found this. Can we find out whose it is?\""),
    ("Asking around", "Mom asked the other families at the park. A little girl named Sofia came running. \"My train! I lost it!\""),
    ("A happy ending", "Sofia was so happy, she gave Leo a high five. Leo felt warm and proud inside -- doing the right thing felt even better than keeping the toy would have."),
], [
    ("What did Leo find at the park?", ["A toy train", "A toy car"], 0, "Leo found a shiny toy train under a bench at the park."),
    ("What did Leo decide to do with it?", ["Try to find who it belonged to", "Take it home and keep it"], 0, "Leo told his mom and they found the owner together."),
    ("How did Leo feel after giving the train back?", ["Warm and proud", "Sad that he gave it up"], 0, "Doing the right thing felt even better than keeping the toy would have."),
])

_HONESTY_P2_7_9 = _story("👛", [
    ("A find in the park", "Walking home from school, Noah spotted a wallet lying in the grass. Inside was some cash and a library card."),
    ("A tempting thought", "\"Nobody saw me find this,\" Noah thought. \"I could just keep the money and toss the rest.\" Twenty dollars was a lot for a kid."),
    ("Whose would it be?", "But then he thought about whoever lost it -- probably worried sick, maybe needing that money for something important."),
    ("Running home", "Noah ran straight home and showed his mom. \"Can we find out whose this is?\""),
    ("Making a call", "They called the library on the card. Turned out it belonged to Mr. Alvarez, an elderly man who came in every week."),
    ("A grateful smile", "Mr. Alvarez was so relieved. \"That money was for my granddaughter's birthday gift,\" he said, and thanked Noah with a warm smile."),
    ("Worth more than the cash", "Noah realized that the good feeling of doing right was worth way more than twenty dollars ever could be."),
], [
    ("What did Noah find in the park?", ["A wallet with money and a library card", "A backpack"], 0, "Noah found a wallet with cash and a library card inside."),
    ("What almost tempted Noah?", ["Keeping the cash and throwing away the rest", "Asking his teacher for help"], 0, "Noah considered keeping the money since no one had seen him find it."),
    ("How did they find the wallet's owner?", ["Calling the library using the card inside", "Posting on social media"], 0, "They used the library card to identify and contact the owner."),
    ("What was the money for?", ["A birthday gift for Mr. Alvarez's granddaughter", "New shoes"], 0, "The money was meant for his granddaughter's birthday gift."),
])

_HONESTY_P2_10_13 = _story("🏪", [
    ("At the checkout", "Maya was buying snacks for a sleepover when the cashier handed back change. Back home, she realized -- he'd given her an extra twenty-dollar bill by mistake."),
    ("An easy mistake to keep", "No receipt would show it. No camera would catch it specifically. She could just... keep it. It wasn't like she'd stolen it."),
    ("Was it really wrong?", "\"He made the mistake, not me,\" she told herself. But a nagging thought stuck: if the register came up short at the end of his shift, would HE have to cover it from his own paycheck?"),
    ("Going back", "The next day, Maya walked back to the store. \"I think you gave me too much change yesterday,\" she said, holding out the extra bill."),
    ("More than she expected", "The cashier looked stunned. \"Thank you -- seriously. If my register comes up short, it comes out of my pay. You just saved me a bad day.\""),
    ("A clearer view", "Maya realized something she hadn't thought about before: a \"mistake in my favor\" can still cost someone else something real, even if it never shows up as a crime anywhere."),
], [
    ("What mistake did the cashier make?", ["Gave Maya too much change", "Charged Maya twice"], 0, "The cashier accidentally gave Maya an extra twenty-dollar bill in her change."),
    ("What justification did Maya consider for keeping the money?", ["It was his mistake, not her fault", "She needed the money badly"], 0, "Maya told herself it wasn't technically her fault since the cashier made the error."),
    ("Why did returning the money actually matter to the cashier?", ["A register shortage could come out of his own pay", "He needed the exact bill for himself"], 0, "If his register came up short, the cashier would have to cover it from his own paycheck."),
    ("What's the deeper lesson here?", ["An error in your favor can still cost someone else something real", "You should always count your change carefully"], 0, "Even an honest mistake that benefits you can have a real cost for someone else."),
])

# ── Sharing & Kindness · Story 1: "The Shared Umbrella" ──────────────────────

_SHARING_P1_4_6 = _story("☔", [
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

_SHARING_P1_7_9 = _story("☔", [
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

_SHARING_P1_10_13 = _story("☔", [
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

# ── Sharing & Kindness · Story 2: making room for someone else ───────────────

_SHARING_P2_4_6 = _story("🍪", [
    ("One cookie left", "Mom put the cookie plate on the table. Only one was left, and both Ty and his sister Mia reached for it at the same time."),
    ("Mine first!", "\"I saw it first!\" Ty said, grabbing it before Mia could."),
    ("Mia's sad face", "Mia's face fell. She didn't say anything, but her eyes looked watery."),
    ("A better idea", "Ty looked at the cookie, then at Mia. He broke it in half. \"Here. We can both have some.\""),
    ("Sharing is better", "Mia's face lit up. They sat together eating their halves, giggling about their day."),
    ("A full heart", "Ty realized a shared cookie somehow tasted even better than a whole one eaten alone."),
], [
    ("What happened when only one cookie was left?", ["Ty and Mia both wanted it", "They didn't want any cookies"], 0, "Only one cookie was left and both Ty and Mia reached for it."),
    ("What did Ty decide to do?", ["Break it in half to share", "Eat the whole thing himself"], 0, "Ty broke the cookie in half so they could both have some."),
    ("How did sharing make the moment better?", ["They got to enjoy it together", "Ty got to eat more"], 0, "Sharing the cookie let them enjoy the moment together instead of one of them feeling left out."),
])

_SHARING_P2_7_9 = _story("🥪", [
    ("Forgotten lunch", "At the lunch table, Carlos realized his friend Dylan had no lunch -- he'd left it at home by accident and looked embarrassed to ask anyone for help."),
    ("Not my problem?", "Carlos had a full lunch and could've just eaten it himself. Dylan wasn't even looking his way, just quietly not eating."),
    ("Scooting over", "Carlos slid half his sandwich and some chips across the table. \"Here, split this with me. I never finish it all anyway.\""),
    ("A relieved laugh", "Dylan looked surprised, then grinned. \"Thanks, man. I owe you one.\""),
    ("A new lunch buddy", "From then on, they started sharing lunch spots most days -- and Carlos realized a small gesture had turned into an actual friendship."),
], [
    ("Why didn't Dylan have lunch?", ["He forgot it at home", "He wasn't hungry"], 0, "Dylan had accidentally left his lunch at home that day."),
    ("What did Carlos do about it?", ["Shared part of his own lunch with Dylan", "Told a teacher and walked away"], 0, "Carlos offered to split his sandwich and chips with Dylan."),
    ("What did this small act of kindness lead to?", ["A new friendship", "Carlos went hungry for the rest of the week"], 0, "The small gesture grew into Carlos and Dylan becoming regular lunch buddies."),
])

_SHARING_P2_10_13 = _story("🏆", [
    ("The science fair", "Priyanka's science fair project won first place -- a robotic arm she'd spent weeks building. The judges praised her individually as the project's creator."),
    ("The quiet helper", "What the judges didn't know: her classmate Rohan had spent hours after school helping her debug the code, never once asking for credit or wanting the spotlight."),
    ("At the award ceremony", "When Priyanka was called up to accept the prize and say a few words, she had a choice: accept the praise as hers alone, or mention Rohan's help."),
    ("Sharing the spotlight", "\"This project wouldn't have worked without my friend Rohan's help with the code,\" she said. \"He deserves just as much credit as I do.\""),
    ("A moment that mattered more than the trophy", "Rohan, sitting in the audience, looked genuinely stunned -- and proud. The prize was still Priyanka's, but the moment of recognition meant more to both of them than the trophy itself."),
], [
    ("Who helped Priyanka with her project but didn't ask for credit?", ["Rohan", "A teacher"], 0, "Rohan quietly helped Priyanka debug her code without asking for recognition."),
    ("What choice did Priyanka face at the ceremony?", ["Whether to mention Rohan's help or take all the credit herself", "Whether to give the trophy to someone else"], 0, "She had to decide whether to acknowledge Rohan's contribution publicly."),
    ("What did Priyanka decide to do?", ["Publicly credit Rohan for his help", "Stay quiet about Rohan's contribution"], 0, "She chose to tell everyone that Rohan deserved credit too."),
    ("What's the lesson here?", ["Sharing credit with someone who helped you means more than keeping the spotlight", "You should never work with a partner on projects"], 0, "Sharing recognition with someone who helped you is a meaningful act of kindness."),
])

# ── Courage & Perseverance · Story 1: trying again after failing ─────────────

_COURAGE_P1_4_6 = _story("🚲", [
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

_COURAGE_P1_7_9 = _story("🏊", [
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

_COURAGE_P1_10_13 = _story("🎻", [
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

# ── Courage & Perseverance · Story 2: facing a fear head-on ──────────────────

_COURAGE_P2_4_6 = _story("🛝", [
    ("So tall!", "At the playground, Zoe stared up at the big kids' slide. It looked SO much taller than the little one she usually used."),
    ("A scared feeling", "Her tummy felt fluttery just looking at it. \"What if I fall? What if it's too fast?\""),
    ("Watching others", "She watched other kids climb up, slide down, and laugh at the bottom. They looked like they were having so much fun."),
    ("One step at a time", "Taking a deep breath, Zoe climbed the ladder, one rung at a time, even though her legs felt wobbly."),
    ("Whoosh!", "At the top, she took one more breath and pushed off. WHOOSH! Down she went, laughing the whole way."),
    ("Braver than she knew", "At the bottom, Zoe grinned. She felt a little taller too -- she'd done the scary thing, and it turned out to be amazing."),
], [
    ("Why was Zoe scared of the big slide?", ["It looked tall and fast", "She didn't like slides at all"], 0, "The big slide looked much taller and faster than the one Zoe usually used."),
    ("What did Zoe do even though she was scared?", ["She climbed up and went down anyway", "She went home instead"], 0, "Despite feeling scared, Zoe climbed up and went down the slide."),
    ("How did Zoe feel after going down the slide?", ["Proud and happy she tried", "Upset that she tried"], 0, "Zoe felt proud and happy that she had faced her fear."),
])

_COURAGE_P2_7_9 = _story("✋", [
    ("Lost in math class", "Ben had been lost since the teacher started the new fractions lesson. Everyone around him seemed to understand, nodding along."),
    ("Too embarrassed to ask", "\"If I raise my hand, everyone will know I don't get it,\" Ben thought. It felt safer to just nod along and pretend, like everyone else seemed to be doing."),
    ("The worksheet proved it", "But when the practice worksheet came out, Ben stared at blank boxes, understanding nothing. Pretending hadn't actually taught him anything."),
    ("A shaky hand goes up", "Taking a breath, Ben raised his hand. \"Um... can you explain that part again? I'm lost.\""),
    ("Not alone after all", "To his surprise, two other kids said \"Yeah, me too!\" The teacher explained it a different way, and this time, it clicked for all three of them."),
    ("Braver than staying quiet", "Ben realized that admitting \"I don't get it\" took more courage than pretending -- and it was the only thing that actually helped him learn."),
], [
    ("Why didn't Ben want to ask for help at first?", ["He was embarrassed others would know he didn't understand", "He didn't care about the lesson"], 0, "Ben worried that raising his hand would reveal he didn't understand the lesson."),
    ("What happened when Ben finally raised his hand?", ["Other kids admitted they were lost too", "The teacher got annoyed at him"], 0, "Two other kids admitted they were confused too, and the teacher re-explained the lesson."),
    ("What's the lesson of this story?", ["Admitting you don't understand takes courage but helps you actually learn", "You should always pretend to understand in class"], 0, "Admitting confusion takes courage but is the only way to actually learn."),
])

_COURAGE_P2_10_13 = _story("😬", [
    ("The joke that wasn't funny", "At lunch, a group of kids started mocking Priya's friend Aarav for his accent, doing exaggerated impressions while he sat there, forcing a smile."),
    ("Staying quiet felt safer", "Priya felt sick watching it, but speaking up meant becoming the group's next target. Staying quiet was so much easier."),
    ("Looking at Aarav's face", "But she caught Aarav's eyes for a second -- he looked small, embarrassed, alone. Staying silent suddenly felt like a different kind of wrong."),
    ("Finding her voice", "\"That's not actually funny,\" Priya said, loud enough for the table to hear. \"Can we stop?\""),
    ("An awkward silence", "The table went quiet for a second. A couple of kids rolled their eyes, but the mocking stopped, and someone changed the subject."),
    ("A quiet thank you", "Later, Aarav caught up with her in the hallway. \"Thanks for that,\" he said quietly. \"Nobody usually says anything.\""),
    ("What courage actually felt like", "Priya realized courage wasn't about not being scared -- she'd been plenty scared. It was saying something anyway, because staying silent would have felt worse."),
], [
    ("What was happening to Aarav at lunch?", ["Kids were mocking his accent", "He was being left out of a game"], 0, "A group of kids was mocking Aarav's accent with exaggerated impressions."),
    ("Why did Priya hesitate to speak up?", ["She worried she'd become the next target", "She didn't notice what was happening"], 0, "Priya was afraid that speaking up would make her the group's next target."),
    ("What finally made her speak up?", ["Seeing how embarrassed and alone Aarav looked", "A teacher telling her to"], 0, "Seeing Aarav's embarrassed, lonely expression pushed her to say something."),
    ("What did Priya realize courage actually means?", ["Doing the right thing despite being scared, not the absence of fear", "Never feeling afraid of anything"], 0, "Courage isn't the absence of fear -- it's acting despite it."),
])

# (topic_id, age_min, age_max, part_num, story_name, points, story)
# story_name alone, not story_name + age band: several stories share a name
# across age bands (the same incident retold at a harder reading level), so
# the stored title gets "· Ages X–Y" appended below -- otherwise a guardian
# scanning the topic sees e.g. three identical "The Broken Vase" rows with no
# way to tell them apart. Kid-facing UI strips that suffix back off (age
# bands are a guardian-only concept), same convention Future-Ready uses for
# its own "Part N" suffix.
_STORIES = [
    ("honesty", 4, 6, 1, "The Broken Vase", 10, _HONESTY_P1_4_6),
    ("honesty", 7, 9, 1, "The Broken Vase", 12, _HONESTY_P1_7_9),
    ("honesty", 10, 13, 1, "The Broken Vase", 15, _HONESTY_P1_10_13),
    ("honesty", 4, 6, 2, "The Lost Toy", 10, _HONESTY_P2_4_6),
    ("honesty", 7, 9, 2, "The Lost Wallet", 12, _HONESTY_P2_7_9),
    ("honesty", 10, 13, 2, "The Overpayment", 15, _HONESTY_P2_10_13),

    ("sharing-kindness", 4, 6, 1, "The Shared Umbrella", 10, _SHARING_P1_4_6),
    ("sharing-kindness", 7, 9, 1, "The Shared Umbrella", 12, _SHARING_P1_7_9),
    ("sharing-kindness", 10, 13, 1, "The Shared Umbrella", 15, _SHARING_P1_10_13),
    ("sharing-kindness", 4, 6, 2, "The Last Cookie", 10, _SHARING_P2_4_6),
    ("sharing-kindness", 7, 9, 2, "Lunch for Two", 12, _SHARING_P2_7_9),
    ("sharing-kindness", 10, 13, 2, "Splitting the Prize", 15, _SHARING_P2_10_13),

    ("courage", 4, 6, 1, "Try Again", 10, _COURAGE_P1_4_6),
    ("courage", 7, 9, 1, "One More Stroke", 12, _COURAGE_P1_7_9),
    ("courage", 10, 13, 1, "The Recital", 15, _COURAGE_P1_10_13),
    ("courage", 4, 6, 2, "The Big Slide", 10, _COURAGE_P2_4_6),
    ("courage", 7, 9, 2, "Raising My Hand", 12, _COURAGE_P2_7_9),
    ("courage", 10, 13, 2, "Standing Up for a Friend", 15, _COURAGE_P2_10_13),
]


def seed_moral_stories(db: Session) -> None:
    topic_meta = {t_id: (title, emoji) for t_id, title, emoji in _TOPICS}
    for order_index, (topic_id, title, emoji) in enumerate(_TOPICS, start=1):
        _insert_topic_if_missing(db, topic_id, "moral-story", title, emoji, order_index)
    db.commit()

    ts_now = now()
    order_index = 0
    for topic_id, age_min, age_max, part_num, story_name, points, story in _STORIES:
        order_index += 1
        module_id = f"{topic_id}-{age_min}-{age_max}-p{part_num}"
        if db.query(DBLearningModule).get(module_id):
            continue  # already seeded (or admin-created with this id) -- never touch it
        topic_title, topic_emoji = topic_meta[topic_id]
        title = f"{story_name} · Ages {age_min}–{age_max}"
        db.add(DBLearningModule(
            id=module_id, section="moral-story", section_title="Moral Stories", section_emoji="📖",
            topic=topic_id, topic_title=topic_title, topic_emoji=topic_emoji,
            age_min=age_min, age_max=age_max, title=title, points=points, order_index=order_index,
            is_active="1", status="published", is_premium="0",
            content=story, created_at=ts_now,
        ))
    db.commit()
