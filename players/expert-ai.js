Array.prototype.clone = function() {
	var arr = [],
		i;
	for (i = 0; i < this.length; i++) {
		arr[i] = this[i].slice();
	}
	return arr;
};

var AICache = function() {
	this.cache = {};

	this.add = function(hash, value) {
		this.cache[hash] = value;
	};

	this.get = function(hash) {
		var value = this.cache[hash];
		return value === null || value === undefined ? null : value;
	};

	this.clear = function() {
		this.cache = {};
	};
};

var ExpertAIPlayer = Player.extend({
	type: 'ai',
	depth: 8,
	initialize: function()  {
		Player.prototype.initialize.call(this);

		this.set({
			opponentIndex: this.get('index') === 0 ? 1 : 0,
			cache: new AICache(),
			boardController: new Board()
		});
	},
	onTurn: function(game) {
		dispatcher.trigger('loading:start');
		var gameId = game.get('id');
		this.getNextMove(game.get('board'), function(nextMove) {
			dispatcher.trigger('loading:stop');
			dispatcher.trigger('play', nextMove, this, gameId);
		}.bind(this));
	},
	getNextMove: function(boardController, cb) {
		var boardCopy = boardController.get('board').clone();
		this.get('cache').clear();

		setTimeout(function() {
			this.minimax(boardCopy, true, this.depth, -9000, 9000);
			var choice = this.get('choice');
			cb(choice);
		}.bind(this), 100);
	},
	minimax: function(board, maximize, depth, alpha, beta) {
		var aiToken = this.get('index'),
			opponentIndex = this.get('opponentIndex'),
			currentToken = maximize ? aiToken : opponentIndex,
			boardController = this.get('boardController'),
			cache = this.get('cache'),
			legalMoves, legalMove, legalMovesCopy, boardCopy, choice,
			v, i, childNodeValue, hash;

		boardController.set({
			board: board
		});

		if (depth === 0 || boardController.checkWin(aiToken) || boardController.checkWin(opponentIndex) || boardController.isFullBoard()) {
			return this.evaluate(boardController, depth, currentToken);
		}

		legalMoves = boardController.getLegalMoves();

		this.sortMoves(legalMoves);

		legalMovesCopy = legalMoves.slice();

		if (maximize) {
			v = -9000;

			for (i = 0; i < legalMovesCopy.length; i++) {
				legalMove = legalMovesCopy[i];

				boardCopy = board.clone();

				boardController.set({
					board: boardCopy
				});

				boardController.play(legalMove, currentToken);

				hash = boardController.hash();
				childNodeValue = cache.get(hash);

				if (childNodeValue !== null) {
					if (childNodeValue > v) {
						v = childNodeValue;
						choice = legalMove;
					}

					alpha = Math.max(alpha, v);

					if (beta <= alpha) {
						this.set({
							choice: choice
						});

						return v;
					}

					legalMoves.splice(legalMoves.indexOf(legalMove), 1);
				}
			}

			for (i = 0; i < legalMoves.length; i++) {
				legalMove = legalMoves[i];

				boardCopy = board.clone();

				boardController.set({
					board: boardCopy
				});

				boardController.play(legalMove, currentToken);

				hash = boardController.hash();
				childNodeValue = cache.get(hash);

				if (childNodeValue === null) {
					childNodeValue = this.minimax(boardCopy, !maximize, depth - 1, alpha, beta);
					cache.add(hash, childNodeValue);
				}

				if (childNodeValue > v) {
					v = childNodeValue;
					choice = legalMove;
				}

				alpha = Math.max(alpha, v);

				if (beta <= alpha) {
					break;
				}
			}

			this.set({
				choice: choice
			});

			return v;

		} else {
			v = 9000;

			for (i = 0; i < legalMovesCopy.length; i++) {
				legalMove = legalMovesCopy[i];

				boardCopy = board.clone();

				boardController.set({
					board: boardCopy
				});

				boardController.play(legalMove, currentToken);

				hash = boardController.hash();
				childNodeValue = cache.get(hash);

				if (childNodeValue !== null) {
					if (childNodeValue < v) {
						v = childNodeValue;
						choice = legalMove;
					}

					beta = Math.min(beta, v);

					if (beta <= alpha) {
						this.set({
							choice: choice
						});

						return v;
					}

					legalMoves.splice(legalMoves.indexOf(legalMove), 1);
				}
			}

			for (i = 0; i < legalMoves.length; i++) {
				legalMove = legalMoves[i];

				boardCopy = board.clone();

				boardController.set({
					board: boardCopy
				});

				boardController.play(legalMove, currentToken);

				hash = boardController.hash();
				childNodeValue = cache.get(hash);

				if (childNodeValue === null) {
					childNodeValue = this.minimax(boardCopy, !maximize, depth - 1, alpha, beta);
					cache.add(hash, childNodeValue);
				}

				if (childNodeValue < v) {
					v = childNodeValue;
					choice = legalMove;
				}

				beta = Math.min(beta, v);

				if (beta <= alpha) {
					break;
				}
			}

			this.set({
				choice: choice
			});

			return v;
		}
	},
	sortMoves: function(moves) {
		moves.sort(function(a, b) {
			if (a === 3) return -1;
			if (b === 3) return 1;

			if (a === 4 || a === 2) return -1;
			if (b === 4 || b === 2) return 1;

			if (a === 5 || a === 1) return -1;
			if (b === 5 || b === 1) return 1;

			else return -1;
		});
	},
	evaluate: function(board, depth, currentToken) {
		var aiToken = this.get('index'),
			opponentIndex = this.get('opponentIndex'),
			aiHasWon = board.checkWin(aiToken),
			opponentHasWon = board.checkWin(opponentIndex),
			depthModifier = currentToken === aiToken ? -depth : depth,
			chainModifier = board.getNbChains(aiToken);

		if (aiHasWon) return (1000 + depthModifier * 10 + (chainModifier * 3));
		else if (opponentHasWon) return (-1000 + depthModifier * 10 + (chainModifier * 3));
		else return (chainModifier * 3) + depthModifier;
	}
});