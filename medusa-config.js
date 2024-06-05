const dotenv = require("dotenv");

let ENV_FILE_NAME = "";
switch (process.env.NODE_ENV) {
	case "production":
		ENV_FILE_NAME = ".env.production";
		break;
	case "staging":
		ENV_FILE_NAME = ".env.staging";
		break;
	case "test":
		ENV_FILE_NAME = ".env.test";
		break;
	case "development":
	default:
		ENV_FILE_NAME = ".env";
		break;
}

try {
	dotenv.config({
		path:
			process.cwd() +
			"/" +
			ENV_FILE_NAME,
	});
} catch (e) {
	console.error(
		"No environment file found, using .env: " +
			e
	);
}

// CORS when consuming Medusa from admin
const ADMIN_CORS =
	process.env.ADMIN_CORS ||
	"http://localhost:7000,http://localhost:7001";

// CORS to avoid issues when consuming Medusa from a client
const STORE_CORS =
	process.env.STORE_CORS ||
	"http://localhost:3000,http://localhost:8000";

const DATABASE_TYPE =
	process.env.DATABASE_TYPE || "sqlite";
const DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgres://localhost/medusa-store";
const REDIS_URL =
	process.env.REDIS_URL ||
	"redis://localhost:6379";

const plugins = [
	{
		resolve: "@medusajs/admin",
		/** @type {import('@medusajs/admin').PluginOptions} */
	},
];

const modules = {};

/** @type {import('@medusajs/medusa').ConfigModule["projectConfig"]} */
const projectConfig = {
	jwtSecret: process.env.JWT_SECRET,
	cookieSecret:
		process.env.COOKIE_SECRET,
	database_database: "./medusa-db.sql",
	database_type: DATABASE_TYPE,
	store_cors: STORE_CORS,
	admin_cors: ADMIN_CORS,
	redis_url: REDIS_URL,
	database_extra:
		// process.env.NODE_ENV !==
		// "dvelopment"
		// 	?
		{
			ssl: {
				rejectUnauthorized: false,
			},
		},
	// : {},
};

if (
	DATABASE_URL &&
	DATABASE_TYPE === "postgres"
) {
	projectConfig.database_url =
		DATABASE_URL;
	delete projectConfig[
		"database_database"
	];
}

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
	projectConfig,
	plugins,
	modules,
};
