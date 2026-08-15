# An Event is exactly one source row

Events are stored one row per source `guid`, with no parent entity grouping recurring sessions. The feed's own identity unit is `guid`, and any grouping key we invented (title plus location, say) would be a guess — and a wrong guess about identity silently corrupts the change detection that the entire sync layer depends on.

The visible cost is real and intended: a class running every Saturday appears as five separate cards, not one card with five dates. This looks like a bug and is not one. Grouping for display may be added in the presentation layer later; it must not be added to the identity model.
