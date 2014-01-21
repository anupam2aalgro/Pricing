/**
View Id : index-view 
Show the index page with the 3 main tabs
*/
var IndexView = Backbone.View.extend({
	el: '#app-contents',
	render: function () {
		var template = _.template($("#index-view").html());
		this.$el.html(template);
	}
});


var index_view = new IndexView();

var Router = Backbone.Router.extend({
	routes: {
		'': 'index',
		'items': 'items',
		'items/:query': 'itemsFromCategory',
		'suppliers': 'suppliers',
		'suppliers/:query': 'suppliersFromCategory',
		'pricing': 'pricing'
	},
	index: function () {
		index_view.render();
	},
	items: function () {
		this.index();

		items_view = new ItemsView();
		items_view.render();
	},
	itemsFromCategory: function (query) {
		this.items();

		var category_id;
		switch(query) {
			case 'leafy':
				category_id = 101;
				break;

			case 'fruits':
				category_id = 102;
				break;

			case 'exotic':
				category_id = 103;
				break;

			case 'opg':
				category_id = 104;
				break;

			case 'vegetables':
				category_id = 105;
		}
		
		items_loader_view = new ItemsLoaderView({ category_name: query, category_id: category_id });
		items_loader_view.render();
	},
	suppliers: function () {
		this.index();

		suppliers_view = new SuppliersView();
		suppliers_view.render();
	},
	suppliersFromCategory: function (query) { 
		this.suppliers();

		var category_id;
		switch(query) {
			case 'vendor':
				category_id = 101;
				break;

			case 'retail':
				category_id = 102;
				break;

			case 'mandi':
				category_id = 103;
		}
		
		suppliers_loader_view = new SuppliersLoaderView({ category_name: query, category_id: category_id });
		suppliers_loader_view.render();
	},
	pricing: function () {
		this.index();

		pricing_loader_view = new PricingLoaderView();
		pricing_loader_view.render();
	}
});

var router = new Router();

Backbone.history.start();