"""Grade-4 math topic catalog — a fixed, shared curriculum (not per-family).
Each question stores a list of acceptable answers; grading in routers/maths.py
normalizes case/commas/whitespace and also compares as an unordered token set,
so e.g. "1, 2, 5, 10" matches "1 2 5 10" regardless of spacing or order."""

MATH_TOPICS = [
    {
        "title": "Place Value to the Millions",
        "emoji": "🔢",
        "explanation": (
            "Every digit in a number has a value based on where it sits — that's called place value. "
            "Starting from the right, the places go ones, tens, hundreds, thousands, ten-thousands, "
            "hundred-thousands, and millions. For example, in the number 3,482,915, the digit 3 is in "
            "the millions place, so it's worth 3,000,000, while the 9 is in the hundred-thousands place, "
            "worth 900,000. Knowing place value helps us read, write, and compare big numbers. A good "
            "trick is to say the number out loud in groups of three, like \"three million, four hundred "
            "eighty-two thousand, nine hundred fifteen.\""
        ),
        "questions": [
            {"question": "In the number 5,672, what is the value of the digit 6?", "answers": ["600", "6 hundred", "six hundred"]},
            {"question": "What is the value of the digit 7 in 748,213?", "answers": ["700000", "seven hundred thousand"]},
            {"question": "Write the number that has 4 in the hundred-thousands place, 2 in the ten-thousands place, 9 in the thousands place, 0 in the hundreds place, 5 in the tens place, and 3 in the ones place.", "answers": ["429053"]},
            {"question": "What is the value of the digit 3 in 3,482,915?", "answers": ["3000000", "three million"]},
            {"question": "Which number is greater: 2,847,301 or 2,847,013?", "answers": ["2847301"]},
        ],
    },
    {
        "title": "Adding and Subtracting Big Numbers",
        "emoji": "➕",
        "explanation": (
            "When you add or subtract numbers with more than one digit, sometimes a column adds up to 10 "
            "or more, so you have to \"regroup\" (carry) an extra ten into the next column. For example, "
            "456 + 278: in the ones column, 6+8=14, so write 4 and carry 1 ten; in the tens column, "
            "5+7+1(carried)=13, write 3 and carry 1 hundred; in the hundreds column, 4+2+1=7. So "
            "456+278=734. Subtraction works the opposite way — when the top digit is smaller than the "
            "bottom digit, you borrow a ten from the next column over. Lining up your digits by place "
            "value (ones under ones, tens under tens) helps you avoid mistakes."
        ),
        "questions": [
            {"question": "245 + 132 = ?", "answers": ["377"]},
            {"question": "568 − 243 = ?", "answers": ["325"]},
            {"question": "3,456 + 2,789 = ?", "answers": ["6245"]},
            {"question": "5,000 − 2,368 = ?", "answers": ["2632"]},
            {"question": "47,825 + 36,198 = ?", "answers": ["84023"]},
        ],
    },
    {
        "title": "Multiplying Big Numbers",
        "emoji": "✖️",
        "explanation": (
            "Multiplying a multi-digit number by a 1-digit number means adding that number to itself "
            "many times, but we use place value to do it fast. For example, 234 × 3: 3×4=12 (write 2, "
            "carry 1), 3×3=9+1=10 (write 0, carry 1), 3×2=6+1=7 — giving 702. For 2-digit times 2-digit "
            "problems, like 23 × 14, break it into partial products: 23×10=230 and 23×4=92, then add "
            "them: 230+92=322. Breaking multiplication into smaller, easier pieces (called partial "
            "products) makes big multiplication manageable."
        ),
        "questions": [
            {"question": "43 × 2 = ?", "answers": ["86"]},
            {"question": "234 × 3 = ?", "answers": ["702"]},
            {"question": "456 × 6 = ?", "answers": ["2736"]},
            {"question": "23 × 14 = ?", "answers": ["322"]},
            {"question": "47 × 32 = ?", "answers": ["1504"]},
        ],
    },
    {
        "title": "Dividing With and Without Remainders",
        "emoji": "➗",
        "explanation": (
            "Division means splitting a number into equal groups. For example, 84 ÷ 4 asks \"how many "
            "groups of 4 fit into 84?\" Since 4×20=80 with 4 left, 4×21=84, so the answer is 21 with no "
            "remainder. Sometimes numbers don't divide evenly, and whatever is left over is called the "
            "remainder — like 17 ÷ 5 = 3 remainder 2, because 5×3=15 and there are 2 left over. You can "
            "check your division by multiplying the answer by the divisor and adding the remainder — it "
            "should get you back to the number you started with."
        ),
        "questions": [
            {"question": "36 ÷ 6 = ?", "answers": ["6"]},
            {"question": "84 ÷ 4 = ?", "answers": ["21"]},
            {"question": "17 ÷ 5 = ?", "answers": ["3 remainder 2", "3r2", "3 r 2"]},
            {"question": "93 ÷ 7 = ?", "answers": ["13 remainder 2", "13r2", "13 r 2"]},
            {"question": "256 ÷ 8 = ?", "answers": ["32"]},
        ],
    },
    {
        "title": "Factors and Multiples",
        "emoji": "🧩",
        "explanation": (
            "A factor is a number that divides evenly into another number with nothing left over — for "
            "example, the factors of 12 are 1, 2, 3, 4, 6, and 12, because each one divides 12 evenly. A "
            "multiple is what you get when you multiply a number by a whole number, like the multiples "
            "of 4: 4, 8, 12, 16, 20, and so on. Every number is a factor of itself and a multiple of "
            "itself. A helpful trick: if you know a multiplication fact like 3×4=12, you've just found "
            "that both 3 and 4 are factors of 12."
        ),
        "questions": [
            {"question": "List all the factors of 10.", "answers": ["1 2 5 10"]},
            {"question": "List all the factors of 12.", "answers": ["1 2 3 4 6 12"]},
            {"question": "What are the first five multiples of 6?", "answers": ["6 12 18 24 30"]},
            {"question": "Is 7 a factor of 42?", "answers": ["yes"]},
            {"question": "What is the greatest common factor of 18 and 24?", "answers": ["6"]},
        ],
    },
    {
        "title": "Equivalent and Comparing Fractions",
        "emoji": "🍕",
        "explanation": (
            "Equivalent fractions are different fractions that name the same amount, like 1/2 and 2/4 — "
            "if you cut a pizza into 2 slices and take 1, that's the same amount as cutting it into 4 "
            "slices and taking 2. To find an equivalent fraction, multiply (or divide) the top and "
            "bottom numbers by the same number, like 1/2 × 2/2 = 2/4. When comparing fractions, it helps "
            "to give them the same denominator (bottom number) first — for example, rewriting 3/4 as 6/8 "
            "lets us compare it to 5/8, and since 6/8 is more than 5/8, we know 3/4 is greater. Thinking "
            "of fractions as slices of the same-size pizza makes comparing them easier."
        ),
        "questions": [
            {"question": "Write a fraction equivalent to 1/2.", "answers": ["2/4", "3/6", "4/8", "5/10", "6/12"]},
            {"question": "Write a fraction equivalent to 2/3.", "answers": ["4/6", "6/9", "8/12", "10/15"]},
            {"question": "Which is greater, 3/4 or 5/8?", "answers": ["3/4"]},
            {"question": "Which is greater, 2/5 or 3/10?", "answers": ["2/5"]},
            {"question": "Are 3/9 and 1/3 equivalent?", "answers": ["yes"]},
        ],
    },
    {
        "title": "Decimals: Tenths and Hundredths",
        "emoji": "🔟",
        "explanation": (
            "Decimals are another way to write fractions with denominators of 10 or 100. The first digit "
            "after the decimal point is the tenths place, and the second digit is the hundredths place. "
            "For example, the fraction 3/10 is written as 0.3, and 45/100 is written as 0.45. If you "
            "have 1.25, that means 1 whole plus 2 tenths plus 5 hundredths, which is the same as 1 and "
            "25/100. Lining up decimal points when adding or comparing decimals — just like lining up "
            "place value in whole numbers — keeps everything accurate."
        ),
        "questions": [
            {"question": "Write 7/10 as a decimal.", "answers": ["0.7", ".7"]},
            {"question": "Write 0.45 as a fraction.", "answers": ["45/100", "9/20"]},
            {"question": "Which is greater, 0.6 or 0.45?", "answers": ["0.6", ".6"]},
            {"question": "What is 0.3 + 0.25?", "answers": ["0.55", ".55"]},
            {"question": "Write 3 and 6/100 as a decimal.", "answers": ["3.06"]},
        ],
    },
    {
        "title": "Angles and Shapes",
        "emoji": "📐",
        "explanation": (
            "An angle is formed where two lines meet, and we measure angles in degrees. A right angle "
            "measures exactly 90 degrees (like the corner of a book), an acute angle is smaller than 90 "
            "degrees, and an obtuse angle is bigger than 90 degrees but smaller than 180. Triangles can "
            "be classified by their angles (a right triangle has one 90-degree angle) or by their sides "
            "(an equilateral triangle has all three sides equal). Quadrilaterals are four-sided shapes — "
            "a square has four equal sides and four right angles, while a rectangle has four right "
            "angles but only opposite sides equal."
        ),
        "questions": [
            {"question": "How many degrees are in a right angle?", "answers": ["90", "90 degrees"]},
            {"question": "Is an angle measuring 45 degrees acute, right, or obtuse?", "answers": ["acute"]},
            {"question": "Is an angle measuring 120 degrees acute, right, or obtuse?", "answers": ["obtuse"]},
            {"question": "What is a triangle with all three sides equal called?", "answers": ["equilateral", "equilateral triangle"]},
            {"question": "A quadrilateral has four right angles and four equal sides. What shape is it?", "answers": ["square", "a square"]},
        ],
    },
    {
        "title": "Area and Perimeter",
        "emoji": "📏",
        "explanation": (
            "Perimeter is the distance all the way around a shape, found by adding up the lengths of all "
            "its sides. Area is the amount of space inside a shape, measured in square units. For a "
            "rectangle, you find the perimeter by adding all four sides (or using P = 2 × length + 2 × "
            "width), and you find the area by multiplying length × width. For example, a rectangle that "
            "is 5 feet long and 3 feet wide has a perimeter of (2×5)+(2×3) = 16 feet, and an area of 5×3 "
            "= 15 square feet. Remember: perimeter uses regular units (like feet), while area uses "
            "square units (like square feet)."
        ),
        "questions": [
            {"question": "A square has sides of 4 cm. What is its perimeter?", "answers": ["16 cm", "16"]},
            {"question": "A rectangle is 6 inches long and 2 inches wide. What is its area?", "answers": ["12 square inches", "12"]},
            {"question": "A rectangle is 5 feet long and 3 feet wide. What is its perimeter?", "answers": ["16 feet", "16"]},
            {"question": "A square has an area of 25 square meters. What is the length of one side?", "answers": ["5 meters", "5"]},
            {"question": "A rectangular garden is 8 meters long and 4 meters wide. What is its area and perimeter?", "answers": ["32 24", "area 32 perimeter 24"]},
        ],
    },
    {
        "title": "Elapsed Time and Measurement",
        "emoji": "⏰",
        "explanation": (
            "Elapsed time is how much time passes between a start time and an end time — for example, if "
            "a movie starts at 3:15 pm and ends at 5:00 pm, it lasted 1 hour and 45 minutes (3:15 to 4:15 "
            "is 1 hour, then 4:15 to 5:00 is 45 more minutes). We also convert between units of "
            "measurement, like knowing there are 12 inches in a foot, 3 feet in a yard, 60 minutes in an "
            "hour, and 24 hours in a day. For example, if a recipe takes 90 minutes, that's the same as 1 "
            "hour and 30 minutes, since 90 = 60 + 30. Counting up to the next friendly \"landmark\" time "
            "first makes elapsed time problems much easier."
        ),
        "questions": [
            {"question": "How many minutes are in 2 hours?", "answers": ["120", "120 minutes"]},
            {"question": "How many inches are in 3 feet?", "answers": ["36", "36 inches"]},
            {"question": "A movie starts at 4:30 pm and ends at 6:15 pm. How long is the movie?", "answers": ["1 hour 45 minutes", "1 hr 45 min", "105 minutes"]},
            {"question": "How many minutes is 1 hour and 20 minutes?", "answers": ["80", "80 minutes"]},
            {"question": "Convert 150 minutes into hours and minutes.", "answers": ["2 hours 30 minutes", "2 hr 30 min"]},
        ],
    },
]
