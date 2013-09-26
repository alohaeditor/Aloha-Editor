All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**:     xyz-plugin: The change introduces a new feature, or modifies the function,
                   usage, or intent of an existing one.

----

- **BUGFIX**: blockmanager: Fixed scripts in a block being executed, when
              getting its configuration.
- **BUGFIX**: editables: Initializing empty editables in Firefox will no longer
              result in them aquiring an extra <br/>. This was previously done
			  to work around a Firefox bug that seems not no longer be an issue.
- **BUGFIX**: Fix display of values after image-reset and improve the
              size-check of image-resizing
- **BUGFIX**: image plugin: Various fixes and improvements for resizing, cropping and resetting images have been added, 
              to improve the cohesion between displayed values and actual sizes.
- **BUGFIX**: Outline on Icons is too big. No differences between an icon enabled or disabled.
              The outline when the icon is focused is too big and the user can't distinguish when a button
              icon is enabled or disabled. Adding box-shadow (same behavior for different browsers)
              the problem was solved.
