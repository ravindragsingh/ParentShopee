# Future-Ready narration: Piper TTS prototype

One-time, offline audio generation for Future-Ready lesson slides, as an
alternative to the in-app `window.speechSynthesis` (which sounds robotic and
varies by device). [Piper](https://github.com/rhasspy/piper) is free,
open-source, and runs entirely offline -- no API key, no per-character cost,
no usage cap.

## Setup (one-time)

```bash
pip3 install piper-tts

# Voice model -- not committed (63MB); download it here:
curl -sL -o en_US-lessac-medium.onnx \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx"
curl -sL -o en_US-lessac-medium.onnx.json \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json"
```

Other voices: https://rhasspy.github.io/piper-samples/

## Generate one clip

```bash
echo "Your slide text here" | \
  python3 -m piper -m en_US-lessac-medium.onnx -f out.wav

# Compress for shipping (macOS afconvert; ~64kbps AAC is plenty for speech)
afconvert -f m4af -d aac -b 64000 out.wav out.m4a
```

## Current sample

`frontend/public/audio/future-ready-sample/sample-investing-slide1.m4a` --
slide 1 ("What is money?") of `investing-4-6-p1`, wired into
`frontend/src/futureready/LessonModule.jsx` (`SAMPLE_PREGENERATED_AUDIO`) as
an A/B comparison against the live `speechSynthesis` narration. Turn on
"read-aloud" on that slide to hear it.

## If we proceed to all 14 topics

Not done yet -- pending a decision after the A/B comparison. Would need a
batch script walking `backend/future_ready_content/*.json`, generating one
clip per slide (title + text) and per quiz question, named by
`<moduleId>-<slideIndex>.m4a`, then a lookup table (or naming convention)
in `LessonModule.jsx` replacing `SAMPLE_PREGENERATED_AUDIO`. Rough size
estimate at 64kbps: ~130KB per slide x ~1225 slides =~ 150MB added to the
app bundle -- worth re-checking against a lower bitrate (32-40kbps) before
committing to that number.
