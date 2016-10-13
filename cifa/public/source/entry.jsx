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
            lexicalRes: {},
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
                lexicalCompiled: res.returnRes,
                lexicalRes: res
            })
        })
    },

    transResToTable(res) {
        if (res.allArr) res = res.allArr
        else return []
        let arr = []
        let odd = true
        for (let item of res) {
            if (item.type === '1') continue
            let cls = ''
            if (item.msg) cls = 'error'
            if (odd) cls += ' pure-table-odd'
            odd = !odd
            let tr = (
                <tr className={cls} key={'transTr' + item.begin}>
                    <td>{item.line}</td>
                    <td>{item.buffArr.join('')}</td>
                    <td>{item.type}</td>
                    <td>{item.begin}</td>
                    <td>{item.end}</td>
                </tr>
            )
            arr.push(tr)
        }
        return arr
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
                <div className='part1'>
                    <table className="pure-table pure-table-horizontal">
                        <thead>
                            <tr>
                                <th>行</th>
                                <th>字符串</th>
                                <th>类型</th>
                                <th>开始位置</th>
                                <th>结束位置</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.transResToTable(this.state.lexicalRes)}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
})

render(<App />, document.getElementById('main'))
