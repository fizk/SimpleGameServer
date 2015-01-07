var express = require('express');
var ObjectId = require('mongodb').ObjectID;
var router = express.Router();

/**
 * Middleware function to check if the game has ended.
 * If the game has ended, the send a <code>400</code>
 * code back with error message.
 *
 * @param {Object} request
 * @param {Object} response
 * @param {Function} next
 */
var middlewareGameEnded = function(request, response, next){
	if(request.game.ended){
		response.status(400).json({
			error: 'This game has ended'
		});
	}else{
		next();
	}
};

/**
 * Middleware function to find game in storage.
 *
 * If the game is found, then <code>next()</code> is
 * called, else a <code>500</code> or <code>404</code>
 * status code is returned with some error message.
 *
 * @param {Object} request
 * @param {Object} response
 * @param {Function} next
 */
var middlewareFindGame = function(request, response, next){
	var collections = request.db.collection('memory');
	collections.findOne({"_id": new ObjectId(request.params.id)}, function(error, data) {
		if (error) {
			response.status(500).json({
				error: error.message
			});
		} else {
			if (data) {
				data.id = data._id.toString();
				//delete data._id;
				request.game = data;
				next();
			} else {
				response.status(404).json({
					error: 'Game not found'
				});
			}

		}
	})
};

/**
 * Validate creation form
 *
 * @param {Object} request
 * @param {Object} response
 * @param {Function} next
 */
var middlewareValidateForm = function(request, response, next){
	if( request.body.name==undefined || request.body.email==undefined ){
		response.status(400).json({
			error: 'This request requires <name> and <email> parameters'
		});
	}else{
		next();
	}

};

/**
 * Validate creation form
 *
 * @param {Object} request
 * @param {Object} response
 * @param {Function} next
 */
var middlewareValidateEnd = function(request, response, next){
	if( request.body.x1==undefined ||
		request.body.x2==undefined ||
		request.body.y1==undefined ||
		request.body.y2==undefined
	){
		response.status(400).json({
			error: 'This request requires <x1>, <y1>, <x2> and <y2> parameters'
		});
	}else{
		next();
	}

};

/**
 * Get the HTML game description
 *
 * This is the lading page for the game. It should
 * describe the REST server, it's URLs and response.
 *
 * @param {Object} request
 * @param {Object} response
 */
router.get('/', function(request, response) {
	response.setHeader('Access-Control-Allow-Origin', '*');
	response.render('memory/index', { title: 'Memory' });
});

/**
 * POST request for a new game.
 *
 * This function requires <email> and <name> params
 * in the post body
 *
 * @param {Object} request
 * @param {Object} response
 */
router.post('/',middlewareValidateForm, function(request, response) {
	var cards = [
		'a','a','b','b','c','c',
		'd','d','e','e','f','f',
		'g','g','h','h','i','i',
		'j','j','k','k','l','l',
		'm','m','n','n','o','o'
	];

	cards.sort(function() {
		return .5 - Math.random();
	});

	var deck = [];

	for(var i=0;i<6;i++){
		var row = [];
		for(var ii=0;ii<5;ii++){
			row.push( {value:cards.pop(),checked:false} );
		}
		deck.push(row);
	}


	var collections = request.db.collection('memory');
	collections.save({
		begin: new Date(),
		end: undefined,
		width: 6,
		height: 5,
		deck: deck,
		ended: false
	},function(error,data){
		if(error){
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.status(500).json({
				error: error.message
			});
		}else{
			data.id = data._id.toString();
			delete data._id;
			delete data.deck;
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.status(201).json(data);
		}
	});

});

/**
 * GET info for game.
 *
 * This will return a JSON object about the game. It requires
 * the ID of the game as part of the URL.
 *
 * @param {Object} request
 * @param {Object} response
 */
router.get('/:id', middlewareFindGame, function(request, response) {
	delete request.game.deck;
	delete request.game._id;
	response.setHeader('Access-Control-Allow-Origin', '*');
	response.status(200).json(request.game);
});

/**
 * Make a move.
 *
 * Flip one card over. This function requires the ID of the game and some
 * <x> and <y> positions on the board. Moves can't be made on an ended game.
 *
 * @param {Object} request
 * @param {Object} response
 */
router.get('/:id/cards/:x,:y',middlewareFindGame, middlewareGameEnded, function(request, response) {
	if(
		request.game.deck.length > parseInt(request.params.x) &&
		request.game.deck[request.params.x].length > request.params.y
	){

		request.game.deck[request.params.x][request.params.y].checked = true;

		var collections = request.db.collection('memory');
		collections.save(request.game,function(error,document){
			if(error){
				response.setHeader('Access-Control-Allow-Origin', '*');
				response.status(500).json({
					error: error.message
				});
			}else{
				response.setHeader('Access-Control-Allow-Origin', '*');
				response.status(201).send(request.game.deck[request.params.x][request.params.y].value);
			}
		});
	}else{
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.status(400).json({
			error: 'Values out of bounds'
		});
	}

});

/**
 * POST an 'end game'.
 *
 * This function can be called at any time. It should be called with the
 * position of the final two cards (or the final pair). The function will
 * end the game, no more moves can be made after the game has ended.
 */
router.post('/:id/end', middlewareValidateEnd, middlewareFindGame, middlewareGameEnded, function(request, response) {
	if(
		request.game.deck.length > parseInt(request.body.x1) &&
		request.game.deck.length > parseInt(request.body.x2) &&
		request.game.deck[request.body.x1].length > request.body.y1 &&
		request.game.deck[request.body.x2].length > request.body.y2
	){

		request.game.deck[request.body.x1][request.body.y1].checked = true;
		request.game.deck[request.body.x2][request.body.y2].checked = true;

		request.game.ended = true;
		request.game.end = new Date();

		var uncompleted = request.game.deck.some(function(item){
			return item.some(function(i){
				return i.checked == false;
			});
		});


		var collections = request.db.collection('memory');
		collections.save(request.game,function(error,document){
			if(error){

			}else{
				if(uncompleted){
					response.setHeader('Access-Control-Allow-Origin', '*');
					response.json({
						"message": "You LOST! You ended too early!",
						"success": false
					});
				}else{
					response.setHeader('Access-Control-Allow-Origin', '*');
					response.json({
						"message": "You Win!",
						"success": true
					});
				}
			}
		});


	}else{
		response.setHeader('Access-Control-Allow-Origin', '*');
		response.status(400).json({
			error: 'Values out of bounds'
		});
	}

});



module.exports = router;
