/// Design tokens and theme for every Kreiseck surface.
///
/// An app reads a role, never a step: `KdRoles.light['brand']`, not
/// `KdRamps.brand[700]`. The ramps are exported for the gallery and for
/// tooling that builds a brand colour at runtime.
library;

export 'src/tokens.dart';
export 'src/theme.dart';
export 'src/brand_ramp.dart';
