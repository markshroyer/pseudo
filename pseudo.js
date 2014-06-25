// Limited pseudocode interpreter
var Pseudo = (function () {
    "use strict";

    // Builds the dictionary of token prototypes used by the parser.  Scope
    // resolution of name tokens is left for runtime.
    var tproto = (function () {
        var _p = {};

        var tokenp = {
            nud: function () {
                throw "Undefined";
            },
            led: function () {
                throw "Missing operator";
            },
            repr: function () {
                if (this.value) {
                    return this.value;
                } else {
                    return this.id;
                }
            }
        };
        _p['(token)'] = tokenp;

        var literalp = Object.create(tokenp);
        literalp.arity = 'unary';
        literalp.nud = function () {
            return this;
        };
        literalp.evl = function () {
            return this.value;
        };
        _p['(literal)'] = literalp;

        var endp = Object.create(tokenp);
        endp.id = '(end)';
        endp.lbp = 0;
        _p['(end)'] = endp;

        var infixp = Object.create(tokenp);
        infixp.arity = 'binary';
        infixp.led = function (left) {
            this.first = left;
            this.second = this.pseudo.expression(this.lbp);
            return this;
        };
        var infix = function (id, bp, evl) {
            var t = Object.create(infixp);
            t.id = id;
            t.lbp = bp;
            t.evl = evl;
            _p[id] = t;
            return t;
        };

        var rparenp = Object.create(tokenp);
        rparenp.id = ')';
        rparenp.lbp = 0;
        _p[')'] = rparenp;

        var lparenp = Object.create(tokenp);
        lparenp.id = '(';
        lparenp.lbp = 0;
        lparenp.nud = function () {
            var expr = this.pseudo.expression(0);
            this.pseudo.match(')');
            return expr;
        };
        _p['('] = lparenp;

        infix('+', 100, function () {
            return this.first.evl() + this.second.evl();
        });
        infix('*', 200, function () {
            return this.first.evl() * this.second.evl();
        });

        return _p;
    })();

    var Pseudo = function (text, env) {
        var pseudo = this;

        this.text = text;
        this.env = env || {};

        // For debugging purposes
        this.tproto = tproto;
    };

    Pseudo.prototype.tokenize = function () {
        var text = this.text;
        var result = new Array();
        var m;

        while (text.length > 0) {
            // if (m = text.match(/^\n(\ *)/)) {
            //     //result.push(new Token('indent', m[1]));
            // } else if (m = text.match(/^\ +/)) {
            //     // Ignore non-indent whitespace
            // } else if (m = text.match(/^[a-zA-Z][a-zA-Z0-9_]*/)) {
            //     //result.push(new Token('name', m[0]));

            if (m = text.match(/^([0-9]*\.)?[0-9]+/)) {
                result.push(Object.create(tproto['(literal)'], {
                    value: {
                        value: parseFloat(m[0]),
                        writeable: false
                    },
                    pseudo: {
                        value: this,
                        writeable: false
                    }
                }));
            } else if (m = text.match(/^\(/)) {
                result.push(Object.create(tproto['('], {
                    pseudo: {
                        value: this,
                        writeable: false
                    }
                }));
            } else if (m = text.match(/^\)/)) {
                result.push(Object.create(tproto[')'], {
                    pseudo: {
                        value: this,
                        writeable: false
                    }
                }));
            } else if (m = text.match(/^\+|\*/)) {
                result.push(Object.create(tproto[m[0]], {
                    pseudo: {
                        value: this,
                        writeable: false
                    }
                }));
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
    };

    Pseudo.prototype.match = function (t) {
        if (!tproto[t].isPrototypeOf(this.token)) {
            throw "Expected: " + t;
        } else {
            this.next();
        }
    };

    Pseudo.prototype.parse = function () {
        this.tokens = this.tokenize();
        this.next();
        var parse = this.expression(0);
        this.match('(end)');
        return parse;
    };

    Pseudo.prototype.evl = function () {
        return this.parse().evl();
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
