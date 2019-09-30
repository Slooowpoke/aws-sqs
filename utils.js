const { clone } = require('ramda')

const getDefaults = ({ defaults }) => {
  const response = clone(defaults)

  return response
}

const getQueue = async ({ sqs, queueUrl }) => {
  let queueAttributes = {}
  try {
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

const createAttributeMap = (config) => {
  const attributeMap = {
    VisibilityTimeout: config.visibilityTimeout.toString(),
    MaximumMessageSize: config.maximumMessageSize.toString(),
    MessageRetentionPeriod: config.messageRetentionPeriod.toString(),
    DelaySeconds: config.delaySeconds.toString(),
    ReceiveMessageWaitTimeSeconds: config.receiveMessageWaitTimeSeconds.toString(),
    RedrivePolicy: JSON.stringify(config.redrivePolicy) || '',
    Policy: JSON.stringify(config.policy) || '',
    KmsMasterKeyId: JSON.stringify(config.kmsMasterKeyId) || '',
    KmsDataKeyReusePeriodSeconds: JSON.stringify(config.kmsDataKeyReusePeriodSeconds) || '300'
  }

  if (config.fifoQueue) {
    attributeMap.ContentBasedDeduplication =
      JSON.stringify(config.contentBasedDeduplication) || 'false'
  }

  return attributeMap
}

const createQueue = async ({ sqs, config }) => {
  const params = { QueueName: config.name, Attributes: createAttributeMap(config) }

  if (config.fifoQueue) {
    params.Attributes.FifoQueue = 'true'
  }

  if (config.tags) {
    params.tags = config.tags
  }
  const { QueueArn: arn } = await sqs.createQueue(params).promise()
  return { arn }
}

const getAttributes = async (sqs, queueUrl) => {
  const params = {
    QueueUrl: queueUrl,
    AttributeNames: ['All']
  }
  const { Attributes: queueAttributes } = await sqs.getQueueAttributes(params).promise()
  return queueAttributes
}

const setAttributes = async (sqs, queueUrl, config) => {
  const params = {
    QueueUrl: queueUrl,
    Attributes: createAttributeMap(config)
  }
  await sqs.setQueueAttributes(params).promise()
}

const deleteQueue = async ({ sqs, queueUrl }) => {
  try {
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
  setAttributes
}
