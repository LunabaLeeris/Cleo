# Composable Pixel Sprites

This directory holds sprite sheets for Cleo's composable avatar system.

## Directory Structure

```
sprites/
├── body/           ← Head + hair sprite sheets
│   ├── idle.png
│   └── hair_up.png
├── eyes/           ← Eye sprite sheets
│   ├── idle.png
│   └── blink.png
├── mouth/          ← Mouth sprite sheets
│   ├── idle.png
│   └── speak.png
├── eyebrows/       ← Eyebrow sprite sheets
│   ├── idle.png
│   └── question.png
└── README.md
```

## Sprite Sheet Format

Each animation is a **horizontal strip** of equally-sized frames:

```
┌──────┬──────┬──────┬──────┐
│ Fr 0 │ Fr 1 │ Fr 2 │ Fr 3 │  ← 4-frame animation, 64×64 per frame = 256×64 image
└──────┴──────┴──────┴──────┘
```

### Frame Count Rules

Frame counts must be a **factor of 12** (1, 2, 3, 4, 6, 12) OR a **multiple of 12** (24, 36, 48, ...).

| Frames | Image Width (64px per frame) | Cycles per 12-frame master |
|--------|------------------------------|----------------------------|
| 1      | 64px (static)                | Repeats every tick          |
| 2      | 128px                        | 6 loops                    |
| 3      | 192px                        | 4 loops                    |
| 4      | 256px                        | 3 loops                    |
| 6      | 384px                        | 2 loops                    |
| 12     | 768px                        | 1 loop                     |
| 24     | 1536px                       | Spans 2 master cycles      |

## Part Dimensions (Placeholder)

These are approximate — adjust in `avatar-config.ts` once art is finalized:

| Part     | Suggested Size | Notes                                    |
|----------|----------------|------------------------------------------|
| body     | 64×64          | Full head + hair, defines the base frame |
| eyes     | 24×8           | Both eyes as one strip                   |
| mouth    | 16×8           | Mouth region                             |
| eyebrows | 24×4           | Both eyebrows as one strip               |

## Drawing Software

- **LibreSprite** (Free/Open Source fork of Aseprite)
- **Pixelorama** (Free/Open Source)
- **Piskel** (Free/Open Source)

## How It Works

The avatar is rendered by compositing 4 layers (body → eyes → mouth → eyebrows)
onto a canvas each frame. Each part has independent animations that can be
swapped at any time. A global keyframe offset map ensures face parts track
the body's breathing motion.

See `src/avatar/avatar-config.ts` for the configuration.
