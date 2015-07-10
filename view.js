function GameView(dispatcher) {

	var tokens = ['red', 'yellow'];

	var BoardView = Backbone.View.extend({
		enabled: false,
		tokens: tokens,
		initialize: function() {
			this.ctx = this.el.getContext('2d');
			this.width = this.el.width;
			this.height = this.el.height;
			this.listenTo(dispatcher, 'played', this.render);

			this.listenTo(dispatcher, 'game:init', this.initBoard);

			this.listenTo(dispatcher, 'game:enable', function() {
				this.enabled = true;
			}.bind(this));

			this.listenTo(dispatcher, 'game:disable', function() {
				this.enabled = false;
			}.bind(this));
		},
		initBoard: function(board) {
			this.tileWidth = this.width / board.get('nbCols');
			this.tileHeight = this.height / board.get('nbRows');

			this.pieceRadius = this.tileWidth * 0.3;

			// Cache some drawings

			this.tileCanvas = this.renderOffScreen(this.tileWidth, this.tileHeight, function(ctx) {
				this.drawTile(ctx, this.tileWidth, this.pieceRadius, '#222266');
			}.bind(this));

			this.redPieceCanvas = this.renderOffScreen(this.pieceRadius * 2, this.pieceRadius * 2, function(ctx) {
				this.drawPiece(ctx, this.pieceRadius, '#DD2222');
			}.bind(this));

			this.yellowPieceCanvas = this.renderOffScreen(this.pieceRadius * 2, this.pieceRadius * 2, function(ctx) {
				this.drawPiece(ctx, this.pieceRadius, '#DDDD22');
			}.bind(this));

			this.render(board);
		},
		renderOffScreen: function(width, height, renderer) {
			var offScreenCanvas = document.createElement('canvas');
			offScreenCanvas.width = width;
			offScreenCanvas.height = height;
			renderer(offScreenCanvas.getContext('2d'));
			return offScreenCanvas;
		},
		render: function(board) {
			var ctx = this.ctx;
			var nbCols = board.get('nbCols');
			var nbRows = board.get('nbRows');
			var tileSize = this.tileWidth;
			var pieceRadius = this.pieceRadius;
			var posOffset = (tileSize - (pieceRadius * 2)) / 2;
			var row, col, buffer, value;

			// Clear canvas
			ctx.clearRect(0, 0, this.width, this.height);

			for (row = 0; row < nbRows; row++) {
				for (col = 0; col < nbCols; col++) {
					ctx.drawImage(this.tileCanvas, col * tileSize, row * tileSize);
				}
			}

			for (row = 0; row < nbRows; row++) {
				for (col = 0; col < nbCols; col++) {
					value = board.getTile(row, col);

					if (value !== -1) {
						buffer = value === 0 ? this.redPieceCanvas : this.yellowPieceCanvas;
						ctx.drawImage(buffer, col * tileSize + posOffset, row * tileSize + posOffset);
					}
				}
			}
		},
		events: {
			'click': 'onTileClick'
		},
		drawTile: function(ctx, size, pieceRadius, color) {
			ctx.save();

			var pos = (size - (pieceRadius * 2)) / 2 + pieceRadius;

			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(pos, pos, pieceRadius, 0, 2 * Math.PI);
			ctx.rect(size, 0, -size, size);
			ctx.fill();

			ctx.restore();
		},
		drawPiece: function(ctx, radius, color) {
			ctx.save();

			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
			ctx.fill();

			ctx.restore();
		},
		onTileClick: function(e) {
			if (!this.enabled) return;

			var x = this.getMousePos(this.el, e)[0];
			var col = Math.floor(x / this.tileWidth);

			dispatcher.trigger('tile:click', col);
		},
		getMousePos: function(canvas, e) {
			var rect = canvas.getBoundingClientRect();

			var x = e.clientX - rect.left;
			var y = e.clientY - rect.top;

			return [x, y];
		}
	});

	var ResultView = Backbone.View.extend({
		tokens: tokens,
		 
		$restartButton: $('<button>', {
			class: 'restart',
			html: 'Restart'
		}),
		initialize: function() {
			this.listenTo(dispatcher, 'win', this.update);
			this.$el.html(this.$restartButton);
		},
		update: function(winnerIndex) {
			var $restartButton = this.$restartButton;

			if (winnerIndex === -1) {
				this.$el.html($restartButton);
			} else {
				var winner = this.tokens[winnerIndex];
				var $winner = $('<span>', {
					class: 'result ' + winner,
					html: 'Winner is ' + winner
				});

				this.$el.html($winner).append($restartButton);
			}
		},
		events: {
			'click .restart': 'restartGame'
		},
		restartGame: function() {
			dispatcher.trigger('game:restart');
			this.update(-1);
		}
	});

	this.boardView = new BoardView({
		el: $('#gameCanvas')
	});

	this.resultView = new ResultView({
		el: $('.result')
	});
}