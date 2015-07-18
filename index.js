var dispatcher = _.clone(Backbone.Events);

// Instantiate model

var game = new Game();

// Instantiate players

var player1 = new HumanPlayer({
	index: 0
});

var player2 = new ExpertAIPlayer({
	index: 1
});

// Instantiate views

var boardView = new BoardView({
	el: $('#gameCanvas')
});

var resultView = new ResultView({
	el: $('.sideBox')
});

var choiceView = new ChoiceView({
	el: $('.choiceBox')
});