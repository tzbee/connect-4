function GameView(dispatcher) {

	var tokens = ['red', 'yellow'];

	var BoardView = Backbone.View.extend({
		enabled: false,
		tokens: tokens,
		initialize: function() {
			this.ctx = this.el.getContext('2d');
			this.bgColor = $('body').css('backgroundColor');

			window.requestAnimationFrame = window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				function(callback) {
					window.setTimeout(callback, 1000 / 60);
				};

			this.listenTo(dispatcher, 'played', function(board, row, col, value) {
				this.update(row, col, value, function() {
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

			window.onresize = function() {
				dispatcher.trigger('view:resized');
			};

			this.listenTo(dispatcher, 'game:update', function(board) {
				this.initBoard(board);
			}.bind(this));
		},
		initBoard: function(board) {
			var self = this;

			var $parent = this.$el.parent();

			this.width = $parent.width();
			this.height = this.width * 6 / 7;

			this.$el.attr('width', this.width);
			this.$el.attr('height', this.height);

			this.tileWidth = this.width / board.get('nbCols');
			this.tileHeight = this.height / board.get('nbRows');

			this.pieceRadius = this.tileWidth * 0.3;

			// Cache some drawings

			this.redPieceCanvas = this.renderOffScreen(this.pieceRadius * 2, this.pieceRadius * 2, function(ctx) {
				self.drawPiece(ctx, self.pieceRadius, '#DD2222');
			});

			this.yellowPieceCanvas = this.renderOffScreen(this.pieceRadius * 2, this.pieceRadius * 2, function(ctx) {
				self.drawPiece(ctx, self.pieceRadius, '#DDDD22');
			});

			this.maskCache = this.renderOffScreen(this.width, this.height, function(ctx) {
				self.renderMask(ctx, board, self.pieceRadius, '#222266');
			});

			this.render(board);

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
		render: function(board) {
			var ctx = this.ctx;
			var pieceRadius = this.pieceRadius;
			var tileSize = this.tileWidth;
			var row, col;
			var nbRows = board.get('nbRows');
			var nbCols = board.get('nbCols');

			ctx.fillStyle = this.bgColor;
			ctx.fillRect(0, 0, this.width, this.height);

			for (row = 0; row < nbRows; row++) {
				for (col = 0; col < nbCols; col++) {
					var piece = board.getTile(row, col);
					if (piece !== -1) {
						var token = this.tokens[piece];
						var pos = (tileSize - (pieceRadius * 2)) / 2;

						ctx.drawImage(token === 'red' ? this.redPieceCanvas : token === 'yellow' ? this.yellowPieceCanvas : null, col * tileSize + pos, row * tileSize + pos);
					}
				}
			}

			ctx.drawImage(this.maskCache, 0, 0);
		},
		renderMask: function(ctx, board, pieceRadius, color) {
			var nbCols = board.get('nbCols'),
				nbRows = board.get('nbRows'),
				tileSize = this.tileWidth,
				maskWidth = this.width,
				maskHeight = this.height,
				row, col,
				pos = (tileSize - (pieceRadius * 2)) / 2 + pieceRadius;

			ctx.save();

			ctx.fillStyle = color;
			ctx.beginPath();

			for (row = 0; row < nbRows; row++) {
				for (col = 0; col < nbCols; col++) {
					ctx.moveTo(col * tileSize + pos, row * tileSize + pos);
					ctx.arc(col * tileSize + pos, row * tileSize + pos, pieceRadius, 0, 2 * Math.PI);
				}
			}

			ctx.rect(maskWidth, 0, -maskWidth, maskHeight);
			ctx.fill();

			ctx.restore();
		},
		events: {
			'click': 'onTileClick'
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
		startAnimation: function(ctx, row, col, value, done) {
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
		update: function(row, col, value, done) {
			this.startAnimation(this.ctx, row, col, value, done);
		}
	});

	var ResultView = Backbone.View.extend({
		restartButtonClass: 'restart',
		resultBoxClass: 'result',
		loadingBoxClass: 'loading',
		tokens: tokens,
		initialize: function() {

			var $restartButton = $('<button>', {
				class: this.restartButtonClass,
				html: 'Restart'
			});

			var $resultBox = $('<span>', {
				class: this.resultBoxClass,
				css: {
					visibility: 'hidden'
				}
			});

			var $loadingBox = $('<span>', {
				class: this.loadingBoxClass,
				html: 'Loading..',
				css: {
					visibility: 'hidden'
				}
			});

			this.$el.html($restartButton.add($resultBox).add($loadingBox));

			this.listenTo(dispatcher, 'win', this.update);
			this.listenTo(dispatcher, 'loading:start', this.startLoading);
			this.listenTo(dispatcher, 'loading:stop', this.stopLoading);
		},
		update: function(winnerIndex) {
			var winner = this.tokens[winnerIndex];
			var $resultBox = $('.' + this.resultBoxClass);
			if (winner) {
				$resultBox.addClass(winner).html('Winner is ' + winner);
				this.show($resultBox);
			}
		},
		events: {
			'click .restart': 'restartGame'
		},
		restartGame: function() {
			dispatcher.trigger('game:restart');
			this.hide($('.' + this.resultBoxClass));
		},
		startLoading: function() {
			this.show($('.' + this.loadingBoxClass));
		},
		stopLoading: function() {
			this.hide($('.' + this.loadingBoxClass));
		},
		hide: function(element) {
			element.css('visibility', 'hidden');
		},
		show: function(element) {
			element.css('visibility', 'visible');
		}
	});

	var ChoiceView = Backbone.View.extend({
		initialize: function() {

		}
	});

	this.boardView = new BoardView({
		el: $('#gameCanvas')
	});

	this.choiceView = new ResultView({
		el: $('.sideBox')
	});
}