# Images

## care-corner-logo.png — supplied

The official Care Corner Singapore logo, rendered on slide 01.

Supplied asset: 332 × 212 px PNG, white "care corner" wordmark and crimson knot
mark on an **opaque dark background**.

Two consequences for anyone replacing it:

1. The logo carries its own dark ground, so `LogoSlot` renders it on a
   transparent slot over the dark cover slide. A light-background logo would
   need that CSS changed.
2. At 332 px native width it is not retina-crisp much beyond its own size, so
   `.image` caps at `max-width: 332px` rather than upscaling. **If a higher
   resolution version (≥ 840 px wide) or an SVG becomes available, drop it in
   and raise that cap** — the render will sharpen on high-DPI phones, which is
   most of the audience's devices.

If the file is ever absent, `LogoSlot` falls back to type reading
"Care Corner Singapore / Active Ageing & Senior Services". Build, tests and
deploy all succeed either way.
