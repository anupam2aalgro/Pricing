var items_view,
	items_loader_view,
	items_category_view,
	edit_item_view,
	after_edit_item_view;


/** 
View Id : items-view 
Show the 5 item categories - "Leafy", "Fruits", "Exotic", "OPG" & "Vegetables"
*/
var ItemsView = Backbone.View.extend({
	el: '#contents',
	render: function () {
		var template = _.template($("#items-view").html());
		this.$el.html(template);

		/* Make the "Items" tab active */
		$("#home-tabs a").removeClass('home-tab-active');
		$("#items-tab").addClass('home-tab-active');
	}
});


/** 
View Id : items-loader-view 
Send an ajax to get items of a category
*/
var ItemsLoaderView = Backbone.View.extend({
	el: '#item-category-contents',
	render: function () {
		this.$el.empty();
		var template = _.template($("#items-loader-view").html());
		this.$el.html(template);
		
		/* Make the category tab active */
		$(".item-category-tab").removeClass('item-category-tab-active');
		$("#" + this.options['category_name'] + "-items").addClass('item-category-tab-active');

		/* Send an ajax to get items of the category */
		Backbone.ajax({
			type: 'get',
			url: 'controller.php',
			data: { command: 'GetItemsByCategory', category_id: this.options['category_id'] },
			dataType: 'json',
			success: function (response) {
				$("#all-items-loader").hide();
				
				/* On no error show the items */
				if(response.error == 0) {
					items_category_view = new ItemsCategoryView({ 
																	items: response.data.items,                   // Items in the category
																	units: response.data.units,                   // All Units 
																	category_id: response.data.category_id        // Category Id
																});
					items_category_view.render();
				}
			}
		});
	}
});


