const LRBuildUtil = require('./LRBuildUtil.js')
const getGrammar = require('../grammar/grammarUtil.js')
    let grammarMd = `
        Sx -> S B C
        S -> nil
        S -> num
        B -> id
        B -> nil
        C -> ah
    `
    let {grammar, terminators, nonTerminators} = getGrammar(grammarMd)
    let first = LRBuildUtil.first_nil(grammar, terminators, nonTerminators)
    let follow = LRBuildUtil.follow_nil(grammar, first, nonTerminators)
    console.log(follow)
