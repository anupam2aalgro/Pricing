var suppliers_view,
	suppliers_loader_view,
	suppliers_category_view,
	new_supplier_view,
	supplier_items_view,
	supplier_new_item_view,
	supplier_saved_items_view,
	supplier_info_view;

var ITEMS = [],
	UPDATE_ITEMS = 1;


/** 
View Id : suppliers-view 
Show the 3 supplier categories - "Vendors", "Retail" & "Mandi"
*/
var SuppliersView = Backbone.View.extend({
	el: '#contents',
	render: function () {
		var template = _.template($("#suppliers-view").html());
		this.$el.html(template);

		/* Make the "Suppliers" tab active */
		$("#home-tabs a").removeClass('home-tab-active');
		$("#suppliers-tab").addClass('home-tab-active');

		// Set this flag to 1 so that next time a supplier's items are requested, all items will be returned too
		UPDATE_ITEMS = 1;
	}
});


/** 
View Id : suppliers-loader-view 
Send an ajax to get suppliers of a category
*/
var SuppliersLoaderView = Backbone.View.extend({
	el: '#supplier-category-contents',
	render: function () {
		var template = _.template($("#suppliers-loader-view").html());
		this.$el.html(template);
		
		/* Make the category tab active */
		$(".supplier-category-tab").removeClass('supplier-category-tab-active');
		$("#" + this.options['category_name'] + "-suppliers").addClass('supplier-category-tab-active');

		/* Send an ajax to get suppliers of the category */
		Backbone.ajax({
			type: 'GET',
			url: 'controller.php',
			data: { command: 'GetSuppliersByCategory', category_id: this.options['category_id'] },
			dataType: 'json',
			success: function (response) {
				$("#all-suppliers-loader").hide();
				
				/* On no error show the suppliers */
				if(response.error == 0) {
					suppliers_category_view = new SuppliersCategoryView({ 
																	suppliers: response.data.suppliers,                   // Suppliers in the category
																	category_id: response.data.category_id                // Category Id
																});
					suppliers_category_view.render();
				}
			}
		});
	}
});


