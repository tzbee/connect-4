var Player = Backbone.Model.extend({
	initialize: function() {
		this.listenTo(dispatcher, 'turn:' + this.get('index'), this.onTurn);
	}
});