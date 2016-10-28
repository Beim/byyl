const fs = require('fs')
const path = require('path')
let grammar = {
    terminators: [
        '$',
        'proc', 'id', ';', 'integer', 'real', '[', 'num', ']', 'record',
        '=', '+', '-', '*', '/', '(', ')',
        'if', '{', '}', 'else', 'while',
        'or', 'and', 'not', 'true', 'false',
        '<', '<=', '==', '!=', '>', '>=',
        'call', ','
    ],

    nonTerminators: [
        'Px', 'P', 'Sa', 'Pa',
        'Da', 'D', 'T', 'X', 'C', 'IDlist',
        'S', 'E', 'Ea', 'R', 'Ra', 'Y', 'L',
        'B', 'Ba', 'N', 'Na', 'M', 'V', 'relop',
        'Elist',
    ],

    /*
    grammar: {
        '0': {
            'left': {'val': 'Px'},
            'right': {'val': ['P']}
        },
        '1': {
            'left': {'val': 'P'},
            'right': {'val': ['Da']}
        },
        '2': {
            'left': {'val': 'P'},
            'right': {'val': ['Sa']}
        },
        '3': {
            'left': {'val': 'Sa'},
            'right': {'val': ['Sa', 'S']}
        },
        '4': {
            'left': {'val': 'Sa'},
            'right': {'val': ['S']}
        },
        '5': {
            'left': {'val': 'D'},
            'right': {'val': ['Da', 'D']}
        },
        '6': {
            'left': {'val': 'Da'},
            'right': {'val': ['D']}
        },
        '7': {
            'left': {'val': 'D'},
            'right': {'val': ['proc', 'id', ';', 'D', 'Sa']}
        },
        '8': {
            'left': {'val': 'D'},
            'right': {'val': ['T', 'id', ';']}
        },
        '9': {
            'left': {'val': 'T'},
            'right': {'val': ['X', 'C']}
        },
        '10': {
            'left': {'val': 'T'},
            'right': {'val': ['X']}
        },
        '11': {
            'left': {'val': 'T'},
            'right': {'val': ['record', 'D']}
        },
        '12': {
            'left': {'val': 'X'},
            'right': {'val': ['integer']}
        },
        '13': {
            'left': {'val': 'X'},
            'right': {'val': ['real']}
        },
        '14': {
            'left': {'val': 'C'},
            'right': {'val': ['[', 'num', ']', 'C']}
        },
        '15': {
            'left': {'val': 'C'},
            'right': {'val': ['[', 'num', ']']}
        },
        '16': {
            'left': {'val': 'S'},
            'right': {'val': ['id', '=', 'E', ';']}
        },
        '17': {
            'left': {'val': 'S'},
            'right': {'val': ['L', '=', 'E', ';']}
        },
        '18': {
            'left': {'val': 'E'},
            'right': {'val': ['E', '+', 'Ea']}
        },
        '19': {
            'left': {'val': 'E'},
            'right': {'val': ['E', '-', 'Ea']}
        },
        '20': {
            'left': {'val': 'E'},
            'right': {'val': ['Ea']}
        },
        '21': {
            'left': {'val': 'Ea'},
            'right': {'val': ['R']}
        },
        '22': {
            'left': {'val': 'R'},
            'right': {'val': ['R', '*', 'Ra']}
        },
        '23': {
            'left': {'val': 'R'},
            'right': {'val': ['R', '/', 'Ra']}
        },
        '24': {
            'left': {'val': 'R'},
            'right': {'val': ['Ra']}
        },
        '25': {
            'left': {'val': 'Ra'},
            'right': {'val': ['Y']}
        },
        '26': {
            'left': {'val': 'Y'},
            'right': {'val': ['(', 'E', ')']}
        },
        '27': {
            'left': {'val': 'Y'},
            'right': {'val': ['num']}
        },
        '28': {
            'left': {'val': 'Y'},
            'right': {'val': ['-', 'Y']}
        },
        '29': {
            'left': {'val': 'Y'},
            'right': {'val': ['L']}
        },
        '30': {
            'left': {'val': 'L'},
            'right': {'val': ['L', '[', 'E', ']']}
        },
        '31': {
            'left': {'val': 'L'},
            'right': {'val': ['id', '[', 'E', ']']}
        },
        '32': {
            'left': {'val': 'S'},
            'right': {'val': ['if', '(', 'B', ')', '{', 'S', '}']}
        },
        '33': {
            'left': {'val': 'S'},
            'right': {'val': ['if', '(', 'B', ')', '{', 'S', '}', 'else', '{', 'S', '}']}
        },
        '34': {
            'left': {'val': 'S'},
            'right': {'val': ['while', '(', 'B', ')', '{', 'S', '}']}
        },
        '35': {
            'left': {'val': 'B'},
            'right': {'val': ['B', 'or', 'Ba']}
        },
        '36': {
            'left': {'val': 'B'},
            'right': {'val': ['Ba']}
        },
        '37': {
            'left': {'val': 'Ba'},
            'right': {'val': ['N']}
        },
        '38': {
            'left': {'val': 'N'},
            'right': {'val': ['N', 'and', 'Na']}
        },
        '39': {
            'left': {'val': 'N'},
            'right': {'val': ['Na']}
        },
        '40': {
            'left': {'val': 'Na'},
            'right': {'val': ['M']}
        },
        '41': {
            'left': {'val': 'M'},
            'right': {'val': ['E', 'relop', 'E']}
        },
        '42': {
            'left': {'val': 'M'},
            'right': {'val': ['not', 'V']}
        },
        '43': {
            'left': {'val': 'M'},
            'right': {'val': ['V']}
        },
        '44': {
            'left': {'val': 'V'},
            'right': {'val': ['true']}
        },
        '45': {
            'left': {'val': 'V'},
            'right': {'val': ['false']}
        },
        '46': {
            'left': {'val': 'V'},
            'right': {'val': ['(', 'B', ')']}
        },
        '47': {
            'left': {'val': 'relop'},
            'right': {'val': ['<']}
        },
        '48': {
            'left': {'val': 'relop'},
            'right': {'val': ['<=']}
        },
        '49': {
            'left': {'val': 'relop'},
            'right': {'val': ['==']}
        },
        '50': {
            'left': {'val': 'relop'},
            'right': {'val': ['!=']}
        },
        '51': {
            'left': {'val': 'relop'},
            'right': {'val': ['>']}
        },
        '52': {
            'left': {'val': 'relop'},
            'right': {'val': ['>=']}
        },
        '53': {
            'left': {'val': 'S'},
            'right': {'val': ['call', 'id', '(', 'Elist', ')']}
        },
        '54': {
            'left': {'val': 'Elist'},
            'right': {'val': ['Elist', ',', 'E']}
        },
        '55': {
            'left': {'val': 'Elist'},
            'right': {'val': ['E']}
        },
    }
    */
}

let grammarMd = fs.readFileSync(path.resolve(__dirname, './grammar.md'))
grammarMd = grammarMd.toString().split('\n').filter(e => e)
let grammarObj = {}
grammarMd.forEach((value, index) => {
    value = value.trim()
    if (value && value[0] !== '#') {
        value = value.split(' -> ')
        let left = {val: value[0].trim()}
        let right = {val: value[1].split(' ').filter(e => e)}
        grammarObj[index] = {left, right}
    }
})
// console.log(JSON.stringify(grammarObj, null, 4))

grammar.grammar = grammarObj

module.exports = grammar
