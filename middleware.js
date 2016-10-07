var cryptojs = require('crypto-js');

module.exports = function(db){
	return{
		requireAuthentication: function(req, res, next){
			var token = req.get('Auth') || '';

			db.token.findOne({
				where: {
					tokenHash: cryptojs.MD5(token).toString()
				}
			}).then(function(tokenInstances){
				if(!tokenInstances){
					throw new Error();
				}
				req.token = tokenInstances;
				return db.user.findByToken(token);
			}).then(function(user){
				req.user = user;
				next();
			}).catch(function(){
				res.status(401).send();
			});
		}
	};
};