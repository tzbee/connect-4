var HumanPlayer = Player.extend({
	onTurn: function(game) {
		dispatcher.trigger('game:enable');

		this.listenTo(dispatcher, 'tile:click', function(col) {
			dispatcher.trigger('play', col, this, game.get('id'));
			dispatcher.trigger('game:disable');
			this.stopListening(dispatcher, 'tile:click');
		}.bind(this));
	}
});