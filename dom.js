;(function(root, factory) {
    var dom = factory(root);
    if (typeof define === 'function' && define.amd) {
        // AMD
        define('dom', function() {
            return dom;
        });
    } else if (typeof exports === 'object') {
        // Node.js
        module.exports = dom;
    } else {
        // Browser globals
        var _dom = root.dom;

        dom.noConflict = function() {
            if (root.dom === dom) {
                root.dom = _dom;
            }

            return dom;
        };
        root.dom = dom;
    }
}(this, function(root) {
    var doc = root.document;
    var slice = [].slice;
    var toString = {}.toString;
    var hasOwn = {}.hasOwnProperty;
    var regTagFragment = /^\s*<(\w+|!)[^>]*>/;

    //基础函数
    function getType(x) {
        if(x === null){
            return 'null';
        }

        var t= typeof x;

        if(t !== 'object'){
            return t;
        }

        var c = toString.call(x).slice(8, -1).toLowerCase();
        if(c !== 'object'){
            return c;
        }

        if(x.constructor==Object){
            return c;
        }

        return 'unkonw';
    }
    function isArr(arr) {
        return Array.isArray ? Array.isArray(arr) : getType(arr) === 'array';
    }
    function isObj(obj) {
        return getType(obj) === 'object';
    }
    function isFn(fn) {
        return getType(fn) === 'function';
    }
    function isStr(str) {
        return getType(str) === 'string';
    }
    function extend() {
        var target = arguments[0] || {};
        var arrs = Array.prototype.slice.call(arguments, 1);
        var len = arrs.length;
     
        for (var i = 0; i < len; i++) {
            var arr = arrs[i];
            for (var name in arr) {
                target[name] = arr[name];
            }
     
        }
        return target;
    }
    function extendDeep() {
        var target = arguments[0] || {};
        var arrs = slice.call(arguments, 1);
        var len = arrs.length;
        var copyIsArr;
        var clone;

        for (var i = 0; i < len; i++) {
            var arr = arrs[i];
            for (var name in arr) {
                var src = target[name];
                var copy = arr[name];
                
                //避免无限循环
                if (target === copy) {
                    continue;
                }
                
                if (copy && (isObj(copy) || (copyIsArr = isArr(copy)))) {
                    if (copyIsArr) {
                        copyIsArr = false;
                        clone = src && isArr(src) ? src : [];

                    } else {
                        clone = src && isObj(src) ? src : {};
                    }
                    target[ name ] = extendDeep(clone, copy);
                } else if (typeof copy !== 'undefined'){
                    target[name] = copy;
                }
            }

        }

        return target;
    }
    function trim(str) {
        if (getType(str) !== string) {
            return '';
        }

        return isFn(str.trim) ? str.trim() : str.replace(/(^\s*)|(\s*$)/g, '');
    }
    function each(arr, callback, context) {
        for (var i = 0, len = arr.length; i < len; i++) {
            if (callback.call(context, i, arr[i]) === false) {
                return arr;
            }
        }
        return arr;
    }

    function Dom(params, context) {
        return this.init(params, context);
    };

    //扩展属性
    extend(Dom.prototype, {
        'domjs': '0.1.0'
    });

    //扩展基础方法
    extend(Dom.prototype, {
        //解析器
        init: function (params, context) {
            var that = this;
            //"", null, undefined, false ...
            if (!params) {
                this.length = 0;
                return this;
            }

            //html字符串 <div></div>
            if (isStr(params) && regTagFragment.test(params)) {
                var div = doc.createElement('div');
                div.className = 'html-wp';
                var docFrag = doc.createDocumentFragment();
                docFrag.appendChild(div);
                div = docFrag.querySelector('.html-wp');
                div.innerHTML = params;
                var childs = div.children;

                each(childs, function (key, val) {
                    that[key] = val;
                });

                this.length = childs.length;
                return this;
            }

            //单个node节点
            if (typeof params === 'object' && params.nodeName) {
                this.length = 1;
                this[0] = params;
                return this;
            }

            //判断context
            var $ctx = dom(context || doc);

            this.context = $ctx;
            var nodes = [];
            //数组 nodelist htmlcollection
            if (typeof params !== 'string') {
                nodes = params;
            } else {
                this.selector = params;
                //选择符的情况
                $ctx.each(function (key, val) {
                    var eles = val.querySelectorAll(params);
                    each(eles, function (key, val) {
                        nodes.push(val);
                    });
                });
            }

            //复制到this
            each(nodes, function (key, val) {
                that[key] = val;
            });

            this.length = nodes.length;
            return this;
        },
        each: function (callback) {
            return each(this, function (key, val) {
                return callback.call(val, key, val);
            });
        }
    });
    
    //扩展dom方法
    extend(Dom.prototype, {
        html: function (html) {
            if (!isStr(html)) {
                return this[0].innerHTML;
            }

            return this.each(function () {
                this.innerHTML = html;
            });
        },
        text: function (text) {
            if (!isStr(text)) {
                return this[0].textContent;
            }

            return this.each(function () {
                this.textContent = text;
            });
        },
        append: function (params) {
            return this.each(function () {
                var that = this;
                dom(params).each(function(){
                    that.appendChild(this);
                });
            });
        },
        appendTo: function (params) {
            return dom(params).append(this);
        },
        prepend: function (params) {
            return this.each(function () {
                var that = this;
                dom(params).each(function () {
                    if (that.childNodes.length === 0) {
                        that.appendChild(this);
                    } else {
                        that.insertBefore(this, that.firstChild);
                    }
                });
            });
        },
        prependTo: function (params) {
            return dom(params).prepend(this);
        }
    });

    function dom(params, context) {
        return new Dom(params, context);
    }

    extend(dom, {});

    dom.fn = Dom.prototype; 
    return dom;
}));