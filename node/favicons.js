// Generated by CoffeeScript 2.5.1
(function() {
  var favicons, log, mongo;

  mongo = require('mongodb');

  log = require('./log.js');

  favicons = (app) => {
    var ENV_DEBUG, ENV_DEV, ENV_DOCKER, ENV_PROD, MONGODB_PASSWORD, MONGODB_PORT, MONGODB_SERVER, MONGODB_USERNAME, url;
    ENV_DEBUG = process.env.NODE_ENV === 'debug';
    ENV_DEV = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'development';
    ENV_PROD = process.env.NODE_ENV === 'production';
    ENV_DOCKER = process.env.NODE_ENV === 'docker';
    MONGODB_USERNAME = process.env.MONGODB_USERNAME;
    MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
    MONGODB_SERVER = "db_mongo";
    if (ENV_DEV) {
      MONGODB_SERVER = 'localhost';
    } else if (ENV_PROD) {
      MONGODB_SERVER = 'db-mongo.service.nyc1.consul';
    }
    MONGODB_PORT = parseInt(process.env.MONGODB_PORT || 27017, 10);
    log.debug("Starting NewsBlur Favicon server...");
    if (!process.env.NODE_ENV) {
      log.debug("Specify NODE_ENV=<debug,development,docker,production>");
      return;
    } else if (ENV_DEBUG) {
      log.debug("Running as debug favicons server");
    } else if (ENV_DEV) {
      log.debug("Running as development server");
    } else if (ENV_DOCKER) {
      log.debug("Running as docker server");
    } else {
      log.debug("Running as production server");
    }
    if (ENV_PROD) {
      url = `mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_SERVER}:${MONGODB_PORT}/newsblur?replicaSet=nbset&readPreference=secondaryPreferred&authSource=admin`;
    } else {
      url = `mongodb://${MONGODB_SERVER}:${MONGODB_PORT}/newsblur`;
    }
    return (async function() {
      var client, collection, db, err;
      try {
        client = mongo.MongoClient(url, {
          useUnifiedTopology: true
        });
        await client.connect();
      } catch (error) {
        err = error;
        log.debug(`Error connecting to Mongo (${url}): ${err}`);
        return;
      }
      db = client.db("newsblur");
      collection = db.collection("feed_icons");
      log.debug(`Connected to ${db != null ? db.serverConfig.s.seedlist[0].host : void 0}:${db != null ? db.serverConfig.s.seedlist[0].port : void 0}`);
      if (err) {
        log.debug(` ***> Error connecting: ${err}`);
      }
      return app.get(/\/rss_feeds\/icon\/(\d+)\/?/, (req, res) => {
        var etag, feed_id;
        feed_id = parseInt(req.params[0], 10);
        etag = req.header('If-None-Match');
        if (ENV_DEBUG) {
          log.debug(`Feed: ${feed_id} ` + (etag ? ` / ${etag}` : ""));
        }
        return collection.findOne({
          _id: feed_id
        }, function(err, docs) {
          var body;
          if (!err && etag && docs && (docs != null ? docs.color : void 0) === etag) {
            if (ENV_DEBUG) {
              log.debug(`Cached: ${feed_id}, etag: ${etag}/${docs != null ? docs.color : void 0} ` + (err ? `(err: ${err})` : ""));
            }
            return res.sendStatus(304);
          } else if (!err && docs && docs.data) {
            if (ENV_DEBUG) {
              log.debug(`Req: ${feed_id}, etag: ${etag}/${docs != null ? docs.color : void 0} ` + (err ? `(err: ${err})` : ""));
            }
            res.header('etag', docs.color);
            body = Buffer.from(docs.data, 'base64');
            res.set("Content-Type", "image/png");
            return res.status(200).send(body);
          } else {
            if (ENV_DEBUG) {
              log.debug(`Redirect: ${feed_id}, etag: ${etag}/${docs != null ? docs.color : void 0} ` + (err ? `(err: ${err})` : ""));
            }
            if (ENV_DEV) {
              return res.redirect('/media/img/icons/circular/world.png');
            } else {
              return res.redirect('https://www.newsblur.com/media/img/icons/circular/world.png');
            }
          }
        });
      });
    })();
  };

  exports.favicons = favicons;

}).call(this);
