All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**:     xyz-plugin: The change introduces a new feature, or modifies the function,
                   usage, or intent of an existing one.

----

- **BUGFIX**: WAI input text is mistaken by the Caption Table
              Putting the image of WAI inside the input text we make clear that this
              input text is for WAI text and not for Table Caption. RT#56649
- **BUGFIX**: Creation of several links or abbreviation is not fill with the same value.
              When create several links in different paragraphs or item list
              the value is not set the same for all the links but only for the first
              in the range selection.
              Changes were made so several links or abbreviation in the same selection
              have the same value. RT#55298
- **BUGFIX**: Table caption is removed every time is deactivated.
              Table caption is now hidden or shown but not removed,
              so the original text remains. RT#56649
- **BUGFIX**: Fix display of values after image-reset and improve the
              size-check of image-resizing
- **BUGFIX**: image plugin: Various fixes and improvements for resizing, cropping and resetting images have been added, 
              to improve the cohesion between displayed values and actual sizes.
- **BUGFIX**: Inputs containing image height/width don't display when image is loaded (ie9)
              When selecting an image the width and height inputs were not displayed.
              The problem was that when assigning the value to the input, the jQuery.val function was not
              working, because the element wasn't associated to the DOM yet.
