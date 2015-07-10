var RandomAIPlayer = Backbone.Model.extend({
	type: 'ai',
	getNextMove: function(board, cb)  {
		cb(this.getRandomLegalMove(board));
	},
	getRandomLegalMove: function(board) {
		var legalMoves = board.getLegalMoves();
		return legalMoves[this.getRandomElement(legalMoves.length - 1)];
	},
	getRandomElement: function(n) {
		var res = Math.floor(Math.random() * n + 1);

		while (res === n + 1) {
			res = Math.floor(Math.random() * n + 1);
		}

		return res;
	}
});