var GameRouter = Backbone.Router.extend({
	routes: {
		"": "start",
		":index": "start"
	}
});

var gameRouter = new GameRouter();

gameRouter.on('route:start', function(index) {
	dispatcher.trigger('game:start', parseInt(index));
});

Backbone.history.start();