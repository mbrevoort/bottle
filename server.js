var token = process.env.TOKEN
var verifyToken = process.env.VERIFY_TOKEN
var port = process.env.PORT

if (!token) throw new Error('TOKEN is required but missing')
if (!verifyToken) throw new Error('VERIFY_TOKEN is required but missing')
if (!port) throw new Error('PORT is required but missing')

var Botkit = require('botkit')
var controller = Botkit.facebookbot({ debug: true, access_token: token, verify_token: verifyToken })
var bot = controller.spawn()

controller.setupWebserver(port, function (err, webserver) {
  if (err) return console.log(err)
  controller.createWebhookEndpoints(webserver, bot, function () {
    console.log('Ready Player 1')
  })
})

controller.hears(['hello', 'hi'], 'message_received', function (bot, message) {
  controller.storage.users.get(message.user, function (err, user) {
    if (err) return console.log(err)
    if (user && user.name) {
      bot.reply(message, 'Hello ' + user.name + '!!')
    } else {
      bot.reply(message, 'Hello.')
    }
  })
})
