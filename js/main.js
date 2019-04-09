var data = {}

function updateTable () {
  console.log('updateTable', Object.keys(data).length)
  $('#dataContainer').empty()

  Object.keys(data).sort().forEach(function (dataTopic) {
    let topicData = data[dataTopic]

    $('#dataContainer').append(
      '<div class=\'row spacious\'>' +
        '<div class=\'col-xs-12 col-sm-12 col-md-4 col-lg-4\'>' + dataTopic + '</div>' +
        '<div class=\'col-xs-6 col-sm-5 col-md-5 col-lg-5\'>' + topicData.msg.replace(/(<([^>]+)>)/ig, '') + '</div>' +
        '<div class=\'col-xs-12 col-sm-12 col-md-3 col-lg-3\'><span class=\'timeago\' datetime=\'' + topicData.ts + '\'></time></div>' +
        '</div>'
    )
  })
  updateTimeAgoListeners()
}

var wsMQTT = new Mosquitto()
wsMQTT.connect(mqttServer, 15)

wsMQTT.onconnect = function (rc) {
  console.log('wsMQTT.onconnect', rc)
  console.log('wsMQTT.onconnect', 'subscribing to', mqttTopic)
  wsMQTT.subscribe(mqttTopic, 0)
}
wsMQTT.ondisconnect = function (rc) {
  console.log('wsMQTT.ondisconnect', rc)
  setTimeout(function () {
    wsMQTT.connect(mqttServer, 15)
  }, 500)
}
wsMQTT.onmessage = function (topic, payload, qos) {
  console.log('wsMQTT.onmessage', topic, '=>', payload, '=>', qos)
  if (data[topic] === undefined) {
    data[topic] = { msg: payload, ts: new Date().toISOString() }
  } else if (data[topic].msg !== payload) {
    data[topic] = { msg: payload, ts: new Date().toISOString() }
  }
  updateTable()
}

var updateTimeAgoListeners = () => {
  $('#lastUpdate').attr('datetime', new Date().toISOString())
  $('span.timeago').each(function () { $(this).html('<i>' + $.timeago($(this).attr('datetime')) + '</i>') })
}

// Timeago
$(document).ready(function () {
  $.timeago.settings.refreshMillis = 500
  updateTimeAgoListeners()
})

var lastUpdated = Date.now()

setInterval(function () {
  if ((Date.now() - lastUpdated) > maintainanceInterval) {
    updateTable()
    updateTimeAgoListeners()
    lastUpdated = Date.now()
  }
}, 1000)
