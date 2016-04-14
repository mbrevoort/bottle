var token = process.env.TOKEN
var verifyToken = process.env.VERIFY_TOKEN
var port = process.env.PORT

if (!token) throw new Error('TOKEN is required but missing')
if (!verifyToken) throw new Error('VERIFY_TOKEN is required but missing')
if (!port) throw new Error('PORT is required but missing')

var Botkit = require('botkit')
var controller = Botkit.facebookbot({ debug: false, access_token: token, verify_token: verifyToken })
var bot = controller.spawn()

controller.setupWebserver(port, function (err, webserver) {
  if (err) return console.log(err)
  controller.createWebhookEndpoints(webserver, bot, function () {
    console.log('Ready Player 1')
  })
})

controller.hears(['hello', 'hi'], 'message_received', function (bot, message) {
  bot.reply(message, 'Hello.')
})
