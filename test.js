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


QUnit.module("Syntax");

QUnit.test("Indentation", function (assert) {
    assert.throws(function () {
        Pseudo.create(ml(
            'a = 1',
            'if a == 1:',
            '    b = 2',
            '  b = 3'
        )).evl();
    }, "Invalid indentation");

    assert.throws(function () {
        Pseudo.create(ml(
            'a = 1',
            'b = 2',
            '    c = 3'
        )).evl();
    }, "Invalid indentation (bare block)");
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

QUnit.test("Error handling", function (assert) {
    assert.throws(function () {
        Pseudo.create('if = 5').parse();
    }, "Cannot assign to a keyword");
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

QUnit.test("If/elif/else", function (assert) {
    assert.equal(Pseudo.create(ml(
        'a = b = c = 0',
        'd = 2',
        '',
        'if d == 1:',
        '    a = 1',
        'elif d == 2:',
        '    b = 2',
        'else:',
        '    c = 4',
        '',
        'a + b + c'
    )).evl(), 2, "Support elif statement");

    assert.equal(Pseudo.create(ml(
        'a = b = c = 0',
        'd = 3',
        '',
        'if d == 1:',
        '    a = 1',
        'elif d == 2:',
        '    b = 2',
        'else:',
        '    c = 4',
        '',
        'a + b + c'
    )).evl(), 4, "Support elif statement 2");

    assert.equal(Pseudo.create(ml(
        'a = b = c = 0',
        'd = 3',
        '',
        'if d == 1:',
        '    a = 1',
        'elif d == 2:',
        '    b = 2',
        '',
        'a + b + c'
    )).evl(), 0, "Support elif statement without else block");

    assert.equal(Pseudo.create(ml(
        'r = 0',
        'n = 3',
        '',
        'if n == 1:',
        '    r = r + 1',
        'elif n == 2:',
        '    r = r + 2',
        'elif n == 3:',
        '    r = r + 4',
        'else:',
        '    r = r + 8',
        '',
        'r'
    )).evl(), 4, "Multiple elif blocks");

    assert.equal(Pseudo.create(ml(
        'a = 2',
        'b = 3',
        'if a == 2: b = 4',
        'b'
    )).evl(), 4, "Single-line block");
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


QUnit.module("Functions");

QUnit.test("Function definition and invocation", function (assert) {
    assert.equal(Pseudo.create(ml(
        'def times_two(n):',
        '    n * 2',
        '',
        'times_two(3)'
    )).evl(), 6, "Simple function application");

    assert.equal(Pseudo.create(ml(
        'def sum_of_three(a, b, c):',
        '    a + b + c',
        '',
        'sum_of_three(3, 4, 5)'
    )).evl(), 12, "Function with multiple arguments");

    assert.equal(Pseudo.create(ml(
        'def factorial(n):',
        '    if n == 0:',
        '        1',
        '    else:',
        '        n * factorial(n-1)',
        '',
        'factorial(6)'
    )).evl(), 720, "Recursive factorial");

    assert.equal(Pseudo.create(ml(
        'def my_function(n):',
        '    n * 3',
        '',
        'times_three = my_function',
        'times_three(9)'
    )).evl(), 27, "Function reference assignment");
});
