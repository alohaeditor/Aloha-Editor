All changes are categorized into one of the following keywords:

- **BUGFIX**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- ** BUGFIX**: (core/pluginmanager) Initialization no longer stalls when a
               configured plugin is disabled.
- ** BUGFIX**: (core/pluginmanager) Initialization will complete and
			   Aloha.ready() will fire even when no plugins have been
			   configured.
