var ResultView = Backbone.View.extend({
	resultBoxClass: 'result',
	loadingBoxClass: 'loading',
	tokens: tokens,
	initialize: function() {
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

		this.$el.html($resultBox.add($loadingBox));

		this.listenTo(dispatcher, 'win', this.update);
		this.listenTo(dispatcher, 'loading:start', this.startLoading);
		this.listenTo(dispatcher, 'loading:stop', this.stopLoading);
		this.listenTo(dispatcher, 'game:restart', this.onRestart);
	},
	update: function(winnerIndex) {
		var winner = this.tokens[winnerIndex];
		var $resultBox = $('.' + this.resultBoxClass);
		if (winner) {
			$resultBox.addClass(winner).html('Winner is ' + winner);
			this.show($resultBox);
		}
	},
	onRestart: function() {
		$('.' + this.resultBoxClass).empty();
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