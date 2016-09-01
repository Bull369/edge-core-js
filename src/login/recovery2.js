var BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

var crypto = require('../crypto.js')
var base58 = require('base-x')(BASE58)
var userMap = require('../userMap.js')
var UserStorage = require('../userStorage.js').UserStorage
var account = require('../account.js')

function parseKey (key) {
  return new Buffer(base58.decode(key))
}

function encodeKey (key) {
  return base58.encode(key)
}
exports.encodeKey = encodeKey

function recovery2Id (recovery2Key, username) {
  return new Buffer(crypto.hmac_sha256(username, recovery2Key))
}

function recovery2Auth (recovery2Key, answers) {
  if (!(Object.prototype.toString.call(answers) === '[object Array]')) {
    throw new TypeError('Answers must be an array of strings')
  }

  var recovery2Auth = []
  for (var i = 0; i < answers.length; ++i) {
    var data = Buffer(answers[i], 'utf-8')
    var auth = crypto.hmac_sha256(data, recovery2Key)
    recovery2Auth[i] = new Buffer(auth).toString('base64')
  }
  return recovery2Auth
}

/**
 * Logs a user in using recovery answers.
 * @param username string
 * @param recovery2Key an ArrayBuffer recovery key
 * @param array of answer strings
 * @param callback function (err, account)
 */
function login (ctx, recovery2Key, username, answers, callback) {
  recovery2Key = parseKey(recovery2Key)
  username = userMap.normalize(username)

  var request = {
    'recovery2Id': recovery2Id(recovery2Key, username).toString('base64'),
    'recovery2Auth': recovery2Auth(recovery2Key, answers)
    // "otp": null
  }
  ctx.authRequest('GET', '/v2/login', request, function (err, reply) {
    if (err) return callback(err)

    try {
      // Recovery login:
      var recovery2Box = reply['recovery2Box']
      if (!recovery2Box) {
        return callback(Error('Missing data for recovery v2 login'))
      }

      // Decrypt the dataKey:
      var dataKey = crypto.decrypt(recovery2Box, recovery2Key)

      // Cache everything for future logins:
      var userId = userMap.getUserId(ctx.localStorage, username)
      userMap.insert(ctx.localStorage, username, userId)
      var userStorage = new UserStorage(ctx.localStorage, username)
      account.saveLoginReply(userStorage, reply, dataKey)
    } catch (e) {
      return callback(e)
    }
    return callback(null, new account.Account(ctx, username, dataKey))
  })
}
exports.login = login

/**
 * Fetches the questions for an account
 * @param username string
 * @param recovery2Key an ArrayBuffer recovery key
 * @param callback function (err, question array)
 */
function questions (ctx, recovery2Key, username, callback) {
  recovery2Key = parseKey(recovery2Key)
  username = userMap.normalize(username)

  var request = {
    'recovery2Id': recovery2Id(recovery2Key, username).toString('base64')
    // "otp": null
  }
  ctx.authRequest('GET', '/v2/login', request, function (err, reply) {
    if (err) return callback(err)

    try {
      // Recovery login:
      var question2Box = reply['question2Box']
      if (!question2Box) {
        return callback(Error('Account has no recovery questions'))
      }

      // Decrypt the dataKey:
      var questions = crypto.decrypt(question2Box, recovery2Key)
      questions = JSON.parse(questions.toString('utf8'))
    } catch (e) {
      return callback(e)
    }
    return callback(null, questions)
  })
}
exports.questions = questions

/**
 * Sets up a password for the account.
 */
function setup (ctx, account, questions, answers, callback) {
  if (!(Object.prototype.toString.call(questions) === '[object Array]')) {
    throw new TypeError('Questions must be an array of strings')
  }
  if (!(Object.prototype.toString.call(answers) === '[object Array]')) {
    throw new TypeError('Answers must be an array of strings')
  }

  var recovery2Key = account.userStorage.getItem('recovery2Key')
  if (recovery2Key) {
    recovery2Key = parseKey(recovery2Key)
  } else {
    recovery2Key = crypto.random(32)
  }

  var question2Box = crypto.encrypt(new Buffer(JSON.stringify(questions), 'utf8'), recovery2Key)
  var recovery2Box = crypto.encrypt(account.dataKey, recovery2Key)
  var recovery2KeyBox = crypto.encrypt(recovery2Key, account.dataKey)

  var request = {
    'userId': account.userId,
    'passwordAuth': account.passwordAuth.toString('base64'),
    'data': {
      'recovery2Id': recovery2Id(recovery2Key, account.username).toString('base64'),
      'recovery2Auth': recovery2Auth(recovery2Key, answers),
      'recovery2Box': recovery2Box,
      'recovery2KeyBox': recovery2KeyBox,
      'question2Box': question2Box
    }
  }
  ctx.authRequest('PUT', '/v2/login/recovery2', request, function (err, reply) {
    if (err) return callback(err)

    recovery2Key = encodeKey(recovery2Key)
    account.userStorage.setItem('recovery2Key', recovery2Key)
    return callback(null, recovery2Key)
  })
}
exports.setup = setup