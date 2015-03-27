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
        var _$ = root.$;
        dom.noConflict = function(deep) {
            if (deep && root.dom === dom) {
                root.dom = _dom;
            }
            if (root.$ === dom) root.$ = _$;
            return dom;
        };
        root.dom = root.$ = dom;
    }
}(this, function(root) {
    var doc = root.document;
    var emptyArray = [];
    var indexOf = emptyArray.indexOf;
    var concat = emptyArray.concat;
    var slice = emptyArray.slice;
    var forEach = emptyArray.forEach;
    var map = emptyArray.map;
    var filter = emptyArray.filter;
    var some = emptyArray.some;
    var every = emptyArray.every;
    var reverse = emptyArray.reverse;
    var emptyObject = {};
    var toString = emptyObject.toString;
    var hasOwn = emptyObject.hasOwnProperty;
    var regTagFragment = /^\s*<(\w+|!)[^>]*>/;
    var elementDisplay = {};
    var randomone = Math.random().toString().slice(2);
    var handlers = {};

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
    function isWindow(win) {
        return win && win == win.window;
    }
    function isDocument(doc) {
        return doc && doc.nodeType == doc.DOCUMENT_NODE;
    }
    function isPlainObject(obj) {
      return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) === Object.prototype
    }
    function isNode(node) {
        return typeof node === 'object' && node.nodeName && node.nodeType;
    }
    function isElement(ele) {
        return isNode(ele) && ele.nodeType === 1;
    }
    function likeArray(arr) { 
        return getType(arr.length) === 'number';
    }
    function toArray(arr) {
        return slice.call(arr, 0);
    }
    function extend() {
        var target = arguments[0] || {};
        var arrs = slice.call(arguments, 1);
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

    function siblings(ele, pos) {
        var res = [];
        var childs = ele.parentNode.children; 
        var index = indexOf.call(childs, ele);
        return filter.call(childs, function (val, key) {
            if (pos > 0) return key > index;
            if (pos < 0) return key < index;
            return key !== index;
        });
    }
    function camelize(str){ 
        return str.replace(/-+(.)?/g, function(match, chr){ 
            return chr ? chr.toUpperCase() : '';
        }); 
    }

    function gid() {
        return gid.gid = gid.gid ? gid.gid + 1 : 1;
    }

    function eid(ele) {
        return ele['eid' + randomone] || (ele['eid' + randomone] = gid());
    }

    function defaultDisplay(nodeName) {
        var element, display;
        if (!elementDisplay[nodeName]) {
            element = document.createElement(nodeName);
            document.body.appendChild(element);
            display = root.getComputedStyle(element).getPropertyValue("display");
            element.parentNode.removeChild(element);
            display === "none" && (display = "block");
            elementDisplay[nodeName] = display;
        }
        return elementDisplay[nodeName];
    }
    function contains(pNode, cNode) {
        if (document.documentElement.contains) {
            return pNode !== cNode && pNode.contains(cNode);
        }

        while (cNode && (cNode = cNode.parentNode)) {           
            if (cNode === pNode) return true;
        }
        return false;
    }

    function add(ele, events, callback, data, selector) {
        var self=this;
        var id=eid(ele);
        var set=(handlers[id] || (handlers[id] = []));
        events.split(/\s/).forEach(function(event){
            var handler = {
                callback: callback,
                selector: selector, 
                i: set.length,
                e: event
            };
            var proxyfn = handler.proxy = function (e) {
                //处理事件代理
                if (selector) {
                    var $temp = dom(ele).find(selector);
                    var res = some.call($temp, function(val) {
                        return val === e.target || contains(val, e.target);
                    });
                    //不包含
                    if (!res) {
                        return false;
                    }
                }
                e.data = data;
                var result = callback.apply(ele, e._data === undefined ? [e] : [e].concat(e._data));
                if (result === false) e.preventDefault(), e.stopPropagation();
                return result;
            };
            set.push(handler);
            ele.addEventListener && ele.addEventListener(handler.e, proxyfn, false);
        });
    }

    function remove(ele, events, callback, selector){
        events.split(/\s/).forEach(function(event){
            findHandlers(ele, event, callback, selector).forEach(function(handler){
                delete handlers[eid(ele)][handler.i];
                if (ele.removeEventListener) ele.removeEventListener(handler.e, handler.proxy, false);
            });
        });
    }

    function findHandlers(ele, event, callback, selector){
        var self=this;
        var id = eid(ele);
        return (handlers[id] || []).filter(function(handler) {
            return handler
            && (handler.e == event) 
            && (!callback || handler.callback.toString() === callback.toString())
            && (!selector || handler.selector == selector);
        });
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
                that.length = 0;
                return that;
            }

            //dom对象
            if (params.domjs === '0.1.0') {
                return params;
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

                that.length = childs.length;
                return that;
            }

            //单个node节点
            if (isNode(params)) {
                that.length = 1;
                that[0] = params;
                return that;
            }

            //判断context
            var $ctx = dom(context || doc);

            var nodes = [];
            //数组 nodelist htmlcollection
            if (typeof params !== 'string') {
                nodes = params;
            } else {
                that.selector = params;
                //选择符的情况
                $ctx.each(function (val, key) {
                    var eles = val.querySelectorAll(params);
                    each(eles, function (val, key) {
                        nodes.push(val);
                    });
                });
            }
            var len = nodes.length || 0;
            //复制到this
            each(nodes, function (val, key) {
                if (isNode(val)) {
                    that[key] = val;
                } else {
                    len--;
                }
            });

            that.length = len;
            return that;
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
        },
        concat: function () {
            return dom(concat.apply(toArray(this), arguments));
        },
        reverse: function () {
            return dom(toArray(this).reverse());
        }
    });
    
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
        contents: function () {
            var res = [];
            this.each(function() { 
                res = res.concat(this.contentDocument || slice.call(this.childNodes));
            });
            return dom(res);
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
            return this.each(function (val) {
                var flag = !!val.nextSibling;
                dom(params).each(function () {
                    if (flag) {
                        val.parentNode.insertBefore(this, val.nextSibling);
                    } else {
                        val.parentNode.appendChild(this);
                    }
                });
            });
        },
        before: function (params) {
            return this.each(function (val) {
                dom(params).each(function () {
                    val.parentNode.insertBefore(this, val);
                });
            });
        },
        insertAfter: function (params) {
            return dom(params).after(this);
        },
        insertBefore: function (params) {
            return dom(params).before(this);
        },
        remove: function () {
            return this.each(function (val) {
                val.parentNode && val.parentNode.removeChild(val);
            });
        },
        empty: function () {
            return this.each(function (val) {val.innerHTML = '';});
        },
        clone: function (deep) {
            return this.map(function (val) {return val.cloneNode(deep)});
        },
        wrap: function (params) {
            var $wrap = dom(params).eq(0);
            return this.each(function(val) {
                dom(val).wrapAll($wrap.clone(true));
            });
        },
        unwrap: function () {
            this.parent().each(function(){
                dom(this).replaceWith(dom(this).children());
            });
            return this;
        },
        wrapAll: function (params) {
            if (this[0]) {
              dom(this[0]).before(params = dom(params));
              var children;
              while ((children = params.children()).length) params = children.first();
              dom(params).append(this);
            }
            return this;
        },
        wrapInner: function (params) {
            return this.each(function (val) {
                var $val = dom(val);
                var $contents = $val.contents();
                $contents.length ? $contents.wrapAll(params): $val.append(params);
            });
        },
        pluck: function (prop) {
            return this.map(function(val){ return val[prop]});
        },
        replaceWith: function (params) {
            return this.before(params).remove();
        },
        replaceAll: function (params) {
            return dom(params).replaceWith(this);
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
            return isString(selector) ? dom(filter.call(this, function(ele){
                return matches(ele, selector);
            })) : this;
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
        parents: function (selector) {
            function fix(arr) {
                return filter.call(arr, function (val) {return !!val});
            }
            var ancestors = [], nodes = this;
            while (nodes.length > 0) {
                ancestors = ancestors.concat(fix(nodes.parent()));
                nodes = dom(fix(nodes.parent()));
            }
              
            return dom(unique(ancestors)).filter(selector);
        },
        closest: function (selector) {
            return this.parents(selector).eq(0);
        },
        prev: function (selector) {
            return dom(this.pluck('previousElementSibling')).filter(selector);
        },
        prevAll: function (selector) {
            var res = [];   
            this.each(function (val) {
                res = res.concat(siblings(val, -1));
            });
            return dom(unique(res)).filter(selector);
        },
        next: function (selector) {
            return dom(this.pluck('nextElementSibling')).filter(selector);
        },
        nextAll: function (selector) {
            var res = [];   
            this.each(function (val) {
                res = res.concat(siblings(val, 1));
            });
            return dom(unique(res)).filter(selector);
        },
        siblings: function (selector) {
            var res = [];   
            this.each(function (val) {
                res = res.concat(siblings(val, 0));
            });
            return dom(unique(res)).filter(selector);
        },
        add: function (selector, context) {
            return dom(unique(this.concat(dom(selector, context))));
        }
    });

    //扩展css方法
    extend(Dom.prototype, {
        css: function (prop, val) {
            if (isString(prop) && !isString(val)) {
                var ele = this[0];
                return ele.style[camelize(prop)] || root.getComputedStyle(ele).getPropertyValue(prop);
            }

            var temp = {};
            if (isString(prop)) {               
                temp[prop] = val;
            } else {
                temp = isObject(prop) ? prop : {};
            }

            return this.each(function (val) {
                each(temp, function (v, k) {
                    val.style[k] = v;
                });
            });
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
            return this.each(function (val) {
                this.style.display === "none" && (this.style.display = '');
                if (root.getComputedStyle(this).getPropertyValue("display") === "none"){                    
                    this.style.display = defaultDisplay(this.nodeName);
                }
            });
        },
        hide: function () {
            return this.css('display', 'none');
        },
        toggle: function () {
            return this.each(function (val) {
                var $val = dom(val);
                $val.css('display') === 'none' ? $val.show() : $val.hide();
            });
        }
    });

    //扩展几何方法
    extend(Dom.prototype, {
        width: function (width) {
            if (!isNumber(width) && !isString(width)) {
                return parseInt(this.css('width'), 10);
            }
            return this.css('width', parseInt(width, 10) + 'px');
        },
        height: function (height) {
            if (!isNumber(height) && !isString(height)) {
                return parseInt(this.css('height'), 10);
            }
            return this.css('height', parseInt(height, 10) + 'px');
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
        data: function (key, val) {
            return this.attr('data-'+key, val);
        }
    });

    //扩展事件方法
    extend(Dom.prototype, {
        ready: function () {

        },
        on: function (event, selector, data, callback) {
            //eventmap
            if (isObject(event)) {
                each(event, function (callback, event) {
                    this.on(event, selector, data, callback);
                });
                return this;
            }

            //event, callback
            if (isFunction(selector)) {
                callback = selector;
                selector = '';
                data = undefined;
            }
            //event, selector, callback
            if (isFunction(data)) {
                callback = data;
                data = undefined;
            }

            //error
            if (!isString(event) || !isFunction(callback)) return this;

            return this.each(function(){ 
                add(this, event, callback, data, selector);
            });
        },
        off: function (event, selector, callback) {
            //eventmap
            if (isObject(event)) {
                each(event, function (callback, event) {
                    this.off(event, selector, callback);
                });
                return this;
            }

            //event, callback
            if (isFunction(selector)) {
                callback = selector;
                selector = undefined;
            }

            if(!isString(event)) return this;

            return this.each(function(){
                remove(this, event, callback, selector);
            });
        },
        trigger: function (event, data) {
            if (!isString(event)) return this;
            var type = event;
            var specialEvents={};
            specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

            event = document.createEvent(specialEvents[type] || 'Events');
            event.initEvent(type, true, true);
            event._data = data;
            return this.each(function(){
                if('dispatchEvent' in this) this.dispatchEvent(event);
            });
        }
    });

    function dom(params, context) {
        return new Dom(params, context);
    }

    //扩展dom属性
    extend(dom, {
        version: '0.1.0'
    });
    //扩展dom方法
    extend(dom, {
        isWindow: isWindow,
        isDocument: isDocument,
        isNode: isNode,
        isElement: isElement,
        contains: contains
    });

    dom.fn = Dom.prototype;
    var $empty = dom();
    return dom;
}));