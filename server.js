var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');

var app = express('');
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;


app.use(bodyParser.json());

app.get('/', function(req, res){
	res.send('Todo API Root');
});

// GET /todos?completed=true
app.get('/todos', function(req, res){
	//var queryParams = req.query;
	var query = req.query;
	var where = {};

	if(query.hasOwnProperty('complete') && query.complete === 'true'){
		where.complete = true;
	}else if(query.hasOwnProperty('complete') && query.complete === 'false') {
		where.complete = false;
	}

	if(query.hasOwnProperty('q') && query.q.length > 0){
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({where: where}).then(function (todos) {
		res.json(todos);
	}, function(e){
		res.status(500).send();
	});
		
});

// GET /todos/:id
app.get('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	
	db.todo.findById(todoId).then(function (todo){
		if(!!todo){
			res.json(todo.toJSON());
		}else{
			res.status(404).send();
		}
	}, function(e){
		res.status(500).send();
	});
});

// POST /todos/
app.post('/todos', function(req, res){
	var body = _.pick(req.body, 'description', 'complete');

	db.todo.create(body).then(function(todo){
		res.json(todo.toJSON())
	}, function(e) {
		res.status(400).json(e);
	});

});

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res){
	var todoId = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function(rowsDeleted){
		if(rowsDeleted === 0){
			res.status(404).json({
				error: "No todo with id"
			});
		}else{
			res.status(204).send();
		}
	}).then(function(){
		res.status(500).send();
	});
});

// PUT /todos/:id

app.put('/todos/:id', function(req, res){
	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'complete');
	var attributes = {};


	if(body.hasOwnProperty('complete')){
		attributes.complete = body.complete;
	}

	if(body.hasOwnProperty('description')){
		attributes.description = body.description;
	}

	db.todo.findById(todoId).then(function(todo){
		if(todo){
			return todo.update(attributes).then(function(todo){
				res.json(todo.toJSON());
			}, function(e){
				res.status(400).json(e);
			});
		}else{
			res.status(404).send();
		}
	}, function(){
		res.status(500).send();
	});

});

app.post('/users', function(req, res){
	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(user){
		res.json(user.toPublicJSON());
	}, function(e){
		res.status(400).json(e);
	});

});

// post /users/login
app.post('/users/login', function(req, res){
	var body = _.pick(req.body, 'email', 'password');

	db.user.authenticate(body).then(function(user){
		res.json(user.toPublicJSON());
	}, function(){
		res.status(401).send();
	});
});


db.sequelize.sync({force: true}).then(function() {
	app.listen(PORT, function(){
		console.log('listening port ' + PORT + '!');
	});
});

