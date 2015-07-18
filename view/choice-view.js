var ChoiceView = Backbone.View.extend({
	initialize: function() {
		$('.choiceItem.humanFirst').css('color', colors.red);
		$('.choiceItem.computerFirst').css('color', colors.yellow);
	},
	events: {
		'click .humanFirst': 'humanStart',
		'click .computerFirst': 'computerStart'
	},
	humanStart: function() {
		dispatcher.trigger('game:restart', 0);
	},
	computerStart: function() {
		dispatcher.trigger('game:restart', 1);
	}
});