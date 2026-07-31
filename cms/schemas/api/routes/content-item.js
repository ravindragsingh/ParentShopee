'use strict';

/**
 * content-item router — auto-generates the standard REST routes
 * (find, findOne, create, update, delete) for the Content Item type.
 * Without this file (and the matching controller/service), Strapi only
 * partially registers the API and POST/PUT/DELETE return 405.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::content-item.content-item');
