var GameRouter = Backbone.Router.extend({

	routes: {
		"": "start",
		":index": "start"
	},
	initialize: function() {
		this.dispatcher = _.clone(Backbone.Events);
		this.model = new GameModel(this.dispatcher);
		this.view = new GameView(this.dispatcher);
	}
});

var gameRouter = new GameRouter();

gameRouter.on('route:start', function(index) {
	gameRouter.dispatcher.trigger('game:restart', parseInt(index));
});

// Start Backbone history a necessary step for bookmarkable URL's
Backbone.history.start();