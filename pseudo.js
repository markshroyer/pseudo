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
            if (!tokenp.isPrototypeOf(p)) {
                var props = p;
                p = Object.create(tokenp);
                for (var k in props) {
                    p[k] = props[k];
                }
            }
            p.id = id;
            _p[id] = p;
        };

        var blockp = Object.create(tokenp);
        blockp.nud = function () {
            this.subexprs = [];
            while (!this.pseudo.testMatch('(endblock)')) {
                this.subexprs.push(this.pseudo.expression(2));
                if (this.pseudo.testMatch('(nl)')) {
                    this.pseudo.next();
                }
            }
            this.pseudo.match('(endblock)');
            return this;
        };
        blockp.evl = function () {
            var result = null;
            for (var i = 0; i < this.subexprs.length; ++i) {
                result = this.subexprs[i].evl();
            }
            return result;
        };
        token('(block)', blockp);

        token('(endblock)', { lbp: 1 });
        token('(nl)', { lbp: 2 });

        var constantp = Object.create(tokenp);
        constantp.nud = function () {
            return this;
        };
        constantp.evl = function () {
            return this.value;
        };
        token('(constant)', constantp);

        var constant = function (id, value) {
            var c = Object.create(constantp);
            c.value = value;
            token(id, c);
        };

        token('(name)', {
            nud: function () {
                return this;
            },
            evl: function () {
                return this.pseudo.scope.load(this.id);
            }
        });

        constant('nil', null);

        var literalp = Object.create(tokenp);
        literalp.arity = 'unary';
        literalp.nud = function () {
            return this;
        };
        literalp.evl = function () {
            return this.value;
        };
        token('(literal)', literalp);

        token('(end)', { lbp: 0 });

        token(':', { lbp: 1 });

        token('if', {
            lbp: 1,
            nud: function () {
                this.test = this.pseudo.expression(this.lbp);
                this.pseudo.match(':');
                this.block = this.pseudo.expression(this.lbp);
                return this;
            },
            evl: function () {
                if (this.test.evl() === true) {
                    return this.block.evl();
                } else if (this.test.evl() === false) {
                    return null;
                } else {
                    throw "Expected boolean value in test";
                }
            }
        });

        var infixp = Object.create(tokenp);
        infixp.arity = 'binary';
        infixp.led = function (left) {
            this.first = left;
            this.second = this.pseudo.expression(this.lbp);
            return this;
        };
        var infix = function (id, bp, evl) {
            var t = Object.create(infixp);
            t.lbp = bp;
            t.evl = evl;
            token(id, t);
        };

        var infixrp = Object.create(infixp);
        infixrp.led = function (left) {
            this.first = left;
            this.second = this.pseudo.expression(this.lbp-1);
            return this;
        };
        var infixr = function (id, bp, evl) {
            var t = Object.create(infixrp);
            t.lbp = bp;
            t.evl = evl;
            token(id, t);
        };

        token(')', { lbp: 10 });
        token('(', {
            lbp: 10,
            nud: function () {
                var expr = this.pseudo.expression(this.lbp);
                this.pseudo.match(')');
                return expr;
            }
        });

        infix('+', 1000, function () {
            return this.first.evl() + this.second.evl();
        });
        infix('*', 2000, function () {
            return this.first.evl() * this.second.evl();
        });

        infix('==', 100, function () {
            return this.first.evl() === this.second.evl();
        });

        infixr('=', 10, function () {
            var v = this.second.evl();
            this.pseudo.scope.store(this.first.id, v);
            return v;
        });

        return _p;
    })();

    var makeScope = function (parent) {
        var s = Object.create({
            findScope: function (name) {
                if (name in this.bindings) {
                    return this;
                } else if (this.parent) {
                    return this.parent.findScope(name);
                } else {
                    return null;
                }
            },
            load: function (name) {
                var scope = this.findScope(name);
                if (scope) {
                    return scope.bindings[name];
                } else {
                    return undefined;
                }
            },
            store: function (name, value) {
                var scope = this.findScope(name);
                if (scope) {
                    scope.bindings[name] = value;
                } else {
                    this.bindings[name] = value;
                }
            }
        });
        s.bindings = {};
        s.parent = parent || null;
        return s;
    };

    var Pseudo = function (text, env) {
        var pseudo = this;

        this.text = text;
        this.env = env || {};
        this.scope = makeScope();

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

        var text = '\n' + this.text;
        var dents = [-1];
        var m;

        while (text.length > 0) {
            if (m = text.match(/^\n(\ *)(?=[^\ \t\n])/)) {
                var indent = m[1].length;
                if (indent == dents[dents.length-1]) {
                    this.addToken('(nl)');
                } else if (indent > dents[dents.length-1]) {
                    dents.push(indent);
                    this.addToken('(block)', { indent: indent });
                } else {
                    while (indent < dents[dents.length-1]) {
                        this.addToken('(endblock)', { indent: dents.pop() });
                    }
                    if (indent != dents[dents.length-1]) {
                        throw "Illegal indentation";
                    }
                }
            } else if (m = text.match(/^\n\ */)) {
                // Ignore empty lines
            } else if (m = text.match(/^\ +/)) {
                // Ignore non-indenting whitespace
            } else if (m = text.match(/^(?:([0-9]*\.)?[0-9]+|\.[0-9]+)/)) {
                this.addToken('(literal)', {
                    value: parseFloat(m[0])
                });
            } else if (m = text.match(/^\(/)) {
                this.addToken('(');
            } else if (m = text.match(/^\)/)) {
                this.addToken(')');
            } else if (m = text.match(/^(?:\+|\*|==?|:)/)) {
                this.addToken(m[0]);
            } else if (m = text.match(/^[a-zA-Z][a-zA-Z0-9_]*/)) {
                if (m[0] in tproto) {
                    this.addToken(m[0])
                } else {
                    this.addToken('(name)', { id : m[0] });
                }
            } else {
                throw "Tokenization error: " + text;
            }
            text = text.substring(m[0].length);
        }
        this.addToken('(endblock)', { indent: 0 });
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

    Pseudo.prototype.testMatch = function (t) {
        return tproto[t].isPrototypeOf(this.token);
    };

    Pseudo.prototype.match = function (t) {
        if (tproto[t].isPrototypeOf(this.token)) {
            this.next();
        } else {
            throw "Expected: " + t;
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
+ '\n\n\n'
+ 'a=1\n'
+ 'b = 2\n'
+ 'if a == 1:\n'
+ '  \n'
+ '    b = 3\n'
+ '    \n'
+ 'b\n'
+ '\n'
+ '';

var env = {};

//var p = new Pseudo('2+3*4', env);

var p = new Pseudo(text);
