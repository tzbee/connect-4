var dispatcher = _.clone(Backbone.Events);

var game = new Game();

var player1 = new HumanPlayer({
	index: 0
});

var player2 = new ExpertAIPlayer({
	index: 1
});

var boardView = new BoardView({
	el: $('#gameCanvas')
});

var resultView = new ResultView({
	el: $('.sideBox')
});

var choiceView = new ChoiceView({
	el: $('.choiceBox')
});