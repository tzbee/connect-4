var Game = Backbone.Model.extend({
	defaults: {
		turn: 0,
		board: new Board(),
		id: 0
	},
	initialize: function() {
		this.listenTo(dispatcher, 'game:start', this.start);
		this.listenTo(dispatcher, 'game:restart', this.restart);
		this.listenTo(dispatcher, 'view:updated', this.onPlayed);
		this.listenTo(dispatcher, 'play', this.play);
		this.listenTo(dispatcher, 'view:resized', function() {
			dispatcher.trigger('game:update', this.get('board'));
		}.bind(this));
	},
	nextPlayer: function() {
		this.set({
			turn: this.get('turn') === 0 ? 1 : 0
		});
	},
	onPlayed: function() {
		setTimeout(function()  {
			var board = this.get('board');
			var index = this.get('turn');

			if (board.checkWin(index)) {
				dispatcher.trigger('win', index);
				dispatcher.trigger('game:disable');
			} else {
				this.nextPlayer();
				dispatcher.trigger('turn:' + this.get('turn'), this);
			}
		}.bind(this), 0);
	},
	restart: function(firstPlayer) {
		this.get('board').clear();
		dispatcher.off('tile:click');

		this.set({
			id: this.get('id') + 1
		});

		dispatcher.trigger('loading:stop', firstPlayer);
		dispatcher.trigger('game:start', firstPlayer);
	},
	start: function(firstPlayer) {
		dispatcher.trigger('game:init', this.get('board'));

		this.set({
			turn: firstPlayer === 0 || firstPlayer === 1 ? firstPlayer : 0
		});

		dispatcher.trigger('turn:' + this.get('turn'), this);
	},
	play: function(col, player, gameId)  {
		setTimeout(function()  {
			var board = this.get('board');
			var index = player.get('index');

			// Check if col is playable
			if (!board.isValidMove(col)) return;

			// Check if it's current player turn
			if (index !== this.get('turn')) return;

			if (this.get('id') !== gameId) return;

			var move = board.play(col, index);

			dispatcher.trigger('played', board, move[0], col, index);
		}.bind(this), 0);
	}
});
