function GameView(dispatcher) {

	var tokens = ['red', 'yellow'];

	var BoardView = Backbone.View.extend({
		enabled: false,
		tokens: tokens,
		initialize: function() {
			this.ctx = this.el.getContext('2d');
			this.bgColor = $('body').css('backgroundColor');
			this.width = this.el.width;
			this.height = this.el.height;

			window.requestAnimationFrame = window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				function(callback) {
					window.setTimeout(callback, 1000 / 60);
				};

			this.listenTo(dispatcher, 'played', function(board, row, col, value) {
				this.update(board, row, col, value, function() {
					dispatcher.trigger('view:updated');
				});
			}.bind(this));

			this.listenTo(dispatcher, 'game:init', this.initBoard);

			this.listenTo(dispatcher, 'game:enable', function() {
				this.enabled = true;
			}.bind(this));

			this.listenTo(dispatcher, 'game:disable', function() {
				this.enabled = false;
			}.bind(this));
		},
		initBoard: function(board) {
			var self = this;

			this.tileWidth = this.width / board.get('nbCols');
			this.tileHeight = this.height / board.get('nbRows');

			this.pieceRadius = this.tileWidth * 0.3;

			// Cache some drawings

			this.tileCanvas = this.renderOffScreen(this.tileWidth, this.tileHeight, function(ctx) {
				self.drawTile(ctx, self.tileWidth, self.pieceRadius, '#222266');
			});

			this.redPieceCanvas = this.renderOffScreen(this.pieceRadius * 2, this.pieceRadius * 2, function(ctx) {
				self.drawPiece(ctx, self.pieceRadius, '#DD2222');
			});

			this.yellowPieceCanvas = this.renderOffScreen(this.pieceRadius * 2, this.pieceRadius * 2, function(ctx) {
				self.drawPiece(ctx, self.pieceRadius, '#DDDD22');
			});

			this.maskCache = this.renderOffScreen(this.width, this.height, function(ctx) {
				self.renderMask(ctx, board);
			});

			this.render();

			this.previousViewState = this.renderOffScreen(this.width, this.height, function(ctx) {
				ctx.drawImage(self.el, 0, 0);
			});

			// Temporary canvas cache
			this.canvasCache = this.renderOffScreen(this.width, this.height);
		},
		renderOffScreen: function(width, height, renderer) {
			var offScreenCanvas = document.createElement('canvas');
			offScreenCanvas.width = width;
			offScreenCanvas.height = height;
			if (renderer) renderer(offScreenCanvas.getContext('2d'));
			return offScreenCanvas;
		},
		render: function() {
			var ctx = this.ctx;

			// Clear canvas
			ctx.clearRect(0, 0, this.width, this.height);
			ctx.drawImage(this.maskCache, 0, 0);
		},
		renderMask: function(ctx, board) {
			var nbCols = board.get('nbCols');
			var nbRows = board.get('nbRows');
			var tileSize = this.tileWidth;
			var tileImage = this.tileCanvas;
			var row, col;

			for (row = 0; row < nbRows; row++) {
				for (col = 0; col < nbCols; col++) {
					ctx.drawImage(tileImage, col * tileSize, row * tileSize);
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
		},
		startAnimation: function(ctx, board, row, col, value, done) {
			var tileSize = this.tileWidth;
			var pieceRadius = this.pieceRadius;
			var posOffset = (tileSize - (pieceRadius * 2)) / 2;
			var x = col * tileSize + posOffset;
			var destinationY = row * tileSize + posOffset;
			var startingY = -2 * pieceRadius;
			var image = value === 0 ? this.redPieceCanvas : this.yellowPieceCanvas;
			var self = this;
			var requestAnimationFrame = window.requestAnimationFrame;
			var tmpCtx;

			(function animate(currentY) {

				if (currentY > destinationY) currentY = destinationY;

				tmpCtx = self.canvasCache.getContext('2d');

				tmpCtx.fillStyle = self.bgColor;
				tmpCtx.fillRect(0, 0, self.width, self.height);
				tmpCtx.drawImage(self.previousViewState, 0, 0);
				tmpCtx.drawImage(image, x, currentY);
				tmpCtx.drawImage(self.maskCache, 0, 0);

				self.drawCanvas(self.canvasCache, self.el);

				if (currentY < destinationY) {
					requestAnimationFrame(function() {
						animate(currentY + 35);
					});
				} else {
					self.drawCanvas(self.el, self.previousViewState);
					done();
				}
			})(startingY);
		},
		drawCanvas: function(canvas, targetCanvas) {
			targetCanvas.getContext('2d').drawImage(canvas, 0, 0);
		},
		update: function(board, row, col, value, done) {
			this.startAnimation(this.ctx, board, row, col, value, done);
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