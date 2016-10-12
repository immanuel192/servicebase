/* global Sequelize */
'use strict';

/* global sails */
var _ = require('lodash');
var crypto = require('crypto');
var Promise = require("bluebird");

function initClassMethods(obj) {
	/**
	 * Return new instance of UserModel
	 * @return {{UserModel}}
	 */
	obj.options.classMethods.newInstance = function () {
		return {
			username: '',
			email: '',
			password: ''
		};
	};
	/**
	 * Register a new User with a passport
	 */
	obj.options.classMethods.register = function (user) {
		return new Promise(function (resolve, reject) {
			sails.services.passport.protocols.local.createUser(user, function (error, created) {
				if (error) return reject(error);

				resolve(created);
			});
		});
	};

}

/**
 * @param  {Object} obj
 */
function initHooks(obj) {
	/**
	 * Handle beforeCreate event
	 */
	obj.options.hooks.beforeCreate = function (user, options) {
		if (_.isEmpty(user.username)) {
			user.username = user.email;
		}
		if (_.isEmpty(user.email)) {
			user.email = user.username;
		}
	};
}

function initInstanceMethods(obj) {
	/**
	 *  Define all instance methods
    */
	obj.options.instanceMethods.toJSON = function () {
		var user = {};
		if (this.dataValues) {
			// _.merge(user, this.dataValues);
			user = this.dataValues;
		}
		else {
			// _.merge(user, this);
			user = this;
		}
		delete user.password;
		user.gravatarUrl = this.getGravatarUrl();
		return user;
	};

	/**
	 * Get Roles by User
	 */
	obj.options.instanceMethods.getRoles = function (next) {
		sails.models.rolemodel.find({
			where: {
				userId: this.id
			}
		})
			.then(function (roles) {
				return next(null, roles || []);
			})
			.catch(function (err) {
				return next(err);
			});
	};

	obj.options.instanceMethods.getGravatarUrl = function () {
		var md5 = crypto.createHash('md5');
		md5.update(this.email || '');
		return 'https://gravatar.com/avatar/' + md5.digest('hex');
	};
}

/**
 * UserModel.js
 *
 * @description :: System Users Entity Model
 * @docs        :: http://sailsjs.org/#!documentation/models
 * @return {{UserModel}}
 */
module.exports = (function UserModel() {
	var $this = {
		globalId: 'usermodel',
		options: {
			tableName: 'users',
			schema: 'system',
			instanceMethods: {},
			classMethods: {},
			hooks: {},
			indexes: [
				// Create a unique index on email
				{
					unique: true,
					fields: ['username', 'email']
				}
			]
		}
	};

	// Model config
	$this.attributes = {
		username: {
			type: Sequelize.STRING,
			unique: true
		},
		email: {
			type: Sequelize.STRING,
			unique: true,
			allowNull: false
		}
		//passportId: {
		//  type: Sequelize.INTEGER,
		//  defaultValue: 0,
		//  allowNull: false
		//}
	};

	/**
	 * Association
	 */
	$this.associations = function (userModelDef) {
		// userModelDef.hasMany(sails.models.PassportModel, {
		// 	as: "Passport",
		// 	foreignKey: "userId",
		// 	onDelete: 'CASCADE',
		// 	constraints: true
		// });
		// userModelDef.hasMany(sails.models.RoleModel, {
		// 	as: "Role",
		// 	foreignKey: "userId",
		// 	onDelete: 'CASCADE',
		// 	constraints: true
		// });
	};

	initInstanceMethods($this);

	initClassMethods($this);

	initHooks($this);

	return $this;
})();

