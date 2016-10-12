var PassportModel = {
    globalId: 'passportmodel',
	options: {
		tableName: 'passports',
		schema: 'authentications',
		hooks: {
			/**
			 * Callback to be run before creating a Passport.
			 *
			 * @param {Object}   passport The soon-to-be-created Passport
			 * @param {Function} options
			 */
			beforeCreate: function (passport, options) {
				return hashPassword(passport, options);
			},

			/**
			 * Callback to be run before updating a Passport.
			 *
			 * @param {Object}   passport Values to be updated
			 * @param {Function} options
			 */
			beforeUpdate: function (passport, options) {
				return hashPassword(passport, options);
			}
		},
		instanceMethods: {
			/**
			 * Validate password used by the local strategy.
			 *
			 * @param {string}   password The password to validate
			 * @param {Function} next
			 */
			validatePassword: function (password, next) {
				// bcrypt.compare(password, this.password, next);
				return bcrypt.compare(password, this.password).then(function (valid) {
					return next(null, valid);
				}).catch(function (err) {
					next(err);
				});
			}
		}
	},
	attributes: {
		// Required field: Protocol
		//
		// Defines the protocol to use for the passport. When employing the local
		// strategy, the protocol will be set to 'local'. When using a third-party
		// strategy, the protocol will be set to the standard used by the third-
		// party service (e.g. 'oauth', 'oauth2', 'openid').
		protocol: {
			type: Sequelize.STRING,
			allowNull: false
		},

		// Local field: Password
		//
		// When the local strategy is employed, a password will be used as the
		// means of authentication along with either a username or an email.
		password: {
			type: Sequelize.STRING, minLength: 8
		},

		// Provider fields: Provider, identifer and tokens
		//
		// "provider" is the name of the third-party auth service in all lowercase
		// (e.g. 'github', 'facebook') whereas "identifier" is a provider-specific
		// key, typically an ID. These two fields are used as the main means of
		// identifying a passport and tying it to a local user.
		//
		// The "tokens" field is a JSON object used in the case of the OAuth stan-
		// dards. When using OAuth 1.0, a `token` as well as a `tokenSecret` will
		// be issued by the provider. In the case of OAuth 2.0, an `accessToken`
		// and a `refreshToken` will be issued.
		provider: { type: Sequelize.STRING },
		identifier: { type: Sequelize.STRING },
		tokens: { type: Sequelize.TEXT },

		/**
		 * Keep the userId for this Passport. It will help us to keep 1 passport for 1 user
		 * TODO: this is not a good solution. Please specify the associations instead
		 */
		userId: {type: Sequelize.INTEGER}
	},
	associations: function (modelDef) {
		// modelDef.belongsTo(sails.models.UserModel, {
		// 	as: "User",
		// 	foreignKey: "userId",
		// 	onDelete: 'CASCADE',
		// 	constraints: true
		// });
	}
};

module.exports = PassportModel;
