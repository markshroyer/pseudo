function ml() {
    var result = "";
    for (var i = 0; i < arguments.length; i++) {
        result += arguments[i];
        if (i < arguments.length - 1) {
            result += "\n";
        }
    }
    return result;
};

var text = ml(
  'def factorial(n):',
  '    if n == 0:',
  '        1',
  '    else:',
  '        p = factorial(n-1)',
  '        n * p',
  '',
  'factorial(6)'
);

var env = {};
var p = Pseudo.create(text);