/** 
View Id : suppliers-category-view 
Show the suppliers of the category
*/
var SuppliersCategoryView = Backbone.View.extend({
	el: '#supplier-category-contents',
	render: function () {
		var template = _.template(
								$("#suppliers-category-view").html(), { 
									suppliers: this.options['suppliers'],              // Send suppliers to the view
									category_id: this.options['category_id']           // Send Supplier Category Id to the view
								});
		this.$el.html(template);

		// Set the width of supplier table controls to the width of the suppliers table
		$("#add-save-more-suppliers, #add-save-more-suppliers-error").outerWidth($("#all-suppliers-table").width());
	},
	events: {
		'click .supplier-delete-button': 'deleteSupplier',                     // Click event on "Supplier Delete" button
		'click .supplier-confirm-delete-no': 'cancelDelete',                   // Click event on "Cancel Supplier Deletion" button
		'click .supplier-confirm-delete-yes': 'proceedDelete',                 // Click event on "Proceed with Supplier Deletion" button
		'click .supplier-info-button': 'supplierInfo',                         // Click event on "Supplier Info" button
		'click .supplier-items-button': 'supplierItems',                       // Click event on "Supplier Items" button
		'click #add-more-suppliers': 'addSupplier',                            // Click event on "Add Supplier" button
		'click #save-new-suppliers': 'saveNewSuppliers',                       // Click event on "Save New Suppliers" button
		'click .new-supplier-delete': 'deleteNewSupplier',                     // Click event on "Delete New Supplier" button
		'click .new-supplier-add-remark': 'addNewSupplierRemark',              // Click event on "Add Remark on New Supplier" button    
		'click .new-supplier-delete-remark': 'deleteNewSupplierRemark',        // Click event on "Delete Remark on New Supplier" button
	},
	
	/** 
	Click event on "Supplier Delete" button
	Deletes the supplier
	*/ 
	deleteSupplier: function (e) {
		var parent_td = $(e.currentTarget).closest('.supplier-header-edit');
		parent_td.find('.supplier-confirm-delete').show();
	},
	
	/** 
	Click event on "Cancel Supplier Deletion" button
	Cancel the supplier deletion
	*/ 
	cancelDelete: function (e) {
		$(e.currentTarget).closest('.supplier-confirm-delete').hide();
	},
	
	/** 
	Click event on "Proceed with Supplier Deletion" button
	Proceed with supplier deletion
	*/ 
	proceedDelete: function (e) {
		var parent_td = $(e.currentTarget).closest('td'),
			parent_row = $(e.currentTarget).closest('tr'),
			supplier_id = parent_row.attr('data-supplier-id');

		// Hide the buttons - Delete, Info & Items
		parent_td.find('.supplier-header-edit-buttons').hide();
		
		// Hide the "Confirm Delete" dialog
		parent_td.find('.supplier-confirm-delete').hide();
		
		// Show the loader
		parent_td.find('.supplier-local-loader').show();
		
		// Send an ajax to delete the supplier
		Backbone.ajax({
			type: 'get',
			url: 'controller.php',
			data: { command: 'DeleteSupplier', supplier_id: supplier_id },
			dataType: 'json',
			success: function (response) {
				// Show the buttons & Hide the loader
				parent_td.find('.supplier-header-edit-buttons').show();
				parent_td.find('.supplier-local-loader').hide();
				
				// On no error
				if(response.error == 0) {
					// Remove the row from table
					parent_row.remove();
					
					// If there are no more suppliers now, then hide the table and show "No Suppliers" message
					if($(".supplier-row").length == 0) {
						$("#all-suppliers-table").hide();
						$("#no-suppliers").show();
					}

					// If a Supplier Info dialog is open
					if($("#supplier-info-container").is(':visible')) {
						// And it is of the same supplier as the deleted supplier => Delete the Supplier Info container[html] & Supplier Info View [ if it was previously defined]
						if($("#supplier-info-container").attr('data-supplier-id') == supplier_id) {
							$("#supplier-info-container").remove();
							if(typeof supplier_info_view != 'undefined') {
								supplier_info_view.undelegateEvents();
							}
						}
					}

					// If a Supplier Items dialog is open
					if($("#supplier-all-items").is(':visible')) {
						// And it is of the same supplier as the deleted supplier => Delete the Supplier Items container[html] & Supplier Items View [ if it was previously defined]
						if($("#supplier-all-items").attr('data-supplier-id') == supplier_id) {
							$("#supplier-all-items").remove();
								if(typeof supplier_items_view != 'undefined') {
									supplier_items_view.undelegateEvents();
								}
						}
					}
				}
			}
		});
	},
	
	/** 
	Click event on "Add Supplier" button
	Add new suppliers
	*/ 
	addSupplier: function () {
		// Initiate the view for adding a supplier
		new_supplier_view = new NewSupplierView();
		new_supplier_view.render();

		// Show the "Save" button for new suppliers
		$("#save-new-suppliers").show();
	},
	
	/** 
	Click event on "Delete New Supplier" button
	Delete new suppliers
	*/ 
	deleteNewSupplier: function (e) {
		// Remove the html
		$(e.currentTarget).parent().remove();

		// If there are no more new suppliers then hide the "Save" button
		if($(".new-supplier-container").length == 0) {
			$("#save-new-suppliers").hide();		
		}
	},
	
	/** 
	Click event on "Add Remark on New Supplier" button   
	Add a remark to a new supplier
	*/ 
	addNewSupplierRemark: function (e) {
		// Append html before the "Add Supplier" button
		var html = '<div class="new-supplier-remark-container">';
		html += '<textarea class="new-supplier-remark"></textarea>';
		html += '<div class="new-supplier-delete-remark"><i class="fa fa-trash-o fa-lg" title="Delete Remark"></i></div>';
		html += '</div>';

		$(html).insertBefore($(e.currentTarget));
	},
	
	/** 
	Click event on "Delete Remark on New Supplier" button   
	Delete a remark from a new supplier
	*/ 
	deleteNewSupplierRemark: function (e) {
		$(e.currentTarget).parent().remove();
	},
	
	/** 
	Click event on "Save New Suppliers" button
	Save new suppliers
	*/ 
	saveNewSuppliers: function () {
		var blank_reg_exp = /^([\s]{0,}[^\s]{1,}[\s]{0,}){1,}$/,    // check for blanks
			new_supplier = {},                                      // temp var that holds the new supplier
			new_suppliers = [],                                     // array of new suppliers
			error = 0,                                              // error flag
			that;                                                   // temp var that holds reference

		// Hide the previous errors
		$("#add-save-more-suppliers-error").hide();
		$(".new-supplier-container").find("input[type='text'], textarea").removeClass('new-supplier-wrong-parameter');

		// For each new supplier
		$(".new-supplier-container").each(function () {
			// Validate supplier name is not blank; set new class on error
			if(!blank_reg_exp.test($(this).find(".new-supplier-name").val())) {
				$(this).find(".new-supplier-name").addClass('new-supplier-wrong-parameter');
				error = 1;
			}

			// Validate any supplier remark is not blank; set new class on error 
			$(".new-supplier-remark").each(function () {
				if(!blank_reg_exp.test($(this).val())) {
					$(this).addClass('new-supplier-wrong-parameter');
					error = 1;
				}
			});
		});

		// If error show the error container
		if(error == 1) {
			$("#add-save-more-suppliers-error").show();
			return;
		}

		// For each new supplier, push supplier info in the array var
		$(".new-supplier-container").each(function (index) { 
			new_supplier = {};
			new_supplier.name = $(this).find(".new-supplier-name").val();
			new_supplier.phone = $(this).find(".new-supplier-phone").val();
			new_supplier.address = $(this).find(".new-supplier-address").val();
			new_supplier.remarks = [];

			$(this).find(".new-supplier-remark").each(function () {
				new_supplier.remarks.push($(this).val());
			});

			new_suppliers.push(new_supplier);
		});

		// Hide "Add Supplier" button & add ajax ui to "Save" button
		$("#add-more-suppliers").hide();
		$("#save-new-suppliers").css('opacity', '0.5').text('Saving ..').attr('data-in-progress', '1');
		
		// Make an ajax call
		Backbone.ajax({
			type: 'POST',
			url: 'controller.php',
			data: { command: 'AddSuppliers', supplier_category_id: $("#all-suppliers-table").attr('data-category-id'), new_suppliers: new_suppliers },
			dataType: 'json',
			success: function (response) {
				// Show "Add Supplier" button and remove ajax ui from "Save"
				$("#add-more-suppliers").show();
				$("#save-new-suppliers").css('opacity', '1').text('Save').attr('data-in-progress', '0');

				// On no error
				if(response.error == 0) {
					// Hide the "Save" button
					$("#save-new-suppliers").hide();	

					// Remove new supplier containers
					$(".new-supplier-container").remove();
					
					// Start writing html
					var html = ''; 
					
					// For each suppliers returned in the response 
					for(var i=0; i<response.data.suppliers.length; i++) {
						html += '<tr class="supplier-row" id="supplier-' + response.data.suppliers[i]['supplier_id'] + '" data-supplier-id="' + response.data.suppliers[i]['supplier_id'] + '">' + 
										'<td class="supplier-header-name">'+ response.data.suppliers[i]['supplier_name'] + '</td>' + 
										'<td class="supplier-header-edit">' + 
											'<div class="supplier-header-edit-buttons">' + 
												'<span class="supplier-delete-button"><i class="fa fa-trash-o fa-lg" title="Delete Supplier"></i></span>' + 
												'<span class="supplier-items-button"><i class="fa fa-leaf fa-lg" title="Show Supplier Items"></i></span>' + 
												'<span class="supplier-info-button"><i class="fa fa-info fa-lg" title="Show Supplier Information"></i></span>' + 
											'</div>' + 
											'<img style="display:none" class="supplier-local-loader" src="img/486.gif" />' + 
											'<div class="supplier-confirm-delete">' + 
												'<div class="supplier-confirm-delete-header">Delete Supplier ?</div>' + 
												'<div class="supplier-confirm-delete-controls">' + 
													'<div class="supplier-confirm-delete-yes">Yes</div>' + 
													'<div class="supplier-confirm-delete-no">No</div>' + 
												'</div>' + 
											'</div>' + 
										'</td>' + 
									'</tr>';	
					}
					
					// If there were no previous suppliers show the table and hide the "No suppliers" message
					if($(".supplier-row").length == 0) {
						$("#all-suppliers-table").show();
						$("#no-suppliers").hide();	
					}

					// Append the html to the suppliers table
					$("#all-suppliers-table").append(html);
				}
			}
		});
	},
	
	/** 
	Click event on "Supplier Info" button
	Get the supplier info and show the view
	*/ 
	supplierInfo: function (e) {
		// Hide buttons & supplier delete confirmation; Show loader
		var parent_row = $(e.currentTarget).closest('.supplier-row');
		parent_row.find('.supplier-header-edit-buttons, .supplier-confirm-delete').hide();
		parent_row.find('.supplier-local-loader').show();

		// Make an ajax
		Backbone.ajax({
			type: 'GET',
			url: 'controller.php',
			data: { command: 'GetSupplierInfo', supplier_id: parent_row.attr('data-supplier-id') },
			dataType: 'json',
			success: function (response) {
				// Show buttons; hide loader
				parent_row.find('.supplier-header-edit-buttons').show();
				parent_row.find('.supplier-local-loader').hide();
				
				// On no error
				if(response.error == 0) {
					// Offset.left of the parent row [ supplier row ] + width of the supplier buttons td + 20  
					var offset = parent_row.find('.supplier-header-edit').offset();  
					offset.left = offset.left + $('.supplier-header-edit').outerWidth() + 20;
					
					// Remove Supplier Info container & Supplier Info View
					$("#supplier-info-container").remove();
					if(typeof supplier_info_view != 'undefined') {
						supplier_info_view.undelegateEvents();
					}
					
					// Remove Supplier Items container & Supplier Items View
					$("#supplier-all-items").remove();
					if(typeof supplier_items_view != 'undefined') {
						supplier_items_view.undelegateEvents();
					}

					// Render the Supplier Info View
					supplier_info_view = new SupplierInfoView({ 
																	supplier: response.data,               // Supplier Info
																	offset: offset                         // Offset to display the Supplier Info container
																});
					supplier_info_view.render(); 
				}
			}
		});
	},
	
	/** 
	Click event on "Supplier Items" button
	Get the supplier items and show the view
	*/ 
	supplierItems: function(e) {
		// Hide buttons & supplier delete confirmation; Show loader
		var parent_row = $(e.currentTarget).closest('.supplier-row');
		parent_row.find('.supplier-header-edit-buttons, .supplier-confirm-delete').hide();
		parent_row.find('.supplier-local-loader').show();

		// Make an ajax
		Backbone.ajax({
			type: 'GET',
			url: 'controller.php',
			data: { command: 'GetSupplierItems', supplier_id: parent_row.attr('data-supplier-id'), update_items: UPDATE_ITEMS },
			dataType: 'json',
			success: function (response) {
				// Show buttons; hide loader
				parent_row.find('.supplier-header-edit-buttons').show();
				parent_row.find('.supplier-local-loader').hide();
				
				// On no error
				if(response.error == 0) {
					if(response.data.items) {
						ITEMS = response.data.items;
						UPDATE_ITEMS = 0;
					}

					// Offset.left of the parent row [ supplier row ] + width of the supplier buttons td + 20  
					var offset = parent_row.find('.supplier-header-edit').offset();  
					offset.left = offset.left + $('.supplier-header-edit').outerWidth() + 20;
					
					// Remove Supplier Info container & Supplier Info View
					$("#supplier-all-items").remove();
					if(typeof supplier_items_view != 'undefined') {
						supplier_items_view.undelegateEvents();
					}

					// Remove Supplier Items container & Supplier Items View
					$("#supplier-info-container").remove();
					if(typeof supplier_info_view != 'undefined') {
						supplier_info_view.undelegateEvents();
					}

					// Render the Supplier Items View
					supplier_items_view = new SupplierItemsView({ 
																	supplier_items: response.data.supplier_items,                 // Supplier Items
																	supplier_id: parent_row.attr('data-supplier-id'),             // Supplier Id
																	offset: offset                                                // Offset to display the Supplier Items container
																});
					supplier_items_view.render(); 
				}
			}
		});
	}
});



