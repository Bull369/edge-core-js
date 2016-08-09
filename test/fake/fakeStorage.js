var packages = require('./packages.js')
var UserStorage = require('../../src/userStorage.js').UserStorage

/**
 * Emulates the `localStorage` browser API.
 */
function FakeStorage () {
  this.items = {}
}
FakeStorage.prototype.getItem = function (key) {
  return key in this.items ? this.items[key] : null
}
FakeStorage.prototype.setItem = function (key, value) {
  this.items[key] = value
}
FakeStorage.prototype.removeItem = function (key) {
  delete this.items[key]
}

/**
 * Fills the `FakeStorage` instance with just the user list.
 */
FakeStorage.prototype.populateUsers = function () {
  this.items['airbitz.users'] = JSON.stringify(packages.users)
}

/**
 * Fills the `FakeStorage` instance with account data.
 */
FakeStorage.prototype.populate = function () {
  this.populateUsers()
  var userStorage = new UserStorage(this, 'js test 0')
  userStorage.setJson('passwordKeySnrp', packages.passwordKeySnrp)
  userStorage.setJson('passwordBox', packages.passwordBox)
  userStorage.setJson('passwordAuthBox', packages.passwordAuthBox)
  userStorage.setJson('rootKeyBox', packages.rootKeyBox)
  userStorage.setJson('syncKeyBox', packages.syncKeyBox)
  userStorage.setItem('pinAuthId', packages.pinPackage['DID'])
  userStorage.setJson('pinBox', packages.pinPackage['EMK_PINK'])
  userStorage.setItem('recovery2Key', packages.recovery2Key)
}

exports.FakeStorage = FakeStorage
