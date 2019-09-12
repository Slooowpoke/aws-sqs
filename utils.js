const {
  clone,
  concat,
  difference,
  fromPairs,
  head,
  is,
  isNil,
  map,
  merge,
  mergeDeepRight,
  pick,
  reduce,
  tail,
  toPairs,
  toUpper
} = require('ramda')

const titelize = (string) => `${toUpper(head(string))}${tail(string)}`

const getDefaults = ({ defaults, accountId, arn }) => {
  const response = clone(defaults)

  return response
}

const getQueue = async ({ sqs, queueUrl }) => {
  let queueAttributes = {}
  try {
    console.log('Hi!');
    const response = await sqs.getQueueAttributes({ QueueUrl: queueUrl }).promise()
    queueAttributes = response.Attributes
  } catch (error) {
    if (error.code !== 'AWS.SimpleQueueService.NonExistentQueue') {
      throw error
    }
  }
  return queueAttributes
}

const getAccountId = async (aws) => {
  const STS = new aws.STS()
  const res = await STS.getCallerIdentity({}).promise()
  return res.Account
}

const getUrl = ({ name, region, accountId }) => {
  return `https://sqs.${region}.amazonaws.com/${accountId}/${name}`
}

const getArn = ({ name, region, accountId }) => {
  return `arn:aws:sqs:${region}:${accountId}:${name}`
}

const createQueue = async ({ sqs, config }) => {
  const { QueueArn: arn } = await sqs.createQueue({ QueueName: config.name, Attributes : createAttributeMap(config) }).promise()
  return { arn }
}

const getAttributes = async (sqs, queueUrl) => {
  const params = {
    QueueUrl: queueUrl,
    AttributeNames: [ 'All' ]
  }
  const { Attributes: queueAttributes } = await sqs.getQueueAttributes (params).promise()
  return queueAttributes
}

const setAttributes = async (sqs, queueUrl, config) => {
  const params = {
    QueueUrl: queueUrl,
    Attributes: createAttributeMap(config)
  }
  await sqs.setQueueAttributes (params).promise()
}

const createAttributeMap = (config) => {
  const attributeMap = {
    VisibilityTimeout : config.visibilityTimeout.toString(),
    MaximumMessageSize : config.maximumMessageSize.toString(),
    MessageRetentionPeriod : config.messageRetentionPeriod.toString(),
    DelaySeconds : config.delaySeconds.toString(),
    ReceiveMessageWaitTimeSeconds : config.receiveMessageWaitTimeSeconds.toString()
  }
  return attributeMap
}


const deleteQueue = async ({ sqs, queueUrl }) => {
  try {
     console.log('queueUrl', queueUrl);
    await sqs.deleteQueue({ QueueUrl: queueUrl }).promise()
  } catch (error) {
    if (error.code !== 'AWS.SimpleQueueService.NonExistentQueue') {
      throw error
    }
  }
}

module.exports = {
  createQueue,
  deleteQueue,
  getAccountId,
  getArn,
  getUrl,
  getDefaults,
  getQueue,
  getAttributes,
  setAttributes,
  updateAttributes
}
