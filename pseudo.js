// Limited pseudocode interpreter
var Pseudo = (function () {
    "use strict";

    // Builds the dictionary of token prototypes used by the parser.  Scope
    // resolution of name tokens is left for runtime.
    var tproto = (function () {
        var _p = {};

        var token_proto = {
            nud: function () {
                throw "Undefined";
            },
            led: function () {
                throw "Missing operator";
            }
        };
        _p['(token)'] = token_proto;

        var literal_proto = Object.create(token_proto);
        literal_proto.arity = 'unary';
        literal_proto.nud = function (pseudo) {
            return this;
        };
        _p['(literal)'] = literal_proto;

        var end_proto = Object.create(token_proto);
        end_proto.lbp = 0;
        _p['(end)'] = end_proto;

        var infix_proto = Object.create(token_proto);
        infix_proto.arity = 'binary';
        infix_proto.led = function (pseudo, left) {
            this.first = left;
            this.second = pseudo.expression(this.lbp);
            return this;
        };

        var infix = function (id, bp, led) {
            var t = Object.create(infix_proto);
            t.id = id;
            t.lbp = bp;
            if (led) {
                t.led = led;
            }
            _p[id] = t;
            return t;
        };

        infix('+', 10);
        infix('*', 20);

        return _p;
    })();

    var Pseudo = function (text, env) {
        var pseudo = this;

        this.text = text;
        this.env = env;
    };

    Pseudo.prototype.tokenize = function () {
        var text = this.text;
        var result = new Array();
        var m;

        while (text.length > 0) {
            if (m = text.match(/^\n(\ *)/)) {
                //result.push(new Token('indent', m[1]));
            } else if (m = text.match(/^\ +/)) {
                // Ignore non-indent whitespace
            } else if (m = text.match(/^[a-zA-Z][a-zA-Z0-9_]*/)) {
                //result.push(new Token('name', m[0]));
            } else if (m = text.match(/^[0-9]+/)) {
                result.push(Object.create(tproto['(literal)'], {
                    value: {
                        value: parseFloat(m[0]),
                        writeable: false
                    }
                }));
            } else if (m = text.match(/^:|\+|\-|\*|\/|<=?|>=?|\[|\]|=/)) {
                result.push(Object.create(tproto[m[0]]));
            } else {
                console.log("Tokenization error: '" + text + "'");
                return;
            }
            text = text.substring(m[0].length);
        }
        result.push(Object.create(tproto['(end)']));
        return result;
    };

    Pseudo.prototype.expression = function (rbp) {
        var t = this.token;
        this.next();
        var left = t.nud(this);

        while (rbp < this.token.lbp) {
            t = this.token;
            this.next();
            left = t.led(this, left);
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
