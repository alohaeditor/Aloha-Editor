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
- **BUGFIX**: Outline on icons is too big resulting in too little visual difference between enabled or disabled state.
              The outline when the icon is focused is too big and the user can't distinguish when a button
              icon is enabled or disabled. By adding box-shadow (same behavior for different browsers)
              the problem was solved.
- **BUGFIX**: block plugin: Fix the error "Member not found" occuring when initializing a block
              with links in it. This error occurs on IE 10 compatbility mode with document mode 7.

- **BUGFIX**: paste plugin: Pasting will no longer always break the line.
              A wrapping element will no longer be created to contain the copy
              content. RT#56692

- **BUGFIX**: header ids plugin: A header ID will now automatically be added as
              soon as the heading is created if the header id plugins is
              activated. RT#56670

- **BUGFIX**: table plugin: The "scope" attribute in TH elements will now be
			  correctly set to "col" instead of "column".  This attribute only
			  accepts "col" or "row" as values. RT#56088

- **BUGFIX**: Aloha Editor very slow on large content
              Some performance were made, so the Aloha-editor smartContenthandler is faster
              in large contents. Improvements of loop-for, jQuery selector and Dom iteration.
              RT#56619

- **BUGFIX**: rangy: Change rangy-core configuration property "preferTextRange"
              to false in order to allow for more performant ways to work with
              ranges in IE.  Accomodations were taken to ensure that IE 9 would
              not crash with this flag.

- **BUGFIX** commands: Further cleanup will no longer be done after inserting
             paragraphs since this extra processing was not necessary and very
             expensive on large content.

- **BUGFIX**: tables: Remove "width" attribute from copied tables. RT#55759

- **BUGFIX**: Copy text to Mozilla browser, mess up with the order
              When copy to Mozilla it keeps the <br> tags instead of replacing them
              for <p> tags. The solution is to replace the <br> tags by <p> tags but
              only aiming <br> tags from the children of the parent. If the children of
              the children have some <br> tags we assume that those were intentionally
              written for a reason. RT#57009