/** 
View Id : items-category-view 
Show the items of the category
*/
var ItemsCategoryView = Backbone.View.extend({
	el: '#item-category-contents',
	render: function () {
		this.$el.empty();
		var template = _.template(
								$("#items-category-view").html(), { 
									items: this.options['items'],              // Send items to the view
									units: this.options['units'],              // Send units to the view
									category_id: this.options['category_id']   // Send Category Id to the view
								});
		this.$el.html(template);
	},
	events: {
		'click .item-edit-button': 'editItem',                   // Click event on "Edit Existing Item" button
		'click .item-variety-delete': 'deleteItemVariety',       // Click event on "Delete Item Variety" button
		'click .add-variety-button': 'addItemVariety',           // Click event on "Add Item Variety" button
		'click .item-row-save': 'saveItem',                      // Click event on "Save Existing Item" button
		'click .item-row-delete': 'deleteItem',                  // Click event on "Delete Item" button
		'click .item-confirm-delete-no': 'cancelDelete',         // Click event on "Cancel Item Deletion" button
		'click .item-confirm-delete-yes': 'proceedDelete',       // Click event on "Proceed with Item Deletion" button
		'click .item-row-cancel': 'cancelItem',                  // Click event on "Cancel Existing Item and return to normal view" button
		'click .item-name-edit': 'editItemName',                 // Click event on "Edit Item Name" button
		'click .item-variety-edit': 'editItemVariety',           // Click event on "Edit Existing Item Variety" button
		'click #add-more-items': 'addItem',                      // Click event on "Add New Item" button
		'click .item-new-row-cancel': 'cancelNewItem',           // Click event on "Cancel New Item" button
		'click #save-new-items': 'saveNewItems'                  // Click event on "Save New Items" button
	},
	
	/** 
	Click event on "Edit Existing Item" button
	Edit an existing item
	Show the edit mode of the item
	*/ 
	editItem: function (e) {
		var parent_row = $(e.currentTarget).closest('.item-row');

		/* Show the edit mode of the item */
		edit_item_view = new EditItemView({ 
											item_id: parent_row.attr('data-item-id'),                    // Id the item
											item_json: parent_row.attr('data-item'),           			 // JSON data for the item
											units: $("#all-items-table").attr('data-units')    			 // All Units
										});
		edit_item_view.render();
	},
	
	/**
	Click event on "Delete Item Variety" button
	Delete the item variety 
	*/
	deleteItemVariety: function (e) {
		$(e.currentTarget).parent().remove();
	},
	
	/** 
	Click event on "Add Item Variety" button
	Add an item variety
	Append a textbox to the item varieties just before the "Add Item Variety" button
	*/ 
	addItemVariety: function (e) {
		var html = '<div class="sep-div"><input type="text" class="item-variety-new" data-item-variety-id="new" /><i class="item-variety-delete fa fa-trash-o" title="Delete Item Variety"></i></div>';
		$(html).insertBefore($(e.currentTarget));
	},
	
	/** 
	Click event on "Save Existing Item" button
	Save the edited item
	Send an ajax request & on success return to normal item view [with the updated item]
	*/ 
	saveItem: function (e) {
		var blank_reg_exp = /^([\s]{0,}[^\s]{1,}[\s]{0,}){1,}$/,   // Check for blank entry
			parent_row = $(e.currentTarget).closest('.item-row'),  // Get the item row
			error = 0;                                             // error flag initially set to 0

		// Hide the error fields in the item row
		parent_row.find('.error').hide();
		// Hide the confirm delete dialog
		$(e.currentTarget).closest('.item-header-edit').find('.item-confirm-delete').hide();

		// Check for empty item name
		if(!blank_reg_exp.test(parent_row.find('.item-header-name input[type="text"]').val())) {
			parent_row.find('.item-header-name .error').html('Name empty').show();
			error = 1;
		}

		// Check whether at least one unit is selected
		if(parent_row.find('.item-header-units input[type="checkbox"]:checked').length == 0) {
			parent_row.find('.item-header-units .error').html('No units selected').show();
			error = 1;
		};

		// Check whether any item variety is left blank
		parent_row.find('.item-header-varieties input[type="text"]').each(function () {
			if(!blank_reg_exp.test($(this).val())) {
				parent_row.find('.item-header-varieties .error').html('Name empty').show();
				error = 1;
			}
		});

		// If any error dont proceed
		if(error == 1) {
			return;
		}

		var item_old = JSON.parse(parent_row.attr('data-item')),    // JSON data of the unedited item
			item_new = {};               // Create an object representing the edited item; set "item_id" key 

		/**
		Check whether item name has been changed 
		If changed add "item_name" key to the edited item object
		*/ 
		var item_name_element = parent_row.find(".item-header-name input[type='text']");
		if(item_name_element.val() != item_name_element.attr('defaultValue')) {
			item_new.item_name = item_name_element.val();
		}

		
		/**
		Check for edited item units
		*/
		var item_new_units = [],                                    // Represents the units[ids] of the edited item
			item_old_units = Object.keys(item_old.item_units),      // Represents the units[ids] of the unedited(original) item
			item_units_removed = [],                                // Represents units[ids] that have been removed
			item_units_added = [];                                  // Represents units[ids] that have been added
		// Find the units[ids] of the edited item 
		parent_row.find('.item-header-units input[type="checkbox"]:checked').each(function () {
			item_new_units.push($(this).val());
		});
		// Find the units[ids] that have been removed 
		for(var i=0; i<item_old_units.length; i++) {
			if(item_new_units.indexOf(item_old_units[i]) == -1) {
				item_units_removed.push(item_old_units[i]);
			}
		}
		// Find the units[ids] that have been added 
		for(var i=0; i<item_new_units.length; i++) {
			if(item_old_units.indexOf(item_new_units[i]) == -1) {
				item_units_added.push(item_new_units[i]);
			}
		}
		// Add keys to the edited item object 
		item_new.item_units_added = item_units_added;
		item_new.item_units_removed = item_units_removed;

		
		/**
		Check for edited item varieties
		*/
		var item_new_varieties = [],                                                                                       // Represents the varieties[ids; not strings] of the edited item
			item_old_varieties =  typeof item_old.item_varieties == 'object' ? Object.keys(item_old.item_varieties):[],    // Represents the varieties[ids] of the unedited(original) item
			item_varieties_removed = [],                                                                                   // Represents varieties[ids] that have been removed
			item_varieties_added = [],                                                                                     // Represents varieties[strings] that have been added
			item_varieties_edited = [];                                                                                    // Represents varieties[ids] that have been edited
		// Find the varieties[ids] of the edited item 
		parent_row.find('.item-header-varieties .item-variety-old').each(function () {
			item_new_varieties.push($(this).attr('data-item-variety-id'));
		});	
		// Find the varieties[ids] that have been removed 
		for(var i=0; i<item_old_varieties.length; i++) {
			if(item_new_varieties.indexOf(item_old_varieties[i]) == -1) {
				item_varieties_removed.push(item_old_varieties[i]);
			}
		}
		// Find the varieties[strings] that have been added 
		parent_row.find('.item-header-varieties .item-variety-new').each(function () {
			item_varieties_added.push($(this).val());
		});
		// Find the varieties[ids] that have been edited 
		parent_row.find('.item-header-varieties .item-variety-old').each(function () {
			if($(this).val() != $(this).attr('defaultValue'))
				item_varieties_edited.push({ item_variety_id: $(this).attr('data-item-variety-id'), item_variety_name: $(this).val() });
		});	
		// Add keys to the edited item object 
		item_new.item_varieties_added = item_varieties_added;
		item_new.item_varieties_removed = item_varieties_removed;
		item_new.item_varieties_edited = item_varieties_edited;

		// Hide buttons & show the loader
		parent_row.find('.item-header-edit .sep-div').hide();
		parent_row.find('.item-header-edit .item-local-loader').show();
		// Send an ajax
		Backbone.ajax({
			type: 'get',
			url: 'controller.php',
			data: { command: 'EditItem', data: item_new, item_id: parent_row.attr('data-item-id') },
			dataType: 'json',
			success: function (response) {
				// Show buttons & hide the loader
				parent_row.find('.item-header-edit .sep-div').show();
				parent_row.find('.item-header-edit .item-local-loader').hide();
				
				// On no error show the normal view of the item[updated]
				if(response.error == 0) {
					after_edit_item_view = new AfterEditItemView({ 
																	element: parent_row,              // Item row in DOM
																	item: response.data.item          // JSON item data
																});
					after_edit_item_view.render();
				}
			}
		});
	},
	
	/**
	Click event on "Delete Item" button
	Shows the "Confirm Delete" dialog
	*/
	deleteItem: function (e) {
		// Find & show the "Confirm Delete" dialog
		var parent_td = $(e.currentTarget).closest('.item-header-edit');
		parent_td.find('.item-confirm-delete').show();
	},
	
	/** 
	Click event on "Cancel Item Deletion" button
	Cancel out the item deletion
	*/
	cancelDelete: function (e) {
		$(e.currentTarget).closest('.item-confirm-delete').hide();
	},
	
	/**
	Click event on "Proceed with Item Deletion" button
	Delete the item 
	*/
	proceedDelete: function (e) {
		// Get the parent row
		var parent_row = $(e.currentTarget).closest('.item-row');

		// Hide buttons & show the loader
		parent_row.find('.item-header-edit .sep-div').hide();
		parent_row.find('.item-header-edit .item-confirm-delete').hide();
		parent_row.find('.item-header-edit .item-local-loader').show();
		// Send an ajax
		Backbone.ajax({
			type: 'get',
			url: 'controller.php',
			data: { command: 'DeleteItem', item_id: parent_row.attr('data-item-id') },
			dataType: 'json',
			success: function (response) {
				// Show buttons & hide the loader
				parent_row.find('.item-header-edit .sep-div').show();
				parent_row.find('.item-header-edit .item-local-loader').hide();
				
				/**
				On no error remove the item row
				If all item rows are removed show the "No items found" text
				*/
				if(response.error == 0) {
					parent_row.remove();
					if($(".item-row").length == 0) {
						$("#all-items-table").hide();
						$("#no-items").show();
					}
				}
			}
		});
	},
	
	/**
	Click event on "Cancel Existing Item and return to normal view" button
	Cancel the edit and return to normal view 
	*/
	cancelItem: function (e) {
		// Get item row
		var parent_row = $(e.currentTarget).closest('.item-row');

		// Return to normal view 
		after_edit_item_view = new AfterEditItemView({ 
														element: parent_row,                               // Item row in DOM
														item: JSON.parse(parent_row.attr('data-item'))     // JSON item data
													});
		after_edit_item_view.render();
	},
	
	/**
	Click event on "Edit Item Name" button
	Enable editing for item name [Initially it is disabled]
	*/
	editItemName: function (e) {
		// Find the button and hide it; enable the textbox
		$(e.currentTarget).parent().find("input[type='text']").removeAttr('disabled');
		$(e.currentTarget).remove();
	},
	
	/**
	Click event on "Edit Existing Item Variety" button
	Enable editing for existing item variety [Initially it is disabled]
	*/
	editItemVariety: function (e) {
		// Find the button and hide it; enable the textbox; show the delete button for item variety
		$(e.currentTarget).parent().find("input[type='text']").removeAttr('disabled');
		$(e.currentTarget).parent().find(".item-variety-delete").show();
		$(e.currentTarget).remove();
	},
	
	/** 
	Click event on "Add New Item" button
	Append a new empty item row
	*/
	addItem: function () {
		// If initially no items then show the items table [initially empty]
		if($(".item-row").length == 0) {
			$("#no-items").hide();
			$("#all-items-table").show();
		}

		/* Add an emptyitem to the table */
		edit_item_view = new EditItemView({ 
											item_id: 'new',                                                                // Element is set to "new"
											item_json: '{"item_name":"","item_units":{},"item_varieties":{}}',             // JSON data of new item
											units: $("#all-items-table").attr('data-units')                                // All Units
										});
		edit_item_view.render();

		// Show the "Save Items" button
		$("#save-new-items").show();
	},
	
	/** 
	Click event on "Cancel New Item" button
	Delete the newly added item
	*/
	cancelNewItem: function (e) {
		$(e.currentTarget).closest('.item-row').remove();

		if($(".item-row-new").length == 0)
			$("#save-new-items").hide();
	},
	
	/** 
	Click event on "Save New Items" button
	Send an ajax and save the new items; & show the normal mode of added items
	*/
	saveNewItems: function (e) {
		// If ajax call going then return
		if($(e.currentTarget).attr('data-in-progress') == 1)
			return;

		var blank_reg_exp = /^([\s]{0,}[^\s]{1,}[\s]{0,}){1,}$/,                 // Check for blanks
			error = 0,                                                           // error flag
			that;                                                                // variable that stores "this"

		// Hide the error in all newly created items
		$(".item-row-new").find('.error').hide();

		// For each nwly created items check for errors
		$('.item-row-new').each(function () {
			// Check for blank item name
			if(!blank_reg_exp.test($(this).find('.item-header-name input[type="text"]').val())) {
				$(this).find('.item-header-name .error').html('Name empty').show();
				error = 1;
			}

			// Check whether no units are selected
			if($(this).find('.item-header-units input[type="checkbox"]:checked').length == 0) {
				$(this).find('.item-header-units .error').html('No units selected').show();
				error = 1;
			};

			// Check for empty item variety in all items
			that = this;
			$(this).find('.item-header-varieties input[type="text"]').each(function () {
				if(!blank_reg_exp.test($(this).val())) {
					$(that).find('.item-header-varieties .error').html('Name empty').show();
					error = 1;
				}
			});
		});	
		
		// If error dont proceed
		if(error == 1) {
			return;
		}

		var new_items = [],       // Array of new items to be send with ajax
			new_item = {};        // New item temporary variable
		// For each newly created row
		$('.item-row-new').each(function () {
			// Initialize "new_item"; set key 'category_id'
			new_item = { category_id: $("#all-items-table").attr('data-category-id') };
			// Update item_name in "new_item"
			new_item.item_name = $(this).find('.item-header-name input[type="text"]').val();
			// item_units in "new_item"
			new_item.item_units = [];
			
			// Find the units(id) of the item
			$(this).find('.item-header-units input[type="checkbox"]:checked').each(function () {
				new_item.item_units.push($(this).val());
			});

			// item_varieties in "new_item"
			new_item.item_varieties = [];
			// Find the varieties(string) of the item
			$(this).find('.item-header-varieties input[type="text"]').each(function () {
				new_item.item_varieties.push($(this).val());
			});

			// Add "new_item" to the new items array
			new_items.push(new_item);
		});	

		// Hide the "Add New Item" button and change text of "Save Items" button to 'Saving ..'
		$("#add-more-items").hide();
		$("#save-new-items").css('opacity', '0.5').text('Saving ..').attr('data-in-progress', '1');
		// Send an ajax
		Backbone.ajax({
			type: 'get',
			url: 'controller.php',
			data: { command: 'AddItems', new_items: new_items },
			dataType: 'json',
			success: function (response) {
				// Show the "Add New Item" button and change text of "Save Items" button to normal
				$("#add-more-items").show();
				$("#save-new-items").css('opacity', '1').text('Save Items').attr('data-in-progress', '0');;
				
				// On no error
				if(response.error == 0) {
					// Hide the save button
					$("#save-new-items").hide();

					// For all newly created item show the normal item view
					$('.item-row-new').each(function (index) {
						after_edit_item_view = new AfterEditItemView({  
																		element: $(this),                      // Newly created item row
																		item: response.data.items[index]       // JSON data for the item
																	});
						after_edit_item_view.render();
					});
				}
			}
		});
	}
});


/** 
View Id : item-row-edit-view 
Show the edit mode of an item
*/
var EditItemView = Backbone.View.extend({
	render: function () {
		var template = _.template(
									$("#item-row-edit-view").html(), { 
										item_id: this.options['item_id'],        // Item Id
										item_json: this.options['item_json'],    // JSON data of the item to the view
										units: this.options['units']             // All Units to the view
									});
		
		// If item is new then append the row to the table
		if(this.options['item_id'] == 'new') {
			$("#all-items-table").append(template);
		}
		// Else [editing an existing item] replace the row
		else {
			this.$el = $('#item-' + this.options['item_id']); 
			this.$el.replaceWith(template);
		}
	}
});


/** 
View Id : item-row-after-edit-view 
Show the edit mode of an item
*/
var AfterEditItemView = Backbone.View.extend({
	render: function () {
		var template = _.template(
									$("#item-row-after-edit-view").html(), { 
										item: this.options['item']             // JSON data of the item to the view
								});
		this.options['element'].replaceWith(template);
	}
});