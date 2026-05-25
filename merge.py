import json
import re
from pathlib import Path

GRAMMAR_FILE = Path("grammar_points.json")
TRANSCRIBED_FILE = Path("transcribed.json")
OUTPUT_FILE = Path("grammar_points_merged.json")


def main():
    with open(GRAMMAR_FILE, encoding="utf-8") as f:
        lessons = json.load(f)

    with open(TRANSCRIBED_FILE, encoding="utf-8") as f:
        transcribed = json.load(f)

    # Index transcribed lessons by lesson number
    transcribed_by_lesson = {lesson["lesson"]: lesson["grammar_points"] for lesson in transcribed}

    total_merged = 0
    merged_lessons = []

    for lesson in lessons:
        lesson_num = lesson["lesson"]
        json_points = lesson["grammar_points"]
        tr_points = transcribed_by_lesson.get(lesson_num, [])

        if len(json_points) != len(tr_points):
            print(f"Warning: lesson {lesson_num} has {len(json_points)} JSON points vs {len(tr_points)} transcribed — merging up to the shorter list.")

        merged_points = []
        for i, point in enumerate(json_points):
            merged = {
                "pattern": point["pattern"],
                "eng_meaning": point["meaning"],
            }
            if i < len(tr_points):
                t = tr_points[i]
                merged["jp_meaning"] = t["meaning"]
                merged["example_sentences"] = [
                    re.sub(r"^[①-⑳\d]+[.．、\s]*", "", s) for s in t["example_sentences"]
                ]
                if "warning" in t:
                    merged["warning"] = t["warning"]
                total_merged += 1
            merged_points.append(merged)

        merged_lessons.append({"lesson": lesson_num, "grammar_points": merged_points})

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(merged_lessons, f, ensure_ascii=False, indent=2)

    print(f"Merged {total_merged} grammar points across {len(merged_lessons)} lessons → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
