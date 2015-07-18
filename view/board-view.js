var BoardView = Backbone.View.extend({
	enabled: false,
	tokens: tokens,
	initialize: function() {
		this.ctx = this.el.getContext('2d');
		this.bgColor = $('body').css('backgroundColor');

		window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
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

		this.holeRadius = this.tileWidth * 0.3;
		this.pieceRadius = this.holeRadius + 1;

		// Cache some drawings

		this.redPieceCanvas = this.renderOffScreen(this.pieceRadius * 2, this.pieceRadius * 2, function(ctx) {
			self.drawPiece(ctx, self.pieceRadius, colors.red);
		});

		this.yellowPieceCanvas = this.renderOffScreen(this.pieceRadius * 2, this.pieceRadius * 2, function(ctx) {
			self.drawPiece(ctx, self.pieceRadius, colors.yellow);
		});

		this.maskCache = this.renderOffScreen(this.width, this.height, function(ctx) {
			self.renderMask(ctx, board, self.holeRadius, colors.maskBlue);
		});

		this.render(board);

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
	renderMask: function(ctx, board, holeRadius, color) {
		var nbCols = board.get('nbCols'),
			nbRows = board.get('nbRows'),
			tileSize = this.tileWidth,
			maskWidth = this.width,
			maskHeight = this.height,
			row, col,
			pos = (tileSize - (holeRadius * 2)) / 2 + holeRadius;

		ctx.save();

		ctx.fillStyle = color;
		ctx.beginPath();

		for (row = 0; row < nbRows; row++) {
			for (col = 0; col < nbCols; col++) {
				ctx.moveTo(col * tileSize + pos, row * tileSize + pos);
				ctx.arc(col * tileSize + pos, row * tileSize + pos, holeRadius, 0, 2 * Math.PI);
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
	getPieceBuffer: function(value) {
		return value === 0 ? this.redPieceCanvas : value === 1 ? this.yellowPieceCanvas : null;
	},
	startAnimation: function(ctx, board, row, col, value, done) {
		var tileSize = this.tileWidth,
			pieceRadius = this.pieceRadius,
			posOffset = (tileSize - (pieceRadius * 2)) / 2,
			x = col * tileSize + posOffset,
			destinationY = row * tileSize + posOffset,
			startingY = -2 * pieceRadius,
			image = value === 0 ? this.redPieceCanvas : this.yellowPieceCanvas,
			self = this,
			requestAnimationFrame = window.requestAnimationFrame,
			tmpCtx,
			nbRows = board.get('nbRows'),
			nbCols = board.get('nbCols'),
			lastTime,
			speed = this.width / 150,
			tokenCanvas = this.renderOffScreen(this.width, this.height, function(ctx) {
				for (var r = 0; r < nbRows; r++) {
					for (var c = 0; c < nbCols; c++) {
						if (row === r && col === c) continue;

						var piece = board.getTile(r, c);
						if (piece !== -1) {
							ctx.drawImage(self.getPieceBuffer(piece), tileSize * c + posOffset, tileSize * r + posOffset);
						}
					}
				}
			});

		lastTime = Date.now();
		(function animate(currentY, dt) {
			if (currentY > destinationY) currentY = destinationY;

			tmpCtx = self.canvasCache.getContext('2d');

			tmpCtx.fillStyle = self.bgColor;
			tmpCtx.fillRect(0, 0, self.width, self.height);
			tmpCtx.drawImage(tokenCanvas, 0, 0);
			tmpCtx.drawImage(image, x, currentY);
			tmpCtx.drawImage(self.maskCache, 0, 0);

			self.drawCanvas(self.canvasCache, self.el);

			if (currentY < destinationY) {
				requestAnimationFrame(function() {
					animate(currentY + speed * dt, Date.now() - lastTime);
					lastTime = Date.now();
				});
			} else {
				done();
			}
		})(startingY, 0);
	},
	drawCanvas: function(canvas, targetCanvas) {
		targetCanvas.getContext('2d').drawImage(canvas, 0, 0);
	},
	update: function(board, row, col, value, done) {
		this.startAnimation(this.ctx, board, row, col, value, done);
	}
});