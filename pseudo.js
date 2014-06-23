// Limited pseudocode interpreter
var Pseudo = (function () {

    var Token = function (type, text) {
        this.type = type;
        this.text = text;
    };

    var NumberToken = function (text) {
        this.type = 'number';
        this.text = text;
        this.value = parseFloat(text);
    };

    NumberToken.prototype.nud = function () {
        return this.value;
    };

    var Pseudo = function (text, env) {
        var pseudo = this;

        this.text = text;
        this.env = env;
        this._ops = {
            '+': {
                lbp: 100,
                led: function (left) {
                    var right = pseudo.expression(100);
                    return left + right;
                }
            },

            '*': {
                lbp: 200,
                led: function (left) {
                    var right = pseudo.expression(200);
                    return left * right;
                }
            }
        };
    };

    Pseudo.prototype.makeToken = function (type, text) {
        switch (type) {
        case 'op':
            return this._ops[text];
        case 'number':
            return new NumberToken(text);
        }
    };

    Pseudo.prototype.tokenize = function () {
        var text = this.text;
        var result = new Array();
        var m;

        while (text.length > 0) {
            if (m = text.match(/^\n(\ *)/)) {
                result.push(new Token('indent', m[1]));
            } else if (m = text.match(/^\ +/)) {
                // Ignore non-indent whitespace
            } else if (m = text.match(/^[a-zA-Z][a-zA-Z0-9_]*/)) {
                result.push(new Token('name', m[0]));
            } else if (m = text.match(/^[0-9]+/)) {
                result.push(this.makeToken('number', m[0]));
            } else if (m = text.match(/^:|\+|\-|\*|\/|<=?|>=?|\[|\]|=/)) {
                result.push(this.makeToken('op', m[0]));
            } else {
                console.log("Tokenization error: '" + text + "'");
                return;
            }

            text = text.substring(m[0].length);
        }

        var endToken = new Token('end', '(end)');
        endToken.lbp = 0;
        result.push(endToken);

        return result;
    };

    Pseudo.prototype.expression = function (rbp) {
        var t = this.token;
        this.next();
        var left = t.nud();
        while (rbp < this.token.lbp) {
            t = this.token;
            this.next();
            left = t.led(left);
        }
        return left;
    };

    Pseudo.prototype.next = function () {
        this.token = this.tokens.shift();
    }

    Pseudo.prototype.parse = function () {
        this.tokens = this.tokenize();
        this.next();
        return this.expression(0);
    };

    return Pseudo;

})();

var text = ''
+ '\n'
+ 'while i < 3:\n'
+ '    data[i] = 0\n'
+ '\n'
+ '';

var env = {};

var p = new Pseudo('2+3*4', env);
