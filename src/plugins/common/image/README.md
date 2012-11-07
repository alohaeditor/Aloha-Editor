
# The AlohaEditor Image Plugin

Image Plugin for enabling basic images manipulations in Aloha Editor

## Features

* Insert image
* Edit url and title
* set align
* Handles [DragnDropFiles Plugin](https://github.com/alohaeditor/Aloha-Plugin-DragAndDropFiles) events for image files dropped in current page.
* css resize with controlbuttons or mousedrag
* reset to natural size (DEV)
* canvas crop (EXPERIMENTAL)

## Example conf

    config: {
			'img': {
				'max_width': '50px',
				'max_height': '50px',
				//Image manipulation options - ONLY in default config section
				'ui': {
					'meta': true, // If imageResizeWidth and imageResizeHeight are displayed, then you will want to set this to true, so that the width and height text fields are updated automatically.
					'crop':true, // If imageCropButton is displayed, then you have to enable this.
					'resizable': true,   //resizable ui-drag image
				},
				/**
				 * crop callback is triggered after the user clicked accept to accept his crop
				 * @param image jquery image object reference
				 * @param props cropping properties
				 */
				'onCropped':function (image, props) {},
				/**
				 * reset callback is triggered before the internal reset procedure is applied
				 * if this function returns true, then the reset has been handled by the callback
				 * which means that no other reset will be applied
				 * if false is returned the internal reset procedure will be applied
				 * @param image jquery image object reference
				 * @return true if a reset has been applied, false otherwise
				 */
				'onReset': function (image) { return false; }
			}
		}

To show or hide specific Image plug-in buttons, please configure @Aloha.settings.toolbar@, look at the "Image tab" example in @src/plugins/common/ui/lib/settings.js@.

## TODO

* resize slider
* canvas resize

Copyright (c) 2010-2011 Gentics Software GmbH, aloha@gentics.com 

Author : [Nicolas Karageuzian](https://github.com/nka11)

Contributors :

* [Nils Dehl](https://github.com/mrsunshine) 
* [Benjamin Athur Lupton](https://github.com/balupton)
* [Christopher Hlubek](https://github.com/chlu)
* [Thomas Lete](https://github.com/bistory)
* [Haymo Meran](https://github.com/draftkraft)
* [Clemens Prerovsky](https://github.com/cprerovsky) (base of crop and resize feature is a borrow from cropnresize plugin)
* [Norbert Pomaroli](https://github.com/npomaroli) (for his patience explaining Selection and Range)
* [Kirk Austin](http://www.kirkaustin.com/) who gave the impulsion to dive into html5 canvas	
