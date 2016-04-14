var token = process.env.TOKEN
var verifyToken = process.env.VERIFY_TOKEN
var port = process.env.PORT
var clientID = process.env.WJ_CLIENT_ID

if (!token) throw new Error('TOKEN is required but missing')
if (!verifyToken) throw new Error('VERIFY_TOKEN is required but missing')
if (!port) throw new Error('PORT is required but missing')

var Botkit = require('botkit')
var request = require('request')
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
  bot.reply(message, {
    attachment: {
      'type': 'template',
      'payload': {
        'template_type': 'button',
        'text': 'What is your fancy?',
        'buttons': [
          {
            'type': 'postback',
            'title': 'Cats',
            'payload': 'show_cat'
          },
          {
            'type': 'postback',
            'title': 'Dogs',
            'payload': 'show_dog'
          }
        ]
      }
    }
  })
})

controller.on('facebook_postback', function (bot, message) {
  switch (message.payload) {
    case 'show_cat':
      bot.reply(message, {
        attachment: {
          'type': 'image',
          'payload': {
            'url': 'https://media.giphy.com/media/xT77XZrTKOxycjaYvK/giphy.gif'
          }
        }
      })
      break
    case 'show_dog':
      bot.reply(message, {
        attachment: {
          'type': 'image',
          'payload': {
            'url': 'https://media.giphy.com/media/9gn4lhW6wiQ6c/giphy.gif'
          }
        }
      })
      break
  }

  var obj = JSON.parse(message.payload)
  if (!obj) return console.log('oh no, invalid payload: ' + message.payload)
  if (obj.type === 'flight_status') {
    getFlightStatus(obj.number, function (error, data) {
      if (error) return bot.reply(message, 'uh oh - ' + error)
      bot.reply(message, 'There is ' + data[obj.day].flights.length + ' flight ' + obj.day + ' for ' + obj.carrierCode + obj.number)
      data[obj.day].flights.forEach(function (flight) {
        bot.reply(message, 'From ' + flight.departureAirportName + ' to ' + flight.arrivalAirportName)
        if (flight.departureGate) bot.reply(message, 'Departing from gate ' + flight.departureGate)
        bot.reply(message, 'The flight status is "' + flight.status + '", I hope you know what that means ;)')
      })
    })
  }
})

controller.hears(['flight status'], 'message_received', function (bot, message) {
  bot.startConversation(message, function (err, convo) {
    if (err) return bot.reply(message, 'uh oh - ' + err)
    convo.ask('Which flight?', function (response, convo) {
      var today = { type: 'flight_status', number: parseInt(response.text, 10), day: 'today' }
      var tomorrow = { type: 'flight_status', number: parseInt(response.text, 10), day: 'tomorrow' }

      bot.reply(message, {
        attachment: {
          'type': 'template',
          'payload': {
            'template_type': 'button',
            'text': 'For which day?',
            'buttons': [
              {
                'type': 'postback',
                'title': 'Today',
                'payload': JSON.stringify(today)
              },
              {
                'type': 'postback',
                'title': 'Tomorrow',
                'payload': JSON.stringify(tomorrow)
              }
            ]
          }
        }
      })
      convo.next()
    })
  })
})

function getFlightStatus (flightNumber, cb) {
  request({
    uri: 'https://api.flightstatus.t.apinp.westjet.com/flightstatus/airportFlightDetails?airportCode=&client_id=' + clientID + '&depOrArv=dep&flightNumber=' + flightNumber + '&language=en',
    json: true
  }, function (error, response, body) {
    if (error) return cb(error)
    if (response.statusCode !== 200) {
      return cb(new Error('Unexpected Status Code: ' + response.statusCode))
    }
    return cb(null, body)
  })
}
