#!/usr/bin/env node

var LEX = [

{
    name: 'LITERAL',
    reg: /^[0-9]+/,
    compile: (instructionCode, match, programIn, program) => {
        var literal = match[0];
        program.inst.push(instructionCode);
        program.inst.push(parseInt(literal));
    },
    does: (stack, program) => {
        program.pc++;
        stack.c.push(program.inst[program.pc]);
    }
},
{
    name: 'HANOI',
    reg: /^\_/,
    does: (stack) => {
        var target = stack.c.pop();
        var count = stack.c.pop();
        while (count-- > 0)
            stack.towers[target].push(stack.c.pop());
        stack.c = stack.towers[target];
    }
},
{
    name: 'SWAP',
    reg: /^\$/,
    does: (stack) => {
        if (stack.c.length < 2) return;
        var temp = stack.c[stack.c.length - 1]
        stack.c[stack.c.length - 1] = stack.c[stack.c.length - 2]
        stack.c[stack.c.length - 1] = temp;
    }
},
{
    name: 'POP',
    reg: /^\^/,
    does: (stack) => stack.c.pop()
},
{
    name: 'PRINT',
    reg: /^>/,
    does: (stack) => {
        var c = stack.c.pop();
        while (c != 0) {
            process.stdout.write(String.fromCharCode(c));
            c = stack.c.pop();
        }
    }
},
{
    name: 'ADD',
    reg: /^\+/,
    does: (stack) => {
        var val = stack.c.pop() + stack.c.pop();
        stack.c.push(val);
    }
},
{
    name: 'LABEL',
    reg: /^\[.*\]/,
    compile: (instructionCode, match, programIn, program) => {
        var literal = match[0];
        var str = literal.substring(1, literal.length-1);
        if (!program.keys[str]) program.keys[str] = {};
        var keyObj = program.keys[str];
        var target = program.inst.length;
        keyObj.jump = target;
        if (!keyObj.unresolved) return;
        for (var i = 0; i < keyObj.unresolved.length; i++)
            program.inst[keyObj.unresolved[i]] = target;
        keyObj.unresolved = undefined;
    }
},
{
    name: 'JUMP',
    reg: /^\(.*\)/,
    compile: (instructionCode, match, programIn, program) => {
        var literal = match[0];
        var str = literal.substring(1, literal.length-1);
        if (!program.keys[str])
            program.keys[str] = {unresolved:[]};
        var target = program.keys[str].jump;
        // Literal
        program.inst.push(0);
        if (target === undefined) {
            program.inst.push(-1);
            program.keys[str].unresolved.push(program.inst.length - 1);
        } else {
            program.inst.push(target);
        }
    }
},
{
    name: 'DUP',
    reg: /^\"/,
    does: (stack) => {
        stack.c.push(stack.c[stack.c.length - 1]);
    }
},
{
    name: 'OUT',
    reg: /^\./,
    does: (stack) => {
        process.stdout.write(String.fromCharCode(stack.c.pop()));
    }
},
{
    name: 'STRING_LITERAL',
    reg: /^'.*'/,
    compile: (instructionCode, match, programIn, program) => {
        var literal = match[0];
        // remove quotes
        var str = literal.substring(1, literal.length-1);
        var arr = str.split('').reverse();
        // push null
        program.inst.push(0);
        program.inst.push(0);
        for (var i = 0; i < arr.length; i++) {
            program.inst.push(0);
            program.inst.push(arr[i].charCodeAt(0));
        }
    }
},
{
    name: 'COMMENT',
    reg: /^;.*(?:$|\n)/,
    compile: () => {}
},
{
    name: 'WHITESPACE',
    reg: /^\s+/,
    compile: () => {}
}

]

var sample1 = `
    100 200 +   ; add 100 and 200
    400         ; push 400 to stack
    +           ; add result
`;
var sample2 = `
    'hello world'>
    10.
    'wow!'>
`;
var sample3 = `
    ;'wow'
    ;4 1 _
    (loop)
    ;"
    ;1 0 _ 0 1 _
    ;1 2 _ 0 1 _
    [loop]
    10
`;


function compile(programString) {
    var program = {inst:[], pc:0, keys:{}};
    function next(programString) {
        for (var i = 0; i < LEX.length; i++) {
            var lex = LEX[i];
            lex.index = i;
            if (lex.reg.test(programString)) {
                var match = lex.reg.exec(programString);
                if (lex.compile)
                    lex.compile(i, match, programString, program);
                else
                    program.inst.push(lex.index);
                programString = programString.slice(match[0].length);
                return programString;
            }
        }
        var line = programString.split('\n')[0];
        var err = 'Unable to parse program\n';
        console.error(err, line.substring(0, 20), '\n', '^');
        process.exit(1);
    }
    while (programString.length > 0)
        programString = next(programString);
    return program;
}

function run(program) {
    console.log('$$$ PROGRAM START $$$');
    var keys = {};
    var stack = {towers: [[], [], []], c:null};
    stack.c = stack.towers[0];
    while (program.pc < program.inst.length) {
        LEX[program.inst[program.pc]].does(stack, program)
        program.pc++;
    }
    console.log('\n$$$$$$$$$$$$$$$$$$$$$');
    console.log();
    return stack;
}

var toRun = sample3;
var program = compile(toRun);
var stack = run(program);

console.log('INPUT', toRun);
console.log('PROGRAM', JSON.stringify(program));
console.log('stack', stack);
