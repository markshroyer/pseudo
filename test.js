// Shorthand for multi-line string "literals"
function ml() {
    var result = "";
    for (var i = 0; i < arguments.length; i++) {
        result += arguments[i];
        if (i < arguments.length - 1) {
            result += "\n";
        }
    }
    return result;
};


QUnit.module("Lexical analysis");

QUnit.test("Indentation", function (assert) {
    assert.throws(function () {
        Pseudo.create(ml(
            'a = 1',
            'if a == 1:',
            '    b = 2',
            '  b = 3'
        )).evl();
    }, "Invalid indentation");
});


QUnit.module("Arithmetic operators");

QUnit.test("Simple addition", function (assert) {
    var p = Pseudo.create("2 + 3");
    assert.equal(p.evl(), 5, "2 + 3 == 5");
});

QUnit.test("Simple multiplication", function (assert) {
    var p = Pseudo.create("2 * 3");
    assert.equal(p.evl(), 6, "2 * 3 == 6");
});

QUnit.test("Addition/multiplication operator precedence", function (assert) {
    var p = Pseudo.create("2 + 3 * 4 + 5");
    assert.equal(p.evl(), 19, "2 + 3 * 4 + 5 == 19");
});

QUnit.test("Parentheses", function (assert) {
    assert.equal(Pseudo.create("(2+3)*4 + 5").evl(), 25,
                 "(2 + 3) * 4 + 5 == 25");
    assert.throws(function () { Pseudo.create("(2+3").evl() },
                  "Unbalanced opening parens");
    assert.throws(function () { Pseudo.create("2+3)").evl() },
                  "Unbalanced closing parens");
});


QUnit.module("Assignment");

QUnit.test("Simple assignment", function (assert) {
    var text =
        'a = 1\n' +
        'a\n';
    var p = Pseudo.create(text);
    assert.equal(p.evl(), 1);
});


QUnit.module("Control");

QUnit.test("If statement", function (assert) {
    var text = ml(
        'a = 1',
        'b=2',
        'if a == 1:',
        '    b = 3',
        'if a == 2:',
        '    b = 4',
        '',
        'b'
    );
    var p = Pseudo.create(text);
    assert.equal(p.evl(), 3, "Body should be evaluated iff the condition is true");
    assert.equal(p.global('b'), 3);
});

QUnit.test("If statement value", function (assert) {
    var text =
        'a = 1\n' +
        'b = if a == 1:\n' +
        '    42\n' +
        'b\n';
    var p = Pseudo.create(text);
    assert.equal(p.evl(), 42, "If statement should evaluate to its body " +
                "if the condition is true");
});

QUnit.test("If else block", function (assert) {
    var text =
        'a = 1\n' +
        'if a == 2:\n' +
        '    100\n' +
        'else:\n' +
        '    101\n';
    var p = Pseudo.create(text);
    assert.equal(p.evl(), 101, "Else should be evaluated iff the condition is false");
});

QUnit.test("While loop", function (assert) {
    var text = ml(
        'i = 1',
        'result = 1',
        'while i != 7:',
        '    result = result * i',
        '    i = i + 1',
        'result'
    );
    var p = Pseudo.create(text);
    assert.equal(p.evl(), 720, "Factorial computation with while loop");
});
