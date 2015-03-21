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
    var emptyArray = [];
    var indexOf = emptyArray.indexOf;
    var slice = emptyArray.slice;
    var forEach = emptyArray.forEach;
    var map = emptyArray.map;
    var filter = emptyArray.filter;
    var some = emptyArray.some;
    var every = emptyArray.every;
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
    function isArray(arr) {
        return Array.isArray ? Array.isArray(arr) : getType(arr) === 'array';
    }
    function isObject(obj) {
        return getType(obj) === 'object';
    }
    function isFunction(fn) {
        return getType(fn) === 'function';
    }
    function isString(str) {
        return getType(str) === 'string';
    }
    function isNumber(num) {
        return getType(num) === 'number';
    }
    function likeArray(arr) {
        return getType(arr.length) === 'number';
    }
    function toArray(arr) {
        return slice.call(arr, 0);
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
                
                if (copy && (isObject(copy) || (copyIsArr = isArray(copy)))) {
                    if (copyIsArr) {
                        copyIsArr = false;
                        clone = src && isArray(src) ? src : [];

                    } else {
                        clone = src && isObject(src) ? src : {};
                    }
                    target[ name ] = extendDeep(clone, copy);
                } else if (typeof copy !== 'undefined'){
                    target[name] = copy;
                }
            }

        }

        return target;
    }

    function each(arr, callback, context) {
        var flag = true;
        var key;
        if (likeArray(arr)) {
            forEach.call(arr, function (val, key, arr) {
                if (flag === false) return 0;
                flag = callback.call(context, val, key, arr);
            }, context);
        } else {
            for (key in arr)
              if (callback.call(context, arr[key], key, arr) === false) break;
        }
        return arr;
    }
    function unique(arr) {
        return filter.call(arr, function (val, key, arr) {
            return indexOf.call(arr, val) === key;
        });
    }

    function matches(ele, selector) {
        if (!selector || !ele || ele.nodeType !== 1) return false;
        var matchesSelector = ele.webkitMatchesSelector || ele.mozMatchesSelector || ele.oMatchesSelector || ele.msMatchesSelector || ele.matchesSelector;
        return matchesSelector && matchesSelector.call(ele, selector);
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
            if (isString(params) && regTagFragment.test(params)) {
                var div = doc.createElement('div');
                div.className = 'html-wp';
                var docFrag = doc.createDocumentFragment();
                docFrag.appendChild(div);
                div = docFrag.querySelector('.html-wp');
                div.innerHTML = params;
                var childs = div.children;

                each(childs, function (val, key) {
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

            var nodes = [];
            //数组 nodelist htmlcollection
            if (typeof params !== 'string') {
                nodes = params;
            } else {
                this.selector = params;
                //选择符的情况
                $ctx.each(function (val, key) {
                    var eles = val.querySelectorAll(params);
                    each(eles, function (val, key) {
                        nodes.push(val);
                    });
                });
            }

            //复制到this
            each(nodes, function (val, key) {
                that[key] = val;
            });

            this.length = nodes.length;
            return this;
        },
    });

    //扩展数组方法
    extend(Dom.prototype, {
        each: function (callback) {
            return each(this, function (val, key, arr) {
                return callback.call(val, val, key, arr);
            });
        },
        map: function (callback) {
            return dom(map.call(this, function (val, key, arr) {
                return callback.call(val, val, key, arr);
            }));
        },    
        slice: function (start, end) {
            return dom(slice.call(this, start, end));
        },
        size: function () {
            return this.length;
        },
        get: function (index) {
            if (!isNumber(index)) {
                return slice.call(this, 0);
            }
            var len = this.size();
            index = (index + len) % len;
            return this[index];
        },
        indexOf: function (val, fromIndex) {
            return indexOf.call(this, val, fromIndex);
        }
    })
    
    //扩展dom方法
    extend(Dom.prototype, {
        html: function (html) {
            if (!isString(html)) {
                return this[0].innerHTML;
            }

            return this.each(function () {
                this.innerHTML = html;
            });
        },
        text: function (text) {
            if (!isString(text)) {
                return this[0].textContent;
            }

            return this.each(function () {
                this.textContent = text;
            });
        },
        val: function (val) {
            if (getType(val) === 'undefined') {
                return this[0] && this[0].value;
            }
            return this.each(function (val) {
                val.value = val;
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
        },
        after: function (params) {
        },
        before: function (params) {
        },
        insertAfter: function (params) {

        },
        insertBefore: function (params) {

        },
        remove: function (params) {

        },
        empty: function () {
            
        },
        clone: function () {

        },
        wrap: function () {

        },
        wrapAll: function () {

        },
        wrapInner: function () {

        },
        unwrap: function () {

        },
        pluck: function (prop) {
            return this.map(function(val){ return val[prop]});
        }
    });
    
    //扩展筛选方法
    extend(Dom.prototype, {
        eq: function (index) {
            return dom(this.get(index));
        },
        first: function () {
            return this.eq(0);
        },
        last: function () {
            return this.eq(-1);
        },
        find: function (selector) {
            return dom(selector, this);
        },
        filter: function(selector) {
            return dom(filter.call(this, function(ele){
                return matches(ele, selector);
            }));
        },
        not: function (selector) {
            return dom(filter.call(this, function(ele){
                return !matches(ele, selector);
            }));
        },
        children: function (selector) {
            var res = [];
            this.each(function (val) {
                each(val.children, function (val) {
                    res.push(val);
                });
            });
            return isString(selector) ? dom(res).filter(selector) : dom(res);
        },
        parent: function (selector) {
            var res = unique(this.pluck('parentNode'));
            return isString(selector) ? dom(res).filter(selector) : dom(res);
        },
        parents: function () {

        },
        closest: function () {

        },
        prev: function () {

        },
        prevAll: function () {

        },
        next: function () {

        },
        nextAll: function () {

        },
        siblings: function () {

        },
        add: function () {

        },
        end: function () {

        }
    });

    //扩展css方法
    extend(Dom.prototype, {
        css: function () {

        },
        hasClass: function (className) {
            return some.call(this, function (val) {
                return !((' ' + val.className + ' ').search(' ' + className + ' ') < 0);
            });
        },
        addClass: function (classToken) {
            return this.each(function (val) {
                val.className += ' ' + classToken;
            });
        },
        removeClass: function (classToken) {
            return this.each(function () {
                classToken.split(' ').forEach(function(val) {
                    this.className = this.className.replace(val, '');
                }, this);
            });
        },
        toggleClass: function (classToken) {
            return this.each(function (val) {
                classToken.split(' ').forEach(function (val) {
                    this.hasClass(val) ? this.removeClass(val) : this.addClass(val);
                }, dom(val));
            });
        }
    });

    //扩展css效果
    extend(Dom.prototype, {
        show: function () {

        },
        hide: function () {

        },
        toggle: function () {

        }
    });

    //扩展几何方法
    extend(Dom.prototype, {
        width: function () {

        },
        height: function () {

        }
    });

    //扩展属性方法
    extend(Dom.prototype, {
        attr: function (key, val) {
            if (!isString(key) && !isObject(key)) return undefined;
            if (isString(key) && getType(val) === 'undefined') {
                return this[0] && isFunction(this[0].getAttribute) ? this[0].getAttribute(key) : undefined;
            }
            var obj = {};
            if (isString(key)) {               
                obj[key] = val;
            } else {
                obj = key;
            }
            return this.each(function (val) {
                isFunction(val.setAttribute) && each(obj, function(val, key){
                    this.setAttribute(key, val);
                }, val);
            });
        },
        removeAttr: function (name) {
            return this.each(function () {
                this.nodeType === 1 && name.split(' ').forEach(function (val) {
                    this.removeAttribute(val);
                }, this);
            });
        },
        data: function () {
            
        }
    });

    //扩展事件方法
    extend(Dom.prototype, {
        ready: function () {

        },
        on: function () {

        },
        off: function () {

        },
        trigger: function () {
            
        }
    });

    //效果
    extend(Dom.prototype, {

    });

    function dom(params, context) {
        return new Dom(params, context);
    }

    extend(dom, {
        version: '0.1.0'
    });

    dom.fn = Dom.prototype;
    var $empty = dom();
    return dom;
}));