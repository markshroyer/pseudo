QUnit.test("Simple addition", function (assert) {
    var p = new Pseudo("2 + 3");
    assert.equal(p.evl(), 5, "2 + 3 == 5");
});
