const uuid = require('uuid').v4
const _ = require('lodash')
const { DOMAIN } = require('../config')

class Directive {
  constructor({namespace, name, payload}) {
    this.header = {
      messageId: uuid(),
      namespace: namespace,
      name: name,
    }
    this.payload = payload
  }
}

function resultText({midText, sum, diceCount}) {
  if (diceCount == 1) {
    return `결과는 ${sum}입니다.`
  } else if (diceCount < 4) {
    return `결과는 ${midText} 이며 합은 ${sum} 입니다.`
  } else {
    return `주사위 ${diceCount}개의 합은 ${sum} 입니다.`
  }
}

function throwDice(diceCount) {
  const results = []
  let midText = ''
  let resultText = ''
  let sum = 0
  console.log(`throw ${diceCount} times`)
  for (let i = 0; i < diceCount; i++) {
    const rand = Math.floor(Math.random() * 6) + 1
    console.log(`${i + 1} time: ${rand}`)
    results.push(rand)
    sum += rand
    midText += `${rand}, `
  }

  midText = midText.replace(/, $/, '')
  return {midText, sum, diceCount}
}

class CEKRequest {
  constructor (httpReq) {
    this.request = httpReq.body.request
    this.context = httpReq.body.context
    this.session = httpReq.body.session
    console.log(`CEK Request: ${JSON.stringify(this.context)}, ${JSON.stringify(this.session)}`)
  }

  do(cekResponse) {
    switch (this.request.type) {
      case 'LaunchRequest':
        return this.launchRequest(cekResponse)
      case 'IntentRequest':
        return this.intentRequest(cekResponse)
      case 'SessionEndedRequest':
        return this.sessionEndedRequest(cekResponse)
    }
  }

  launchRequest(cekResponse) {
    console.log('launchRequest')
    cekResponse.setSimpleSpeechText('안녕하세요. 클라스 알리미입니다.')
    cekResponse.setSimpleSpeechText('1번 급한 과제 알려줘, 2번 급한 강의 알려줘')
    cekResponse.setMultiturn({
      intent: 'InformKhuAss',
    })
  }

  intentRequest(cekResponse) {
    console.log('intentRequest')
    console.dir(this.request)
    const intent = this.request.intent.name
    const slots = this.request.intent.slots

    switch (intent) {
    case 'InformKhuAss':
        let name = "허진호"
        let course = "데이터베이스"
        let title = "lab02실습"
        let time = "2018-10-06"

        cekResponse.appendSpeechText(`${name}님의 가장 급한 과제는 ${course}과목의 ${title}이고 제출 기한은 ${time}까지 입니다.`)
        break

        case 'InformKhuLec':
        cekResponse.appendSpeechText(`제가 생각하기에 허진호님의 세상에서 제일 쓸모없는 후배는 강환석입니다!`)
        let namee = "허진호"
        let coursee = "소프트웨어적 사유"
        let titlee = "lec 02"
        let timee = "2018-10-05"

        cekResponse.appendSpeechText(`${namee}님의 가장 급한 인터넷 강의는 ${coursee}과목의 ${titlee}이고 마감 기한은 ${timee}까지 입니다.`)
        break

    default:
    }

    if (this.session.new == false) {
      cekResponse.setMultiturn()
    }
  }

  sessionEndedRequest(cekResponse) {
    console.log('sessionEndedRequest')
    cekResponse.setSimpleSpeechText('주사위 놀이 익스텐션을 종료합니다.')
    cekResponse.clearMultiturn()
  }
}

class CEKResponse {
  constructor () {
    console.log('CEKResponse constructor')
    this.response = {
      directives: [],
      shouldEndSession: true,
      outputSpeech: {},
      card: {},
    }
    this.version = '0.1.0'
    this.sessionAttributes = {}
  }

  setMultiturn(sessionAttributes) {
    this.response.shouldEndSession = false
    this.sessionAttributes = _.assign(this.sessionAttributes, sessionAttributes)
  }

  clearMultiturn() {
    this.response.shouldEndSession = true
    this.sessionAttributes = {}
  }

  setSimpleSpeechText(outputText) {
    this.response.outputSpeech = {
      type: 'SimpleSpeech',
      values: {
          type: 'PlainText',
          lang: 'ko',
          value: outputText,
      },
    }
  }

  appendSpeechText(outputText) {
    const outputSpeech = this.response.outputSpeech
    if (outputSpeech.type != 'SpeechList') {
      outputSpeech.type = 'SpeechList'
      outputSpeech.values = []
    }
    if (typeof(outputText) == 'string') {
      outputSpeech.values.push({
        type: 'PlainText',
        lang: 'ko',
        value: outputText,
      })
    } else {
      outputSpeech.values.push(outputText)
    }
  }
}

const clovaReq = function (httpReq, httpRes, next) {
  cekResponse = new CEKResponse()
  cekRequest = new CEKRequest(httpReq)
  cekRequest.do(cekResponse)
  console.log(`CEKResponse: ${JSON.stringify(cekResponse)}`)
  return httpRes.send(cekResponse)
};

module.exports = clovaReq;
