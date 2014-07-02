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
    var text =
        'a = 1\n' +
        'b = 2\n' +
        'if a == 1:\n' +
        '    b = 3\n' +
        'if a == 2:\n' +
        '    b = 4\n' +
        '\n' +
        'b\n';
    var p = Pseudo.create(text);
    assert.equal(p.evl(), 3, "Body should be evaluated iff the condition is true");
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