/** 
View Id : new-supplier-view 
Show the new supplier container
*/
var NewSupplierView = Backbone.View.extend({
	el: '#add-save-more-suppliers',
	render: function () {
		var template = _.template(
								$("#new-supplier-view").html(), {}
								);
		
		// Render this before the "Add Supplier" button
		$(template).insertBefore(this.$el);
		
		// Set the width to the width of the suppliers table
		$(".new-supplier-container").outerWidth($("#all-suppliers-table").width());
	}
});



/** 
View Id : supplier-items-view 
Show the supplier's items
*/
var SupplierItemsView = Backbone.View.extend({
	el: '#contents',
	render: function () {
		var template = _.template(
								$("#supplier-items-view").html(), { 
									supplier_items: this.options['supplier_items'],              
									supplier_id:  this.options['supplier_id']
								});
		this.$el.append(template);
		
		// Set offset of the supplier items table, Add & Save Supplier Item, Close Supplier Items & Save New Prices accordingly
		$("#supplier-all-items").css({ left: this.options['offset'].left, top: this.options['offset'].top });
		$("#add-save-more-supplier-items").css('left', ($('#supplier-items-table-container').position().left-1) + 'px');
		$("#close-supplier-items").css('margin-right', ($('#supplier-items-table-container').position().left-1) + 'px');
		$("#save-supplier-items-prices").css({ 'left': (this.options['offset'].left + 30 + (120 + 120 + 70 + 80 + 100) + 30 + 30) + 'px', top: this.options['offset'].top });
	},
	events: {
		'keyup .supplier-item-row .supplier-items-header-price input[type="text"]': 'editPrices',                  // Keyup event on existing item's price textbox
		'click #save-supplier-items-prices': 'savePrices',                                                         // Click event on "Save New Prices" button
		'click .supplier-item-row-delete': 'deleteItem',                                                           // Click event on "Delete Item" button
		'click .supplier-item-confirm-delete-no': 'cancelDelete',                                                  // Click event on "Cancel Item Deletion" button
		'click .supplier-item-confirm-delete-yes': 'proceedDelete',                                                // Click event on "Proceed Item Deletion" button
		'click #add-more-supplier-items': 'addItem',                                                               // Click event on "Add Item" button
		'click #save-new-supplier-items': 'saveNewItems',                                                          // Click event on "Save New Items" button
		'click .supplier-new-item-delete': 'deleteNewItem',                                                        // Click event on "Delete New Item" button
		'keyup .supplier-new-item-row .supplier-items-header-name input[type="text"]': 'showSuggestions',          // Keyup event on "New Item Name" textbox
		'click .item-suggestion': 'chooseSuggestion',                                                              // Click event on "Choose a suggested item" button
		'click #close-supplier-items': 'closeSupplierItems'                                                        // Click event on "Close Supplier Items" button
	},
	
	/** 
	Keyup event on existing item's price textbox
	Editing an item's price will show the "Edit Prices" button
	*/ 
	editPrices: function (e) {
		if($(e.currentTarget).val() != $(e.currentTarget).attr('defaultValue')) {
			$(e.currentTarget).addClass('supplier-item-edited-price');
		}
		else {
			$(e.currentTarget).removeClass('supplier-item-edited-price');	
		}

		if($(".supplier-item-edited-price").length == 0) {
			$("#save-supplier-items-prices").hide();
		}
		else {
			$("#save-supplier-items-prices").show();
		}
	},

	/** 
	Click event on "Save New Prices" button
	Save new prices of the items
	*/ 
	savePrices: function (e) {
		if($("#save-supplier-items-prices").attr('data-in-progress') == '1') {
			return;
		}

		$(".supplier-item-parameter-error").hide();

		var float_reg_exp = /^([\d]+(\.\d{1,2}){0,1}){1}$/,                                   // check for floats
			error = 0,                                                                        // error flag
			edited_items = [];                                                                // temp var that holds edited items

		$(".supplier-item-edited-price").each(function () {
			if(!float_reg_exp.test($(this).val())) {
				$(this).next().show();
				error = 1;
			}
		});

		if(error == 1) {
			return;
		}

		$(".supplier-item-edited-price").each(function () {
			var next_td = $(this).closest('td').next();

			edited_items.push({ item_id: next_td.attr('data-item-id'), item_variety_id: next_td.attr('data-item-variety-id'), unit_id: next_td.attr('data-unit-id'), item_price: $(this).val() });
		});

		$("#save-supplier-items-prices").text('Saving ..').css('opacity', '0.5').attr('data-in-progress', '1');
		Backbone.ajax({
			type: 'POST',
			url: 'controller.php',
			data: { command: 'EditSupplierItems', items: edited_items, supplier_id: $("#supplier-items-table").attr('data-supplier-id') },
			dataType: 'json',
			success: function (response) {
				$("#save-supplier-items-prices").text('Save New Prices').css('opacity', '1').attr('data-in-progress', '0').hide();

				if(response.error == 0) {
					for(var i=0; i<response.data.length; i++) {
						var parent_row = $("#supplier-item-" + response.data[i]['item_id'] + '-' + response.data[i]['item_variety_id'] + '-' + response.data[i]['unit_id']).closest('tr');

						parent_row.find(".supplier-items-header-price input[type='text']").val(response.data[i]['item_price']).attr('defaultValue', response.data[i]['item_price']);
					}
				}
			}
		});
	},
	
	/** 
	Click event on "Delete Item" button
	Show the Item Delete Confirmation for the Item
	*/ 
	deleteItem: function (e) {
		var parent_td = $(e.currentTarget).closest('.supplier-items-header-edit');
		parent_td.find('.supplier-item-confirm-delete').show();
	},
	
	/** 
	Click event on "Cancel Item Deletion" button
	Cancel the item deletion
	*/ 
	cancelDelete: function (e) {
		$(e.currentTarget).closest('.supplier-item-confirm-delete').hide();
	},
	
	/** 
	Click event on "Proceed with Item Deletion" button
	Delete the supplier's existing item
	*/ 
	proceedDelete: function (e) {
		var parent_row = $(e.currentTarget).closest('.supplier-item-row');
		var parent_td = $(e.currentTarget).closest('.supplier-items-header-edit');

		// Hide the item edit controls & item deletion confirmation container; Show the loader
		parent_td.find('.supplier-item-edit-controls').hide();
		parent_td.find('.supplier-item-confirm-delete').hide();
		parent_td.find('.supplier-item-local-loader').show();
		
		// Make an ajax
		Backbone.ajax({
			type: 'POST',
			url: 'controller.php',
			data: { command: 'DeleteSupplierItem', supplier_id: $("#supplier-items-table").attr('data-supplier-id'), item_id: parent_td.attr('data-item-id'), item_variety_id: parent_td.attr('data-item-variety-id'), unit_id: parent_td.attr('data-unit-id') },
			dataType: 'json',
			success: function (response) {
				// Show the item edit controls; Hide the loader
				parent_td.find('.supplier-item-edit-controls').show();
				parent_td.find('.supplier-item-local-loader').hide();
				
				// On no error set the value of textboxes to blank; Set items header edit td to message "DELETED"
				if(response.error == 0) {
					parent_row.find(".supplier-items-header-price, .supplier-items-header-max-qty, .supplier-items-header-min-qty").html('');
					parent_row.find(".supplier-items-header-edit").html('DELETED');
				}
			}
		});
	},
	
	/** 
	Click event on "Add Item" button
	Show the Add New Item container 
	*/ 
	addItem: function () {
		// If there are no previous supplier's items then show the table and hide the message "No Items"
		if($(".supplier-item-row").length == 0) {
			$("#no-supplier-items").hide();
			$("#supplier-items-table").show();
		}

		// Render the New Item View
		supplier_new_item_view = new SupplierNewItemView();
		supplier_new_item_view.render();

		// Show the Save New Items button
		$("#save-new-supplier-items").show();
	},
	
	/** 
	Click event on "Delete New Item" button
	Delete the New Item container 
	*/ 
	deleteNewItem : function (e) {
		var parent_row = $(e.currentTarget).closest('tr');

		// If item suggestions was being shown in the row then hide the item suggestions container; Remove the row
		if(parent_row.attr('id') == $("#item-suggestions").attr('data-row-id')) {
			$("#item-suggestions").hide();
		}
		parent_row.remove();

		// If there are no more supplier's items then hide the table and show the message "No Items"
		if($(".supplier-item-row").length == 0) {
			$("#no-supplier-items").show();
			$("#supplier-items-table").hide();
		}

		// If there are no new items then hide the "Save New Items" button
		if($(".supplier-new-item-row").length == 0) {
			$("#save-new-supplier-items").hide();		
		}
	},
	saveNewItems: function (e) {
		var float_reg_exp = /^([\d]+(\.\d{1,2}){0,1}){1}$/,
			error = 0,
			new_item = {},
			new_items = [];

		$("#item-suggestions").hide();
		$("#supplier-items-table").find('.supplier-new-item-row .supplier-item-parameter-error').hide();

		$("#supplier-items-table").find('.supplier-new-item-row').each(function () {
			new_item = {};

			if($(this).find(".supplier-items-header-name input[type='text']").attr('data-valid') == '0') {
				$(this).find(".supplier-items-header-name .supplier-item-parameter-error").show();
				error = 1;
			}
			else {
				new_item.item_id = $(this).find(".supplier-items-header-name input[type='text']").attr('data-item-id'); 
				new_item.item_variety_id = $(this).find(".supplier-items-header-variety select").val(); 
				new_item.unit_id = $(this).find(".supplier-items-header-unit select").val(); 
				new_item.item_price = $(this).find(".supplier-items-header-price input[type='text']").val();
				new_items.push(new_item);
				
				if(!float_reg_exp.test($(this).find(".supplier-items-header-price input[type='text']").val())) {
					$(this).find(".supplier-items-header-price .supplier-item-parameter-error").show();
					error = 1;
				}
			}
		});

		if(error == 1) {
			return;
		}

		$("#add-more-supplier-items").hide();
		$("#save-new-supplier-items").css('opacity', '0.5').text('Saving ..').attr('data-in-progress', '1');
		Backbone.ajax({
			type: 'POST',
			url: 'controller.php',
			data: { command: 'AddSupplierItems', supplier_id: $("#supplier-items-table").attr('data-supplier-id'), new_items: new_items },
			dataType: 'json',
			success: function (response) {
				$("#add-more-supplier-items").show();
				$("#save-new-supplier-items").css('opacity', '1').text('Save Items').attr('data-in-progress', '0');;
				
				if(response.error == 0) {
					$("#save-new-supplier-items").hide();
					$('#supplier-items-table .supplier-new-item-row').remove();
					
					supplier_saved_items_view = new SupplierSavedItemsView({            
																	items: response.data       
																});
					supplier_saved_items_view.render();
				}
			}
		});
	},
	showSuggestions: function (e) { 
		var item_query = $(e.currentTarget).val().toLowerCase(),
			suggestions = [],
			html = '',
			blank_reg_exp = /^([\s]{0,}[^\s]{1,}[\s]{0,}){1,}$/,
			parent_row = $(e.currentTarget).closest('tr');

		$(e.currentTarget).attr('data-valid', '0');
		parent_row.find('.supplier-items-header-variety, .supplier-items-header-unit, .supplier-items-header-price, .supplier-items-header-max-qty, .supplier-items-header-min-qty').html(html);

		$("#item-suggestions").css({ left: parent_row.find(".supplier-items-header-variety").position().left + 1, top: parent_row.find(".supplier-items-header-variety").position().top + 1 });
		$("#item-suggestions").width(parent_row.find(".supplier-items-header-variety").outerWidth() + parent_row.find(".supplier-items-header-unit").outerWidth() + parent_row.find(".supplier-items-header-price").outerWidth() + parent_row.find(".supplier-items-header-max-qty").outerWidth() + parent_row.find(".supplier-items-header-min-qty").outerWidth() - 2);
		$("#item-suggestions").height(parent_row.find(".supplier-items-header-variety").outerHeight() - 2);

		if(!blank_reg_exp.test(item_query)) { 
			$("#item-suggestions").hide();
			return;
		}

		for(var i in ITEMS) {
			if(ITEMS[i]['item_name'].toLowerCase().indexOf(item_query) != -1) {
				suggestions.push({ name: ITEMS[i]['item_name'], id: i });
			}

			if(suggestions.length == 3) {
				break;
			}
		}

		if(suggestions.length == 0) {
			html += '<div id="suggestions-no-items">No such items</div>';
		}
		else { 
			for(var i=0; i<suggestions.length; i++) {
				html += '<div class="item-suggestion" data-item-id="' + suggestions[i]['id'] + '">' + suggestions[i]['name'] + '</div>';
			}
		}

		$("#item-suggestions").attr('data-row-id', parent_row.attr('id')).html(html).show();
	},
	chooseSuggestion: function (e) { 
		$("#item-suggestions").hide();

		var item_name = ITEMS[$(e.currentTarget).attr('data-item-id')]['item_name'],
			item_varieties = ITEMS[$(e.currentTarget).attr('data-item-id')]['item_varieties'],
			item_units = ITEMS[$(e.currentTarget).attr('data-item-id')]['item_units'],
			html = '';

		$("#" + $(e.currentTarget).parent().attr('data-row-id')).find('.supplier-items-header-name input[type="text"]').val(ITEMS[$(e.currentTarget).attr('data-item-id')]['item_name']).attr('data-valid', '1').attr('data-item-id', $(e.currentTarget).attr('data-item-id'));
		
		html = '<select>';
		for(var i in item_varieties) {
			if(item_varieties[i] == '') 
				html += '<option value="' + i + '" selected>[ NONE ]</option>';
			else
				html += '<option value="' + i + '">' + item_varieties[i] + '</option>';
		}
		html +='</select>';
		$("#" + $(e.currentTarget).parent().attr('data-row-id')).find('.supplier-items-header-variety').html(html);

		html = '<select>';
		for(var i in item_units) {
			html += '<option value="' + i + '">' + item_units[i] + '</option>';
		}
		html +='</select>';
		$("#" + $(e.currentTarget).parent().attr('data-row-id')).find('.supplier-items-header-unit').html(html); 

		html = '<input type="text" />';
		html += '<div class="supplier-item-parameter-error">Error</div>';
		$("#" + $(e.currentTarget).parent().attr('data-row-id')).find('.supplier-items-header-price, .supplier-items-header-max-qty, .supplier-items-header-min-qty').html(html);
	},
	closeSupplierItems: function () {
		$("#supplier-all-items").hide();
	}
});


