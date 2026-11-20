# NomadVR Astana

VR tourism showcase for Astana featuring four guided stops (*Astana LRT*, *Khan Shatyr*, *Baiterek*, and *Pyramid & 48h Tour Pass*), daylight and night illumination modes, gaze/click inspection, and optional Web Speech API voice commands with a controls-only fallback.

## Team & Ownership 
- Member 1: [Tursynbay Aisha, Student ID: 243121]
  - Technical / Project Ownership: VR scene setup, 4 tour stops, Day/Night lighting state, assets/landmark.glb integration & animation, frame rate & build verification.
  - Report Sections (5 sections): §1 Summary, §3 Plan and business case, §4 Experience design, §5 Implementation and AI feature, §8 Web vs native engines.
- Member 2: [Askerbekova Shynara, Student ID: 243122]
  - Technical / Project Ownership: Landing screen & privacy/AI disclosure, HUD & stop controls, Web Speech API (`SpeechRecognition` / `speechSynthesis`) & controls-only fallback, captions/accessibility, user testing & deployment/packaging.
  - Report Sections (4 sections): §2 Needs analysis, §6 Ethics, §7 User test, §9 Reflection and contributions.

## Target Device & Measured FPS
- Target Device: [e.g., Meta Quest browser / WebXR emulator / Desktop browser]
- Measured Frame Rate: [e.g., XX FPS — note target is 72 FPS for Quest]

## Run Locally (One Command)
```bash
python3 -m http.server 8000
