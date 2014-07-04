// Limited pseudocode interpreter
var Pseudo = (function () {
    "use strict";

    var lambdap = {
        evl: function (args) {
        }
    };

    var makeLambda = function (bindings, block) {
        var l = Object.create(lambdap);
        l.bindings = bindings;
        l.block = block;
        return l;
    };

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

        token('(block)', {
            evl: function () {
                var result = null;
                for (var i = 0; i < this.subexprs.length; ++i) {
                    result = this.subexprs[i].evl();
                }
                return result;
            }
        });

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
                this.block = this.pseudo.parseBlock();
                if (this.pseudo.testMatch('else')) {
                    this.pseudo.next();
                    this.pseudo.match(':');
                    this.elseblock = this.pseudo.parseBlock();
                }
                return this;
            },
            evl: function () {
                if (this.test.evl() === true) {
                    return this.block.evl();
                } else if (this.test.evl() === false) {
                    if ('elseblock' in this) {
                        return this.elseblock.evl();
                    } else {
                        return null;
                    }
                } else {
                    throw "Expected boolean value in test";
                }
            }
        });

        token('else', { lbp: 1 });

        token('while', {
            lbp: 1,
            nud: function () {
                this.test = this.pseudo.expression(this.lbp);
                this.pseudo.match(':');
                this.block = this.pseudo.parseBlock();
                return this;
            },
            evl: function () {
                var block_eval = null;
                while (this.test.evl() === true) {
                    block_eval = this.block.evl();
                };
                return block_eval;
            }
        });

        token('def', {
            nud: function () {
                // TODO Ensure proto's lambdaexpr and bindings are just
                // names, throw error otherwise
                this.proto = this.pseudo.expression(1);
                this.pseudo.match(':');
                this.block = this.pseudo.parseBlock();
                return this;
            },
            evl: function () {
                var l = makeLambda(this.proto.bindings, this.block);
                this.pseudo.scope.store(this.proto.lambdaexpr.id, l);
                return l;
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
            },
            led: function (left) {
                this.lambdaexpr = left;
                this.bindings = [];
                while (!this.pseudo.testMatch(')')) {
                    this.bindings.push(this.pseudo.expression(this.lbp));
                    if (this.pseudo.testMatch(',')) {
                        this.pseudo.next();
                    }
                }
                this.pseudo.match(')');
                return this;
            },
            evl: function () {
                var l = this.lambdaexpr.evl();
                var b = {};
                if (this.bindings.length != l.bindings.length) {
                    throw "Wrong number of arguments in function call";
                }
                for (var i = 0; i < this.bindings.length; ++i) {
                    b[l.bindings[i].id] = this.bindings[i].evl();
                }
                this.pseudo.pushScope(b);
                var r = l.block.evl();
                this.pseudo.popScope();
                return r;
            }
        });

        token(',', { lbp: 10 });

        infix('+', 1000, function () {
            return this.first.evl() + this.second.evl();
        });
        infix('-', 1000, function () {
            return this.first.evl() - this.second.evl();
        });
        infix('*', 2000, function () {
            return this.first.evl() * this.second.evl();
        });

        infix('==', 100, function () {
            return this.first.evl() === this.second.evl();
        });

        infix('!=', 100, function () {
            return this.first.evl() !== this.second.evl();
        });

        infixr('=', 10, function () {
            var v = this.second.evl();
            this.pseudo.scope.store(this.first.id, v);
            return v;
        });

        return _p;
    })();

    var makeScope = function (parent, bindings) {
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
        s.bindings = bindings || {};
        s.parent = parent || null;
        return s;
    };

    var pseudop = {
        tproto: tproto,

        addToken: function (id, props) {
            var t = Object.create(tproto[id]);
            t.pseudo = this;
            for (var p in props) {
                t[p] = props[p];
            }
            this.tokens.push(t);
        },

        tokenize: function () {
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
                } else if (m = text.match(/^(?:\+|\-|\*|==?|\!=|,|:)/)) {
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
            while (dents.length > 1) {
                this.addToken('(endblock)', { indent: dents.pop() });
            }
            this.addToken('(end)');
        },

        expression: function (rbp) {
            var t = this.token;
            this.next();
            var left = t.nud();

            while (rbp < this.token.lbp) {
                t = this.token;
                this.next();
                left = t.led(left);
            }
            return left;
        },

        next: function () {
            this.token = this.tokens.shift();
        },

        testMatch: function (t) {
            return tproto[t].isPrototypeOf(this.token);
        },

        match: function (t) {
            if (tproto[t].isPrototypeOf(this.token)) {
                this.next();
            } else {
                throw "Expected: " + t;
            }
        },

        parseBlock: function () {
            var block = this.token;
            this.match('(block)');

            block.subexprs = [];
            while (!this.testMatch('(endblock)')) {
                block.subexprs.push(this.expression(2));
                if (this.testMatch('(nl)')) {
                    this.next();
                }
            }
            this.match('(endblock)');
            return block;
        },

        parse: function () {
            if (this.tree) {
                return;
            }

            this.tokenize();
            this.tree = {};

            this.next();
            this.tree = this.parseBlock();
            this.match('(end)');
        },

        evl: function () {
            this.parse();
            return this.tree.evl();
        },

        global: function (name) {
            return this.rootScope.load(name);
        },

        pushScope: function (bindings) {
            this.scope = makeScope(this.scope, bindings);
        },

        popScope: function () {
            if (this.scope != this.rootScope) {
                this.scope = this.scope.parent;
            }
        }
    };

    var pseudo_create = function (text, env) {
        var pseudo = Object.create(pseudop);
        pseudo.text = text;
        pseudo.env = env || {};
        pseudo.scope = makeScope();
        pseudo.rootScope = pseudo.scope;
        return pseudo;
    };

    return { create: pseudo_create };

})();
