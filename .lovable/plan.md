- Plan: PureShield Model Remap + Stability Hardening

## Goal

1. Remap face detection models so each device tier uses the right BlazeFace variant (drop unreliable `mediapipe_face.tflite` fallback).
2. Add model asset verification at app startup so missing/corrupt models surface a clear error instead of silent failure.
3. Add a pre-commit / CI lint that catches the two recurring build-breakers: case-sensitive import paths and duplicate Java method signatures.

## Part 1 — Model Remap

**File:** `android/app/src/main/java/com/mylifeos/app/shield/vision/PureShieldModelManager.java`

New tier mapping in `getFaceDetectorModel()`:

```
HIGH (6GB+ RAM, GPU)   → blaze_face_full_range.tflite   (best accuracy, multi-face)
MID  (4-6GB RAM)       → blazeface.tflite                (balanced)
LOW  (2-4GB RAM)       → blaze_face_short_range.tflite   (fastest, smallest)
```

Rationale: `blaze_face_short_range` is actually the lightest/fastest model (~230KB) and works perfectly for screen-distance faces — ideal for LOW tier. `mediapipe_face.tflite` is removed from the active mapping because it has produced unreliable detections; we keep the file in assets as a defensive fallback only.

Also update:

- `getTierDescription()` strings to reflect the new model names.
- `getExpectedInferenceTimeMs()` / `getSamplingIntervalMs()` slightly tuned for the new mapping (full_range is heavier than current HIGH model, so HIGH tier sampling interval increased from 300ms → 350ms).

## Part 2 — Model Asset Verification at Startup

**File:** `android/app/src/main/java/com/mylifeos/app/shield/vision/PureShieldService.java`

Add a `verifyAssets()` method called once before model loading:

- Open each required asset file (`blaze_face_full_range.tflite`, `blazeface.tflite`, `blaze_face_short_range.tflite`, `gender_mobilenet.tflite`) via `AssetManager.openFd()`.
- Check size > 1KB (catches empty/truncated files).
- On failure, set `modelStatus = MODEL_FAILED` with a clear `reason` string (e.g. `"Missing asset: blazeface.tflite"`) — already plumbed through `getModelStatus()` to the React layer.

**File:** `src/components/shield/pages/` (Shield UI page that surfaces model status)

- Show a visible banner when `modelStatus.status === 'MODEL_FAILED'` with the reason, instead of silently showing "0 faces detected".

## Part 3 — Build Stability Hardening

### 3a. Case-sensitive import path check

**New file:** `scripts/check-case-sensitive-imports.mjs`

- Walks `src/`, parses every `import` statement.
- For each relative import, resolves it on disk and compares the actual filename casing against the import string.
- Fails (exit 1) if mismatch found.

**File:** `.github/workflows/build-lifeos.yml` — add a step before `npm run build`:

```
- name: Lint import paths (case-sensitivity)
  run: node scripts/check-case-sensitive-imports.mjs
```

This would have caught the `shield/Pages` → `shield/pages` bug locally.

### 3b. Duplicate Java method check

**New file:** `scripts/check-duplicate-java-methods.sh`

- Greps each `.java` file in `android/app/src/main/java/` for duplicate public method signatures.
- Fails on duplicates.

Added as a workflow step before the Gradle assemble step.

### 3c. Strict npm install

**File:** `.github/workflows/build-lifeos.yml`

- Replace `npm install --legacy-peer-deps` with `npm ci --legacy-peer-deps` (faster, strict lockfile, no surprise resolutions).
- Verify `package-lock.json` is committed and up to date.

## Out of Scope (for this plan)

- Gender model improvements / "always blur all faces" mode — user chose remap-only.
- NNAPI delegate fallback — separate enhancement.
- Removing `mediapipe_face.tflite` from the APK (just unused; can prune later).

## Files Touched

- Edit: `android/app/src/main/java/com/mylifeos/app/shield/vision/PureShieldModelManager.java`
- Edit: `android/app/src/main/java/com/mylifeos/app/shield/vision/PureShieldService.java`
- Edit: Shield status UI (single file under `src/components/shield/pages/` or `src/pages/Shield.tsx`)
- New:  `scripts/check-case-sensitive-imports.mjs`
- New:  `scripts/check-duplicate-java-methods.sh`
- Edit: `.github/workflows/build-lifeos.yml`

## Verification

- Trigger CI: new lint steps should pass green on current code.
- After APK build: open Shield → confirm correct model name shown per device tier; force-rename an asset locally to confirm the MODEL_FAILED banner appears.
- এবং যাতে ফেস ডিটেক্টশন এবং ব্লার টাও আরো ভালো করতে হবে,  ফেস ঠিক মতো ডিটেক্ট করে না, আর সব গুলা ব্লার ও করে না, ভালো ভাবে ঠিক করবা 
- best of luck 