var SupplierNewItemView = Backbone.View.extend({
	el: '#supplier-items-table',
	render: function () {
		var template = _.template(
								$("#supplier-new-item-view").html(), {
								temp_id: $("#add-more-supplier-items").attr('data-counter')
								});
		this.$el.append(template);
		$("#add-more-supplier-items").attr('data-counter', parseInt($("#add-more-supplier-items").attr('data-counter'), 10) + 1);
	}
});



var SupplierSavedItemsView = Backbone.View.extend({
	el: '#supplier-items-table',
	render: function () {
		var template = _.template(
								$("#supplier-saved-items-view").html(), {
									items: this.options['items']
								});
		this.$el.append(template);
	}
});



var SupplierInfoView = Backbone.View.extend({
	el: '#contents',
	render: function () {
		var template = _.template(
								$("#supplier-info-view").html(), { 
									supplier: this.options['supplier']
								});
		this.$el.append(template);
		$("#supplier-info-container").css({ left: this.options['offset'].left, top: this.options['offset'].top });
		$("#save-supplier-info").css('left', ($('#supplier-info-container').position().left-1) + 'px');
		$("#close-supplier-info").css('margin-right', ($('#supplier-info-container').position().left-1) + 'px');
	},
	events: {
		'click .supplier-info-add-remark': 'addRemark',                    
		'click .supplier-info-delete-remark': 'deleteRemark', 
		'click #save-supplier-info': 'saveSupplierInfo'
	},
	addRemark: function (e) {
		var html = '<div class="supplier-info-remark-container supplier-info-new-remark">';
		html += '<textarea class="supplier-info-remark"></textarea>';
		html += '<div class="supplier-info-delete-remark"><i class="fa fa-trash-o fa-lg" title="Delete Remark"></i></div>';
		html += '</div>';

		$(html).insertBefore($(e.currentTarget));
	},
	deleteRemark: function(e) {
		if($(e.currentTarget).parent().hasClass('supplier-info-new-remark')) {
			$(e.currentTarget).parent().remove();	
		}
		else {
			$(e.currentTarget).parent().addClass('supplier-info-deleted-remark').hide();
		}
	},
	saveSupplierInfo: function(e) {
		if($("#save-supplier-info").attr('data-in-progress') == '1') {
			return;
		}

		var supplier_info = {},
			blank_reg_exp = /^([\s]{0,}[^\s]{1,}[\s]{0,}){1,}$/,
			error = 0,
			change = 0;
		supplier_info.supplier_id = $("#supplier-info-container").attr('data-supplier-id');

		$("#supplier-info-error").hide();
		$("#supplier-info").find("input[type='text'], textarea").removeClass('supplier-info-wrong-parameter');

		if(!blank_reg_exp.test($(".supplier-info-name").val())) {
			$(".supplier-info-name").addClass('supplier-info-wrong-parameter');
			error = 1;
		}

		$(".supplier-info-remark").each(function () {
			if(!blank_reg_exp.test($(this).val())) {
				$(this).addClass('supplier-info-wrong-parameter');
				error = 1;
			}
		});

		if(error == 1) {
			$("#supplier-info-error").show();
			return;
		}

		if($(".supplier-info-name").val() != $(".supplier-info-name").attr('defaultValue')) {
			supplier_info.name = $(".supplier-info-name").val();
			change = 1;
		}
		if($(".supplier-info-phone").val() != $(".supplier-info-phone").attr('defaultValue')) {
			supplier_info.phone = $(".supplier-info-phone").val();
			change = 1;
		}
		if($(".supplier-info-address").val() != $(".supplier-info-address").attr('defaultValue')) {
			supplier_info.address = $(".supplier-info-address").val();
			change = 1;
		}
		supplier_info.added_remarks = [];
		supplier_info.deleted_remarks = [];

		$(".supplier-info-new-remark").each(function () {
			supplier_info.added_remarks.push($(this).find('textarea').val());
			change = 1;
		});

		$(".supplier-info-deleted-remark").each(function () {
			supplier_info.deleted_remarks.push($(this).attr('data-remark-id'));
			change = 1;
		});

		if(change == 0) {
			return;
		}

		$("#save-supplier-info").css('opacity', '0.5').text('Saving ..').attr('data-in-progress', '1');
		Backbone.ajax({
			type: 'POST',
			url: 'controller.php',
			data: { command: 'EditSupplierInfo', supplier_info: supplier_info },
			dataType: 'json',
			success: function (response) {
				$("#save-supplier-info").css('opacity', '1').text('Save').attr('data-in-progress', '0');

				if(response.error == 0) {
					if('supplier_name' in response.data) {
						$("#supplier-" + response.data.supplier_id).find(".supplier-header-name").text(response.data['supplier_name']);

						$("#supplier-info-container").remove();
						if(typeof supplier_info_view != 'undefined') {
							supplier_info_view.undelegateEvents();
						}
					}
				}
			}
		});
	}
});