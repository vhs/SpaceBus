import { Component } from 'react'
import PropTypes from 'prop-types'

import { Button, Col, Container, Form, Row } from 'react-bootstrap'
import MQTT from 'async-mqtt'
import Moment from 'react-moment'
import { Helmet } from 'react-helmet'

import './App.css'

const initialState = { messages: {}, lastUpdated: 0 }

function Messages ({ messages, filter }) {
  filter = filter ?? ''

  const messageList = Object.entries(messages)
    .filter(([topic, message]) => (filter === '' || (filter !== '' && (topic.indexOf(filter) > -1 || message.payload.indexOf(filter) > -1))))
    .map(([topic, message], index) => {
      return (
<Row key={index}>
<Col md={4} style={{ textAlign: 'left' }}>{topic}</Col>
<Col>{message.payload}</Col>
<Col md={3}><Moment fromNow={true} withTitle titleFormat="YYYY-MM-DD HH:mm:ss">{message.timestamp}</Moment></Col>
</Row>
      )
    })

  return (<>{messageList}</>)
}

Messages.propTypes = {
  messages: PropTypes.object.isRequired,
  filter: PropTypes.string
}

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      connectionStatus: false,
      messages: {},
      lastUpdated: 0,
      mqttClient: null,
      filter: ''
    }
  }

  async componentDidMount () {
    const appConfig = await fetch('/config.json').then(res => res.json())

    const mqttClient = MQTT.connect(appConfig.mqttUri)

    mqttClient.on('connect', () => {
      this.setState({ connectionStatus: true })
      mqttClient.subscribe(appConfig.mqttTopic)
    })

    mqttClient.on('message', (topic, payload, packet) => {
      this.messageDispatcher({ type: 'UPDATE', topic, payload: payload.toString(), timestamp: Date.now() })
    })

    this.setState((state) => { return { ...appConfig, mqttClient } })
  }

  componentWillUnmount () {
    // @ts-ignore
    if (this.state.mqttClient !== null && this.state.mqttClient.connected && this.state.mqttClient.end != null) {
      // @ts-ignore
      return this.state.mqttClient.end()
    }
  }

  messageDispatcher (action) {
    const { type, topic, payload, timestamp } = action

    switch (type) {
      case 'UPDATE':
        return this.setState((state) => {
          state.messages[topic] = { payload, timestamp }
          state.lastUpdated = Date.now()

          return state
        })
      case 'CLEAR_MESSAGES':
        return this.setState(initialState)
      default:
        console.warn('messageReducer: default')
    }
  }

  handleChangeInput = (event) => {
    const { name, value, type, checked } = event.target

    type === 'checkbox'
      ? this.setState({ [name]: checked })
      : this.setState({ [name]: value })
  }

  render () {
    const { connectionStatus, messages, lastUpdated } = this.state

    return (
      <>
        <Helmet>
          <title>{this.state.title}</title>
        </Helmet>

        <div className="App">
          <Container fluid>
            <Row className="spacious"><Col><h1>{this.state.title}</h1></Col></Row>

            <Row className="spacious">
              <Col md={4} style={{ textAlign: 'left' }}><b>Connection Status:</b><br />{connectionStatus ? 'Online' : 'Offline'}</Col>
              <Col style={{ textAlign: 'right' }}><b>Last Updated:</b><br />{lastUpdated > 0 && (<Moment fromNow={true} withTitle titleFormat="YYYY-MM-DD HH:mm:ss">{lastUpdated}</Moment>)}</Col>
            </Row>

            <Row className="spacious">
              <Col>
                <span style={{ float: 'left' }}><Button variant="primary" onClick={() => this.messageDispatcher({ type: 'CLEAR_MESSAGES' })}>Clear Messages</Button></span>
                <span style={{ float: 'right' }}><Form.Control name='filter' value={this.state.filter} placeholder="Filter..." onChange={(e) => this.handleChangeInput(e)} /></span>
              </Col>
            </Row>

            <Row className="spacious">
              <Col md={5}><b>Topic</b></Col>
              <Col><b>Payload</b></Col>
              <Col md={3}><b>Last Change/Update</b></Col>
            </Row>

            <Messages messages={messages} filter={this.state.filter} />

            <Row className="spacious">
              <Col md={5}><b>Topic</b></Col>
              <Col><b>Payload</b></Col>
              <Col md={3}><b>Last Change/Update</b></Col>
            </Row>
          </Container>
        </div>
      </>
    )
  }
}

export default App
