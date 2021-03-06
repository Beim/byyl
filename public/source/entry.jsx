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

/**
 * 根据DFA配置文件, 返回显示在页面上的DFA表
 */
const transObjDFAToStr = (config) => {
    let ac = JSON.parse(config)
    ac = ac.accept
    let DFAStr = ''
    for (let item in ac) {
        DFAStr += `DFA ${item}: \n`
        for (let bodyItem in ac[item].body) {
            DFAStr += `\tstate ${bodyItem}: \n`
            for (let stateItem in ac[item].body[bodyItem]) {
                let tempState = ac[item].body[bodyItem][stateItem]
                if (stateItem === '\n') stateItem = '\\n'
                DFAStr += `\t\tchar=${stateItem}, state=${tempState}\n`
            }
        }
        DFAStr += '\n'
    }
    return DFAStr
}

const App = rcc({
    getInitialState() {
        return {
            config: '',
            DFA: '',
            shouldLexShow: false,
            shouldGramShow: false,
            gramTreeAllShow: true,
            shouldGramTableShow: false,
            shouldExpShow: true,
            source: '',
            lexicalCompiled: '',
            lexicalRes: {},
            gramRes: {},
            message: '',
            EnvArr: []
        }
    },

    clickConfigDiv() {
        document.getElementById('configFileInput').click()
    },

    /**
     * load config file to this.state.config 
     * set this.state.DFA
     */
    loadConfig(e) {
        let file = document.getElementById('configFileInput').files[0]
        let reader = new FileReader()
        reader.onload = (e) => {
            let config = e.target.result
            let DFA = transObjDFAToStr(config)
            this.setState({config, DFA})
        }
        reader.readAsText(file)
    },

    clickSourceDiv() {
        document.getElementById('sourceFileInput').click()
    },

    /**
     * load source file to this.state.source
     */
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

    showLex() {
        let shouldLexShow = !this.state.shouldLexShow
        this.setState({shouldLexShow})
    },

    showGram() {
        let shouldGramShow = !this.state.shouldGramShow
        this.setState({shouldGramShow})
    },

    showExp() {
        let shouldExpShow = !this.state.shouldExpShow
        this.setState({shouldExpShow})
    },

    showGramTable() {
        let shouldGramTableShow = !this.state.shouldGramTableShow
        this.setState({shouldGramTableShow})
    },

    /**
     * fetch when click compile button
     */
    compileSource() {
        const data = {
            config: this.state.config,
            source: this.state.source
        }
        /*
         * 词法分析阶段的请求
         *
        util.fetch('POST', '/lex', data).then((res) => {
            this.setState({
                lexicalCompiled: res.returnRes,
                lexicalRes: res
            })
        })
        */

        /*
         * 语法分析阶段的请求
         *
        util.fetch('POST', '/gram', data).then(({lexRes, gramRes}) => {
            this.setState({
                lexicalCompiled: lexRes.returnRes,
                lexicalRes: lexRes,
                gramRes
            })
        })
        */

        /*
         * 语义分析阶段的请求
         */
        util.fetch('POST', '/exp', data).then(({lexRes, gramRes}) => {
            this.setState({
                lexicalCompiled: lexRes.returnRes,
                lexicalRes: lexRes,
                gramRes,
                EnvArr: gramRes.EnvArr || []
            })
        })
    },

    transResToTable_lex(res) {
        if (res.allArr) res = res.allArr
        else return []
        let arr = []
        let odd = true
        for (let item of res) {
            if (item.type === '1' || item.type === '2') continue
            let cls = ''
            if (item.msg) cls = 'error'
            if (odd) cls += ' pure-table-odd'
            odd = !odd
            let tr = (
                <tr className={cls} key={'transTr' + item.begin}>
                    <td>{item.line}</td>
                    <td>{item.buffArr.join('')}</td>
                    <td>{item.type}</td>
                    <td>{item.info}</td>
                    <td>{item.begin}</td>
                    <td>{item.end}</td>
                </tr>
            )
            arr.push(tr)
        }
        return arr
    },

    transErrToTable_gram(res) {
        if (!res || res.length <= 0) return []
        let arr = []
        let odd = true
        res.forEach((item, index) => {
            let cls = 'error'
            if (odd) cls += ' pure-table-odd'
            odd = !odd
            let tr = (
                <tr className={cls} key={'transErr' + index}>
                    <td>{item.line}</td>
                    <td>{item.type}</td>
                    <td>{item.lexical}</td>
                    <td>{item.begin}</td>
                    <td>{item.end}</td>
                </tr>
            )
            arr.push(tr)
        })
        let table = (
            <table className="pure-table pure-table-horizontal whole-line">
                <thead>
                    <tr>
                        <th>错误行</th>
                        <th>类型</th>
                        <th>词法值</th>
                        <th>开始位置</th>
                        <th>结束位置</th>
                    </tr>
                </thead>
                <tbody>
                    {arr}
                </tbody>
            </table>
        
        )
        return table
    },

    transGrammarToTable_gram(res, terminators, nonTerminators) {
        if (!res || res.length <= 0) return []
        let ACTION = res.ACTION
        let GOTO = res.GOTO
        let symbols = terminators.concat(terminators, nonTerminators)
        let arr = []
        let odd = true
        // res.forEach((item, index) => {

        // })
        for (let i in ACTION) {
            let cls = ''
            if (odd) cls += 'pure-table-odd'
            odd = !odd
            let terminators_td = terminators.map((value, index) => {
                return (<td key={'terminators_td' + value + index}>{ACTION[i][value] === 'err' ? '' : ACTION[i][value]}</td>)
            })
            let nonTerminators_td = nonTerminators.map((value, index) => {
                return (<td key={'nonTerminators_td' + value + index}>{GOTO[i][value] === 'err' ? '' : GOTO[i][value]}</td>)
            })
            let tr = (
                <tr className={cls} key={'transGrammar' + i}>
                    <td>{i}</td>
                    {terminators_td}
                    {nonTerminators_td}
                </tr>
            )
            arr.push(tr)
        }

        let terminators_th_null = terminators.map((value, index) => {
            return (<th key={'terminators_th' + value + index}></th>)
        }).slice(0, -1)
        let nonTerminators_th_null = nonTerminators.map((value, index) => {
            return (<th key={'nonTerminators_th' + value + index}></th>)
        }).slice(0, -1)
        let terminators_th = terminators.map((value, index) => {
            return (<th key={'terminators' + value + index}>{value}</th>)
        })
        let nonTerminators_th = nonTerminators.map((value, index) => {
            return (<th key={'nonTerminators' + value + index}>{value}</th>)
        })
        let table = (
            <table className="pure-table pure-tablle-horizontal whole-line">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>ACTION</th>
                        {terminators_th_null}
                        <th>GOTO</th>
                        {nonTerminators_th_null}
                    </tr>
                    <tr>
                        <th></th>
                        {terminators_th}
                        {nonTerminators_th}
                    </tr>
                </thead>
                <tbody>
                    {arr}
                </tbody>
            </table>
        )
        return table
    },

    transResToTable_gram(res) {
        if (!res) return []
        let gramTreeAllShow = this.state.gramTreeAllShow ? 'in' : ''
        let stack = [{root: res, visited: false, level: 1}]
        let path = []
        let key = 0
        while (stack.length > 0) {
            let {root, visited, level} = stack.pop()
            if (!root) continue
            if (visited) {
                let obj = {
                    level,
                    key: key++,
                    name: root.typeName,
                    line: root.line,
                    isTerminator: root.isTerminator
                }
                if (root.lexical) obj.lexical = root.lexical
                if (root.index) obj.index = root.index
                path.push(obj)
            } else {
                stack.push({
                    root,
                    visited: true,
                    level
                })
                if (root.next && !root.isTerminator) {
                    for (let i = root.next.length - 1; i >= 0; i--) {
                        stack.push({
                            root: root.next[i],
                            visited: false,
                            level: level + 1
                        })
                    }
                }
            }
        }
        let table = []
        let s_table = []
        for (let item of path) {
            let info = item.name
            let pink = ''
            if (item.isTerminator && item.lexical !== 'nil') pink = 'pink'
            if (item.isTerminator && item.lexical !== item.name) {
                info += ` : ${item.lexical}`
            }
            if (item.line !== undefined) 
                info += ` (${item.line})`

            if (table.length === 0) {
                s_table.push(item)
                table.push(
                    <div key={`collapse-${item.key}`} className='panel panel-default'>
                        <div className='panel-heading'>
                                <a className={pink} data-toggle='collapse' href={`#collapse-${item.key}`}>
                                    {info} 
                                </a>
                        </div>
                        <div id={`collapse-${item.key}`} className={'panel-collapse collapse ' + gramTreeAllShow}>
                            <div className='panel-body'>
                            </div>
                        </div>
                    </div>
                )
            } else {
                let topLevel = s_table[s_table.length - 1].level
                if (topLevel <= item.level) {
                    s_table.push(item)
                    table.push(
                        <div key={`collapse-${item.key}`} className='panel panel-default'>
                            <div className='panel-heading'>
                                    <a className={pink} data-toggle='collapse' href={`#collapse-${item.key}`}>
                                        {info} 
                                    </a>
                            </div>
                            <div id={`collapse-${item.key}`} className={'panel-collapse collapse ' + gramTreeAllShow}>
                                <div className='panel-body'>
                                </div>
                            </div>
                        </div>
                    )
                } else if (topLevel > item.level) {
                    let idx;
                    for (idx = s_table.length - 1; idx >= 0; idx--) {
                        if (s_table[idx].level <= item.level) {
                            break
                        }
                    }
                    idx++
                    s_table = s_table.slice(0, idx)
                    s_table.push(item)
                    let tempTable = table.slice(idx)
                    table = table.slice(0, idx)
                    table.push(
                        <div key={`collapse-${item.key}`} className='panel panel-default'>
                            <div className='panel-heading'>
                                    <a data-toggle='collapse' href={`#collapse-${item.key}`}>
                                        {info} 
                                    </a>
                            </div>
                            <div id={`collapse-${item.key}`} className={'panel-collapse collapse ' + gramTreeAllShow}>
                                <div className='panel-body'>
                                    {tempTable}
                                </div>
                            </div>
                        </div>
                    )


                }
            }
        }
        return table
    },

    transErrToTable_exp(res) {
        if (!res || res.length <= 0) return []
        print(res)
        let arr = []
        let odd = true
        res.forEach((item, index) => {
            let cls = 'error'
            if (odd) cls += ' pure-table-odd'
            odd = !odd
            let tr = (
                <tr className={cls}>
                    <td>{item.replace(/ /g, '   ')}</td>
                </tr>
            )
            arr.push(tr)
        })
        let table = (
            <table className="pure-table pure-table-horizontal whole-line">
                <tbody>
                    {arr}
                </tbody>
            </table>
            
        )
        return table
    },

    transExpToTable_exp(EnvArr) {
        if (!EnvArr) return []
        let resArr = [] 
        EnvArr.forEach((env, idx) => {
            // print(env)
            let flistStr = env.flist.reduce((prev, curr) => `${prev}, ${curr.id}(${curr.type.name})`, '').slice(2)
            let nextStr = env.next.reduce((prev, curr) => `${prev}, ${curr}`, '').slice(2)

            let thead = (
                <thead>
                    <tr>
                        <th>名</th>
                        <th>返回值</th>
                        <th>偏移量</th>
                        <th>参数</th>
                        <th>父节点</th>
                        <th>子节点</th>
                    </tr>
                </thead>
            )
            let tbody = (
                <tbody>
                    <tr>
                        <td>{env.name}</td>
                        <td>{env.returnType.name}</td>
                        <td>{env.offset}</td>
                        <td>{flistStr}</td>
                        <td>{env.prev}</td>
                        <td>{nextStr}</td>
                    </tr>
                </tbody>
            )

            resArr.push(
                <div className={`part1 ` + this.state.shouldExpShow}>
                    <table className='pure-table pure-table-horizontal whole-line'>
                        {thead}
                        {tbody}
                    </table>
                </div>
            )

            let code_origin = env.code_3_origin.map((code, index) => {
                return (
                    <tr>
                        <td>{index}</td>
                        <td>{code.replace(/[0-9]+: /, '')}</td>
                        <td>{env.code_4_origin[index]}</td>
                    </tr>
                )
            })
            let code = env.code_3.map((code, index) => {
                return (
                    <tr>
                        <td>{index}</td>
                        <td>{code.replace(/[0-9]+: /, '')}</td>
                        <td>{env.code_4[index]}</td>
                    </tr>
                )
            })
            let top = env.top.map((t, index) => {
                return (
                    <tr>
                        <td>{index}</td>
                        <td>{t.id}</td>
                        <td>{t.type.name}</td>
                        <td>{t.width}</td>
                        <td>{t.offset}</td>
                    </tr>
                )
            })
            print('--------')
            print(this.state.source.split('\n'))
            print('-----------')
            let sourceCode = this.state.source.split('\n').map((s, index) => {
                return (
                    <tr>
                        <td>{index}</td>
                        <td>{s}</td>
                    </tr>
                )
            })
            print(sourceCode)
            resArr.push(
                <div className={`part1 ${this.state.shouldExpShow} codediv`}>
                    <table className='pure-table '>
                        <thead>
                            <tr>
                                <th></th>
                                <th>三地址指令</th>
                                <th>四元式序列</th>
                            </tr>
                        </thead>
                        <tbody>
                            {code_origin}
                        </tbody>
                    </table>
                    <table className='pure-table '>
                        <thead>
                            <tr>
                                <th>优化后</th>
                                <th>三地址指令</th>
                                <th>四元式序列</th>
                            </tr>
                        </thead>
                        <tbody>
                            {code}
                        </tbody>
                    </table>
                    <table className='pure-table'>
                        <thead>
                            <tr>
                                <th>符号表</th>
                                <th>名</th>
                                <th>类型</th>
                                <th>宽度</th>
                                <th>偏移量</th>
                            </tr>
                        </thead>
                        <tbody>
                            {top}
                        </tbody>
                    </table>
                </div>
            )

            /*
                    <table className='pure-table '>
                        <thead>
                            <tr>
                                <th></th>
                                <th>源码</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sourceCode}
                        </tbody>
                    </table>
            */


        })
        return resArr
    },

    render() {
        // print(this.state.EnvArr)
        // print(this.state.gramRes.grammarTable)
        let shouldLexShow = this.state.shouldLexShow ? '' : 'hide'
        let shouldGramShow = this.state.shouldGramShow ? '' : 'hide'
        let shouldGramTableShow = this.state.shouldGramTableShow ? '' : 'hide'
        let shouldExpShow = this.state.shouldExpShow ? '' : 'hide'
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
                        <button className="pure-button pure-button-primary" onClick={this.clickSourceDiv}> Source </button>
                        <button className="pure-button pure-button-primary" onClick={this.compileSource}> Run </button>
                        <button className="pure-button pure-button-primary" onClick={this.showLex}> LEX </button>
                        <button className="pure-button pure-button-primary" onClick={this.showGram}> GRAM </button>
                        <button className="pure-button pure-button-primary" onClick={this.showExp}> EXP </button>
                    </div>
                    <div className="part1-inputarea">
                        <form className="pure-form">
                            <textarea className="pure-input input-textarea" value={this.state.lexicalCompiled}></textarea>    
                        </form>
                    </div>
                </div>
                <div className={'part1 ' + shouldLexShow}>
                    <form className='pure-form whole-line'>
                        <textarea className='pure-input input-textarea' value={this.state.DFA}></textarea>
                    </form>
                </div>
                <div className={'part1 ' + shouldLexShow}>
                    <table className="pure-table pure-table-horizontal whole-line">
                        <thead>
                            <tr>
                                <th>行</th>
                                <th>字符串</th>
                                <th>类型</th>
                                <th>类型信息</th>
                                <th>开始位置</th>
                                <th>结束位置</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.transResToTable_lex(this.state.lexicalRes)}
                        </tbody>
                    </table>
                </div>
                <div className={'big-margin-bottom panel-group part1 ' + shouldGramShow}>
                    {this.transResToTable_gram(this.state.gramRes.res)}
                </div>
                <div className={'part1 ' + shouldExpShow}>
                    {this.transErrToTable_exp(this.state.gramRes.errArr)}
                </div>
                {this.transExpToTable_exp(this.state.EnvArr)}
            </div>
        )
    }
})

render(<App />, document.getElementById('main'))

