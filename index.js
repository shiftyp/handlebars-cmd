#!/usr/bin/env node

var fs   = require('fs'),
    path = require('path'),
    args = require('optimist').argv,
    hbs  = require('handlebars'),
    params = {};

if (args._.length) {
    try {
        var configFile = args._[0].toString();

        if (configFile.match(/js$/)) {
          params = require(path.join(process.cwd(), configFile));
        } else {
          params = JSON.parse(fs.readFileSync(configFile).toString());
        }
    } catch (e) { }
}
else for (var key in args) {
    try {
        params[key] = JSON.parse(args[key]);
    } catch (e) {
    }
}

function readStream(s, done) {
    var bufs = [];
    s.on('data', function(d) {
        bufs.push(d);
    });
    s.on('end', function() {
        done(null, Buffer.concat(bufs));
    });
    s.resume();
}

readStream(process.stdin, function(err, tmpl) {
    function handle(tmpl, params) {
        hbs.registerHelper('include', function (file, context, opt) {
            var context = null == context ? args : context;
            var f = fs.readFileSync(file);
            return handle(f, context); 
        });
        var template = hbs.compile(tmpl.toString());
        var result = template(params);
        return result;
    }
    process.stdout.write(handle(tmpl, params));
});

