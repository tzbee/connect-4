var dispatcher = _.clone(Backbone.Events);

var model = new GameModel(dispatcher);
var view = new GameView(dispatcher);

dispatcher.trigger('game:start');