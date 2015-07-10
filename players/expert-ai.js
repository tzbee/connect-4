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

var ExpertAIPlayer = Backbone.Model.extend({
	type: 'ai',
	cache: new AICache(),
	initialize: function()  {
		var BoardController = this.get('BoardController');
		this.set({
			boardController: new BoardController(),
			opponentIndex: this.get('index') === 0 ? 1 : 0
		});
	},
	getNextMove: function(boardController, cb) {
		var boardCopy = boardController.get('board').clone();
		this.cache.clear();

		setTimeout(function() {
			this.minimax(boardCopy, true, 6, -9000, 9000);
			var choice = this.get('choice');
			cb(choice);
		}.bind(this), 100);
	},
	minimax: function(board, maximize, depth, alpha, beta) {
		var aiToken = this.get('index');
		var opponentIndex = this.get('opponentIndex');
		var currentToken = maximize ? aiToken : opponentIndex;
		var boardController = this.get('boardController');
		var cache = this.cache;

		boardController.set({
			board: board
		});

		if (depth === 0 || boardController.checkWin(aiToken) || boardController.checkWin(opponentIndex) || boardController.isFullBoard()) {
			return this.evaluate(boardController, depth, currentToken);
		}

		var legalMoves = boardController.getLegalMoves(),
			legalMove, boardCopy, choice;

		var v, i, j, childNodeValue, hash;

		if (maximize) {
			v = -9000;

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

			for (j = 0; j < legalMoves.length; j++) {
				legalMove = legalMoves[j];

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