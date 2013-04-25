define(
['jquery'],
function (jQuery) {
	/**
	 * Initialize of the CreateLayer object
	 */
	CreateLayer = function(TablePlugin){
		this.TablePlugin = TablePlugin;
	};

	/**
	 * Internal configuration of the create-table panel
	 */
	CreateLayer.prototype.parameters = {
		elemId: 'aloha-table-createLayer', // id of the create-table panel
		className: 'aloha-table-createdialog',   // class-name of the create-table panel
		numX: 6,	         // Number of cols in the create-layer
		numY: 6,            // Number of rows in the create-layer vertically
		layer: undefined,    // Attribute holding the create-layer
		target: undefined    // the clicktarget which was clicked on (mostly the button of the floatingmenu)
	};

	/**
	 * The configuration-object for the implementer of the plugin. All keys of
	 * the "parameters" object could be overwritten within this object and will
	 * simply be used instead.
	 */
	CreateLayer.prototype.config = new Object();

	/**
	 * Flag wether the CreateLayer is currently visble or not
	 */
	CreateLayer.prototype.visible = false;

	/**
	 * This function checks if there is an create-table-layer. If no layer exists, it creates one and puts it into the configuration.
	 * If the layer was already created it sets the position of the panel and shows it.
	 *
	 * @return void
	 */
	CreateLayer.prototype.show = function(e){
		var layer = this.get('layer');

        if(e!==undefined){
            this.set('target', e.target);
        }

		// create the panel if the layer doesn't exist
		if (layer == null) {
			this.create();
            layer = this.get('layer');
            if(e!==undefined){
                this.setPosition(e.pageX, e.pageY);
            }
		} else {
			// or reposition, cleanup and show the layer
            if(e!==undefined){
                this.setPosition(e.pageX, e.pageY);
            }
			layer.find('td').removeClass('hover');
			layer.show();
		}
		this.visible = true;
        return layer;
	};

	/**
	 * Creates the div-layer which holds a table with the given number of rows and cols.
	 * It sets click and mouseover-events to the table data fields
	 *
	 * @return void
	 */
	CreateLayer.prototype.create = function () {
		var that = this;
		var layer = jQuery('<div></div>');
        var measure = jQuery('<div class="table-size-info">0 x 0</div>');
		layer.id = this.get('elemId');
		layer.addClass(this.get('className'));

        // Option for including a header row
        var options = jQuery('<div id="table-options"></div>')
            .append('<input type="checkbox" id="include-row-header" checked="checked" />')
            .append('<label for="include-row-header">Include header row</label>')
            .css('margin', '0.5em 0.25em')
            .on('click', function(e){
                var addheader = jQuery(e.target).is(":checked");
                jQuery('#table-options').parent()
                .find('table tr:first-child td').each(function(){
                    if(addheader){
                        jQuery(this).addClass("header");
                    } else {
                        jQuery(this).removeClass("header");
                    }
                })
            });
        layer.append(options);

		var table = jQuery('<table></table>');
		table.css('min-width', this.get('numX') * 25);
		var tr;
		var td;

		for (var i = 0; i < this.get('numY'); i++) {
			tr = jQuery('<tr></tr>');
			for (var j = 0; j < this.get('numX'); j++) {
				td = jQuery('<td>\u00a0</td>');
                if (i == 0){
                    td.addClass("header");
                }
				if (i == 0 && j == 0) {
					td.addClass('hover');
				}
				tr.append(td);
			}
			table.append(tr);
		}
		layer.append(table);
        layer.append(measure);

		// set attributes
		this.set('layer', layer);

        table.on('mouseover', 'td', function(e){
            var col = e.target.cellIndex;
            var row = jQuery(e.target).parent().index();
            measure.html((row+1) + " x " + (col+1));

            // Check if we are close to the edge of the selector
            var r = table.find('tr'),
                rowcount = r.length;
                colcount = r.eq(0).children().length;
            tx = that.get('numX');
            ty = that.get('numY');
            if(col+2>colcount){
                // Add a column
                table.find('tr').each(function(idx, el){
                    var td = jQuery('<td>\u00a0</td>');
                    if(idx==0){ td.addClass('header'); }
                    jQuery(el).append(td);
                });
                colcount++;
            } else if (colcount > ty) {
                console && console.log('oversized');
                // Remove columns until we're just big enough
                var ly = Math.max(ty-1, col+1);
                table.find('tr').each(function(idx, el){
                    jQuery(el).children().slice(ly+1).remove();
                });
                colcount = ly+1;
            }
            if(row+2>rowcount){
                // Add a row
                var tr = jQuery('<tr></tr>');
                for(var i = 0; i < colcount; i++){
                    tr.append('<td>\u00a0</td>');
                }
                table.append(tr);
                rowcount++;
            } else if (rowcount > tx){
                // Remove rows until we're just big enough
                var lx = Math.max(tx-1, row+1);
                table.find('tr').slice(lx+1).remove();
                rowcount = lx+1;
            }

            that.handleMouseOver(e, table, row, col);
        });

        table.on('click', 'td', function(e){
            var rows = jQuery(e.target).parent().index() + 1;
            var cols = e.target.cellIndex + 1;

            var dialog = jQuery(e.target)
                .closest('div.aloha-table-createdialog');
            var headerrows = Number(dialog.find(
                '#include-row-header').is(':checked'));

            that.TablePlugin.createTable(cols, rows - headerrows,
                headerrows);
            that.hide();
        });

		// stop bubbling the click on the create-dialog up to the body event
		layer.bind('click', function(e) {
			e.stopPropagation();
		}).mousedown(function(e) {
			e.stopPropagation();
		});

		// append layer to body and
		// hide the create layer if user clicks anywhere in the body
		jQuery('body').append(layer).bind('click', function(e) {
			// If the layer is visible and the event target is not the
			// button itself or a descendant of the button, hide the
			// layer.
			if (that.visible && !(e.target === that.get('target') || jQuery.contains(that.get('target'), e.target))) {
				that.hide();
			}
		});
	};

	/**
	 * handles the mose over state for a cell
	 * @param e event object
	 * @param table the aeffected table
	 * @return void
	 */
	CreateLayer.prototype.handleMouseOver = function(e, table, rowId, colId) {
		var innerRows = table.find('tr');

		for (var n = 0; n <= innerRows.length; n++) {
			var innerCells = jQuery(innerRows[n]).find('td');

			for (var k = 0; k <= innerCells.length; k++) {
				if (n <= rowId && k <= colId) {
					jQuery(innerCells[k]).addClass('hover');
				} else {
					jQuery(innerCells[k]).removeClass('hover');
				}
			}
		}
	};

	/**
	 * Sets the "left" and "top" style-attributes according to the clicked target-button
	 *
	 *  @return void
	 */
	CreateLayer.prototype.setPosition = function(x, y) {
		this.get('layer').css('left', x + 'px');
		this.get('layer').css('top', y + 'px');
	};

	/**
	 * Hides the create-table panel width the jQuery-method hide()
	 *
	 * @see jQuery().hide()
	 * @return void
	 */
	CreateLayer.prototype.hide = function() {
        var layer = this.get('layer');
		layer.hide();
		this.visible = false;

        // Fire event for this closure
        var ev = jQuery.Event();
        ev.type = 'table-create-layer.closed'
        ev.target = layer;
        layer.trigger(ev);
        $(this).trigger(ev);
	};

	/**
	 * The "get"-method returns the value of the given key. First it searches in the
	 * config for the property. If there is no property with the given name in the
	 * "config"-object it returns the entry associated with in the parameters-object
	 *
	 * @param property
	 * @return void
	 */
	CreateLayer.prototype.get = function(property) {
		// return param from the config
		if (this.config[property]) {
			return this.config[property];
		}
		// if config-param was not found return param from the parameters-object
		if (this.parameters[property]) {
			return this.parameters[property];
		}
		return undefined;
	};

	/**
	 * The "set"-method takes a key and a value. It checks if there is a key-value
	 * pair in the config-object. If so it saves the data in the config-object. If
	 * not it saves the data in the parameters-object.
	 *
	 * @param key
	 *            the key which should be set
	 * @param value
	 *            the value which should be set for the associated key
	 */
	CreateLayer.prototype.set = function (key, value) {
		// if the key already exists in the config-object, set it to the config-object
		if (this.config[key]) {
			this.config[key] = value;

			// otherwise "add" it to the parameters-object
		}else{
			this.parameters[key] = value;
		}
	};

	return CreateLayer;
});
