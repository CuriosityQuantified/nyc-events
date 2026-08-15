# Profiles start anonymous and may be claimed

Every Profile is created anonymously against an opaque device token and owns its Interests, Saved list, and Matches from the start. `profile.user_id` is nullable from the first migration; claiming a Profile with a Clerk account sets it.

This keeps the product usable with no account and no personal data, per the original frontend direction, while still allowing cross-device sync for people who want it. The consequence to build carefully is the claim flow: when someone with an existing anonymous Profile signs into an account that already has one, two Profiles collide and must be reconciled — this is where saved-data-loss bugs come from.
