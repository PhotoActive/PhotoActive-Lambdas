console.log('Updating function')
var AWS = require('aws-sdk')
var lambda = new AWS.Lambda()
exports.handler = (event, context) => {
  var key = event.Records[0].s3.object.key
  var bucket = event.Records[0].s3.bucket.name
  var version = event.Records[0].s3.object.versionId
  if (bucket === 'photo-active-lambda' && key.endsWith('.zip') && version) {
    var functionName = 'PhotoActive-' + key.substring(0, key.length - 4)
    console.log('uploaded to lambda function: ' + functionName)
    var params = {
      FunctionName: functionName,
      S3Key: key,
      S3Bucket: bucket,
      S3ObjectVersion: version
    }
    lambda.updateFunctionCode(params, (err, data) => {
      if (err) {
        console.log(err, err.stack)
        context.fail(err)
      } else {
        console.log(data)
        context.succeed(data)
      }
    })
  } else {
    context.succeed('skipping file ' + key + ' in bucket ' + bucket + ' with version ' + version)
  }
}
