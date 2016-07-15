'use strict'

var aws = require('aws-sdk')
var s3 = new aws.S3()
var Sequelize = require('sequelize')
var sequelize = new Sequelize('photoactive', 'AWSMASTER', 'kUJP6qVpwWW', {
  host: 'photoactivedb.cwxrostbzup7.us-east-1.rds.amazonaws.com',
  port: 5432,
  dialect: 'postgres',
  pool: {
    max: 5,
    min: 0,
    idle: 100
  }
})

var User = sequelize.define('user', {
  email: Sequelize.STRING
}, {
  timestamps: false
})

var Photo = sequelize.define('photo', {
  url: Sequelize.STRING,
  lat: Sequelize.DOUBLE,
  lng: Sequelize.DOUBLE,
  user_id: Sequelize.INTEGER
}, {
  timestamps: false
})

var Cache = sequelize.define('cache', {
  master_photo: Sequelize.INTEGER
}, {
  timestamps: false
})

User.hasMany(Photo)
Photo.belongsTo(User)
Photo.belongsTo(Cache)
Cache.hasOne(Photo, {as: 'master', foreignKey: 'master_photo'})

exports.handler = (event, context) => {
  var record = event.Records[0].s3
  var bucket = record.bucket.name
  var key = record.object.key

  var TEMPUSER = 1 // User ID 1 is for anonymous users currently

  s3.headObject({Bucket: bucket, Key: key}, (err, dat) => {
    if (err) {
      console.log(err)
      context.fail(err)
    }

    if ((dat) && (!('lat' in dat.Metadata) || !('lng' in dat.Metadata))) {
      console.log('Missing lat/lng, or Missing data')
      context.fail('Incorrect Metadata')
    }

    sequelize.sync()

    User.findById(TEMPUSER).then((user) => {
      Photo.create({
        user_id: user.id,
        url: key,
        lat: dat.Metadata['lat'],
        lng: dat.Metadata['lng']
      }).then((photo) => {
        Cache.create({
          master_photo: photo.id
        }).then((cache) => {
          context.succeed('Cache Created')
        }).catch((err) => {
          context.fail(err)
        })
      }).catch((err) => {
        context.fail(err)
      })
    }).catch((err) => {
      console.log(err)
      context.fail(err)
    })
  })
}
