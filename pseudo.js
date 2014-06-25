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

        var token = function (id, p) {
            p = p || Object.create(tokenp);
            p.id = id;
            _p[id] = p;
        };

        token('(indent)');
        token('(dedent)');
        token('(nl)');

        var literalp = Object.create(tokenp);
        literalp.arity = 'unary';
        literalp.nud = function () {
            return this;
        };
        literalp.evl = function () {
            return this.value;
        };
        token('(literal)', literalp);

        var endp = Object.create(tokenp);
        endp.lbp = 0;
        token('(end)', endp);

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
        rparenp.lbp = 0;
        token(')', rparenp);

        var lparenp = Object.create(tokenp);
        lparenp.lbp = 0;
        lparenp.nud = function () {
            var expr = this.pseudo.expression(0);
            this.pseudo.match(')');
            return expr;
        };
        token('(', lparenp);

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

    Pseudo.prototype.addToken = function (id, props) {
        var t = Object.create(tproto[id]);
        t.pseudo = this;
        for (var p in props) {
            t[p] = props[p];
        }
        this.tokens.push(t);
    };

    Pseudo.prototype.tokenize = function () {
        if (this.tokens) {
            return;
        }

        this.tokens = [];

        var text = this.text;
        var dents = [0];
        var m;

        while (text.length > 0) {
            if (m = text.match(/^\n(\ *)/)) {
                var indent = m[1].length;

                if (indent == dents[dents.length-1]) {
                    this.addToken('(nl)');
                } else if (indent > dents[dents.length-1]) {
                    dents.push(indent);
                    this.addToken('(indent)', {
                        indent: indent
                    });
                } else {
                    while (indent < dents[dents.length-1]) {
                        this.addToken('(dedent)', {
                            indent: dents.pop()
                        });
                    }
                    if (indent != dents[dents.length-1]) {
                        throw "Illegal indentation";
                    }
                }
            } else if (m = text.match(/^\ +/)) {
                // Ignore non-indenting whitespace
            } else if (m = text.match(/^([0-9]*\.)?[0-9]+|\.[0-9]+/)) {
                this.addToken('(literal)', {
                    value: parseFloat(m[0])
                });
            } else if (m = text.match(/^\(/)) {
                this.addToken('(');
            } else if (m = text.match(/^\)/)) {
                this.addToken(')');
            } else if (m = text.match(/^\+|\*/)) {
                this.addToken(m[0]);
            } else {
                throw "Tokenization error: " + text;
            }
            text = text.substring(m[0].length);
        }
        this.addToken('(end)');
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
        if (this.tree) {
            return;
        }

        this.tokenize();
        this.tree = {};

        this.next();
        this.tree = this.expression(0);
        this.match('(end)');
    };

    Pseudo.prototype.evl = function () {
        this.parse();
        return this.tree.evl();
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
