// Limited pseudocode interpreter
var Pseudo = (function () {
    "use strict";

    // Builds the dictionary of token prototypes used by the parser.  Scope
    // resolution of name tokens is left for runtime.
    var token_set = (function () {
        var _prototypes = {};

        var token_prototype = {
            nud: function () {
                throw "Undefined";
            },
            led: function () {
                throw "Missing operator";
            }
        };

        var is_token = function (t) {
            return token_prototype.isPrototypeOf(t);
        };

        var literal_prototype = Object.create(token_prototype);
        literal_prototype.arity = 'unary';
        literal_prototype.nud = function (pseudo) {
            return this;
        };
        _prototypes['(literal)'] = literal_prototype;

        var end_prototype = Object.create(token_prototype);
        end_prototype.lbp = 0;
        _prototypes['(end)'] = end_prototype;

        var infix_prototype = Object.create(token_prototype);
        infix_prototype.arity = 'binary';
        infix_prototype.led = function (pseudo, left) {
            this.first = left;
            this.second = pseudo.expression(this.lbp);
            return this;
        };

        var define_infix = function (id, bp, led) {
            var t = Object.create(infix_prototype);
            t.id = id;
            t.lbp = bp;
            if (led) {
                t.led = led;
            }
            _prototypes[id] = t;
            return t;
        };

        define_infix('+', 10);
        define_infix('*', 20);

        return {
            prototypes: _prototypes,
            is_token: is_token
        };
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
                result.push(Object.create(token_set.prototypes['(literal)'], {
                    value: {
                        value: parseFloat(m[0]),
                        writeable: false
                    }
                }));
            } else if (m = text.match(/^:|\+|\-|\*|\/|<=?|>=?|\[|\]|=/)) {
                result.push(Object.create(token_set.prototypes[m[0]]));
            } else {
                console.log("Tokenization error: '" + text + "'");
                return;
            }
            text = text.substring(m[0].length);
        }
        result.push(Object.create(token_set.prototypes['(end)']));
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
