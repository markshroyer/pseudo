QUnit.module("Arithmetic expressions");

QUnit.test("Simple addition", function (assert) {
    var p = new Pseudo("2 + 3");
    assert.equal(p.evl(), 5, "2 + 3 == 5");
});

QUnit.test("Simple multiplication", function (assert) {
    var p = new Pseudo("2 * 3");
    assert.equal(p.evl(), 6, "2 * 3 == 6");
});

QUnit.test("Addition/multiplication operator precedence", function (assert) {
    var p = new Pseudo("2 + 3 * 4 + 5");
    assert.equal(p.evl(), 19, "2 + 3 * 4 + 5 == 19");
});
