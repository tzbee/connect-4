function GameModel(dispatcher) {

	var Board = Backbone.Model.extend({
		defaults: {
			nbRows: 6,
			nbCols: 7
		},
		initialize: function() {
			this.initBoard(this.get('nbRows'), this.get('nbCols'));
		},
		initBoard: function(nbRows, nbCols) {
			var board = [];

			for (var row = 0; row < nbRows; row++) {
				board.push([]);
			}

			for (row = 0; row < board.length; row++) {
				for (var col = 0; col < nbCols; col++) {
					board[row].push(-1);
				}
			}

			this.set({
				board: board
			});
		},
		clear: function() {
			var board = this.get('board');
			for (var row = 0; row < board.length; row++) {
				for (var col = 0; col < board[row].length; col++) {
					board[row][col] = -1;
				}
			}
		},
		play: function(col, value) {
			var row = this.findHighestEmptyTile(col);
			if (row === -1) throw new Error('Cannot play at this position');
			this.get('board')[row][col] = value;
			return [row, col];
		},
		findHighestEmptyTile: function(col) {
			var board = this.get('board'),
				currentRow = -1;

			for (var row = 0; row < board.length; row++) {
				if (board[row][col] === -1) {
					currentRow = row;
				} else {
					break;
				}
			}

			return currentRow;
		},
		getLegalMoves: function() {
			var legalMoves = [];

			for (var col = 0; col < this.get('nbCols'); col++) {
				if (this.findHighestEmptyTile(col) !== -1) legalMoves.push(col);
			}

			return legalMoves;
		},
		isFullBoard: function() {
			for (var col = 0; col < this.get('nbCols'); col++) {
				if (this.findHighestEmptyTile(col) !== -1) return false;
			}
			return true;
		},
		isValidMove: function(col) {
			return this.get('board')[0][col] === -1;
		},
		checkWin: function(value) {
			var chain = 0,
				row, col, k, diagCol,

				board = this.get('board'),
				nbRows = this.get('nbRows'),
				nbCols = this.get('nbCols');

			// Check rows
			for (row = 0; row < board.length; row++) {
				for (col = 0; col < board[row].length; col++) {
					if (board[row][col] === value) {
						chain++;
					} else {
						chain = 0;
					}

					if (chain === 4) {
						return true;
					}
				}
				chain = 0;
			}

			// Check cols
			for (col = 0; col < board[0].length; col++) {
				for (row = 0; row < board.length; row++) {

					if (board[row][col] === value) {
						chain++;
					} else {
						chain = 0;
					}

					if (chain === 4) return true;

				}
				chain = 0;
			}

			// Check diag1
			for (row = 0; row < nbRows; row++) {

				k = 0;
				while (row + k < nbRows && k < nbCols) {

					if (board[row + k][k] === value) {
						chain++;
					} else {
						chain = 0;
					}

					if (chain === 4) return true;

					k++;
				}

				chain = 0;
			}


			// Check diag2
			for (row = 0; row < nbRows; row++) {

				k = 0;
				while (row - k >= 0 && k < nbCols) {

					if (board[row - k][k] === value) {
						chain++;
					} else {
						chain = 0;
					}

					if (chain === 4) return true;

					k++;
				}

				chain = 0;
			}

			// Check diag1
			for (row = 0; row < nbRows; row++) {

				k = 0;
				diagCol = nbCols - 1;

				while (row + k < nbRows && diagCol - k >= 0) {

					if (board[row + k][diagCol - k] === value) {
						chain++;
					} else {
						chain = 0;
					}

					if (chain === 4) return true;

					k++;
				}

				chain = 0;
			}


			// Check diag2
			for (row = 0; row < nbRows; row++) {

				k = 0;
				diagCol = nbCols - 1;

				while (row - k >= 0 && diagCol - k >= 0) {

					if (board[row - k][diagCol - k] === value) {
						chain++;
					} else {
						chain = 0;
					}

					if (chain === 4) return true;

					k++;
				}

				chain = 0;
			}

			return false;
		},
		getNbChains: function(value) {
			var chain = 0;
			var nbRows = this.get('nbRows');
			var nbCols = this.get('nbCols');
			var board = this.get('board');

			for (var row = 0; row < nbRows; row++) {
				for (var col = 0; col < nbCols; col++) {
					for (var k = 0; k < 4; k++) {

						if (row + k < nbRows) {
							if (board[row + k][col] !== -1) {
								if (board[row + k][col] === value) chain++;
								else if (board[row + k][col] !== value) chain--;
							}
						}

						if (col + k < nbCols) {
							if (board[row][col + k] !== -1) {
								if (board[row][col + k] === value) chain++;
								else if (board[row][col + k] !== value) chain--;
							}
						}

						if (col + k < nbCols && row + k < nbRows) {
							if (board[row + k][col + k] !== -1) {
								if (board[row + k][col + k] === value) chain++;
								else if (board[row + k][col + k] !== value) chain--;
							}
						}

						if (col - k >= 0 && row + k < nbRows) {
							if (board[row + k][col - k] !== -1) {
								if (board[row + k][col - k] === value) chain++;
								else if (board[row + k][col - k] !== value) chain--;
							}
						}
					}
				}
			}

			return chain;
		},
		getTile: function(row, col) {
			return this.get('board')[row][col];
		},
		hash: function() {
			var c;
			return this.get('board').reduce(function(hash, row) {
				hash += row.reduce(function(hash, n) {
					c = n === -1 ? 'x' : n;
					hash += c;
					return hash;
				}, '');
				return hash;
			}, '');
		}
	});

	var Game = Backbone.Model.extend({
		defaults: {
			turn: 0,
			players: [],
			board: new Board()
		},
		initialize: function() {
			this.listenTo(dispatcher, 'game:start', this.start);
			this.listenTo(dispatcher, 'game:restart', this.restart);
			this.listenTo(dispatcher, 'view:updated', this.onPlayed);
			this.listenTo(dispatcher, 'view:resized', function() {
				dispatcher.trigger('game:update', this.get('board'));
			}.bind(this));
			this.listenTo(dispatcher, 'tile:click', this.play);

			var players = this.get('players');

			players[0] = new HumanPlayer({
				BoardController: Board,
				index: 0
			});

			players[1] = new ExpertAIPlayer({
				BoardController: Board,
				index: 1
			});
		},
		currentPlayerPlays: function() {
			var currentPlayer = this.get('players')[this.get('turn')];

			if (currentPlayer.type === 'human') {
				dispatcher.trigger('game:enable');
			} else if (currentPlayer.type === 'ai') {
				dispatcher.trigger('game:disable');
				dispatcher.trigger('loading:start');

				currentPlayer.getNextMove(this.get('board'), function(nextMove) {
					dispatcher.trigger('loading:stop');
					this.play(nextMove);
				}.bind(this));
			}
		},
		nextPlayer: function() {
			this.set({
				turn: this.get('turn') === 0 ? 1 : 0
			});
		},
		play: function(col)  {
			var currentPlayer = this.get('players')[this.get('turn')];
			var index = currentPlayer.get('index');

			var board = this.get('board');
			var move;

			try {
				move = board.play(col, index);
			} catch (err) {
				return;
			}

			dispatcher.trigger('played', board, move[0], col, index);
		},
		onPlayed: function() {
			var currentPlayer = this.get('players')[this.get('turn')];
			var board = this.get('board');
			var index = currentPlayer.get('index');

			if (board.checkWin(index)) {
				dispatcher.trigger('win', index);
				dispatcher.trigger('game:disable');
			} else {
				this.nextPlayer();
				this.currentPlayerPlays();
			}
		},
		restart: function(firstPlayer) {
			this.get('board').clear();
			dispatcher.trigger('game:start', firstPlayer);
		},
		start: function(firstPlayer) {
			dispatcher.trigger('game:init', this.get('board'));

			this.set({
				turn: firstPlayer === 0 || firstPlayer === 1 ? firstPlayer : 0
			});

			this.currentPlayerPlays();
		}
	});

	this.game = new Game();
}