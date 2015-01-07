var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(request, response) {
	response.render('index', { title: 'Express' });
});


router.get('/solution/tic-tac-toe', function(request, response) {
	response.render('./index/tic-tac-toe', { title: 'Express' });
});

router.get('/solution/memory', function(request, response) {
	response.render('./index/memory', { title: 'Express' });
});



module.exports = router;
