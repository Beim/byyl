import './style.css'
import './pure-min.css'
import React from 'react'
import {render} from 'react-dom'
import util from './util.js'

const rcc = React.createClass.bind()
const print = console.log.bind()

/**
 * insert script tag
 * @param config Object
 */
const insertScript = (config) => {
    let script = `<script>${config.publicFunc}</script>`
    let newItem = document.createElement('script')
    let textNode = document.createTextNode(config.publicFunc)
    newItem.appendChild(textNode)
    let text = `var actions = {};\n`
    for (let i in config.actions) {
        text += `actions['${i}'] = (...args) => {${config.actions[i]}};\n`
    }
    textNode = document.createTextNode(text)
    newItem.appendChild(textNode)
    document.body.insertBefore(newItem, document.body.firstChild)
}

const App = rcc({
    getInitialState() {
        return {
            config: {},
            source: '',
            lexicalCompiled: '',
            message: ''
        }
    },

    clickConfigDiv() {
        document.getElementById('configFileInput').click()
    },

    /**
     * load config file to this.state.config 
     */
    loadConfig(e) {
        let file = document.getElementById('configFileInput').files[0]
        let reader = new FileReader()
        reader.onload = (e) => {
            let config = e.target.result
            this.setState({config})
        }
        reader.readAsText(file)
    },

    clickSourceDiv() {
        document.getElementById('sourceFileInput').click()
    },

    loadSource(e) {
        let file = document.getElementById('sourceFileInput').files[0]
        let reader = new FileReader()
        reader.onload = (e) => {
            let source = e.target.result
            this.setState({source})
        }
        reader.readAsText(file)
    },

    /**
     * update this.state.source when source changed
     */
    sourceChange(e) {
        let source = e.target.value
        this.setState({source})
    },

    /**
     * fetch when click compile button
     */
    compileSource() {
        const data = {
            config: this.state.config,
            source: this.state.source
        }
        util.fetch('POST', '/lex', data).then((res) => {
            print(res)
            this.setState({
                lexicalCompiled: res.returnRes
            })
        })
    },

    render() {
        return (
            <div>
                <input type="file" className="fileInput" id="configFileInput" accept=".json" onChange={this.loadConfig}></input>
                <input type="file" className="fileInput" id="sourceFileInput" accept=".c" onChange={this.loadSource}></input>
                <div className="part1">
                    <div className="part1-inputarea">
                        <form className="pure-form">
                            <textarea className="pure-input input-textarea" value={this.state.source} onChange={this.sourceChange}></textarea>    
                        </form>
                    </div>
                    <div className="part1-buttonarea">
                        <button className="pure-button pure-button-primary" onClick={this.clickConfigDiv}> Config </button>
                        <button className="pure-button pure-button-primary" onClick={this.clickSourceDiv}> Source </button>
                        <button className="pure-button pure-button-primary" onClick={this.compileSource}> Compile </button>
                    </div>
                    <div className="part1-inputarea">
                        <form className="pure-form">
                            <textarea className="pure-input input-textarea" value={this.state.lexicalCompiled}></textarea>    
                        </form>
                    </div>
                </div>
            </div>
        )
    }
})

render(<App />, document.getElementById('main'))
