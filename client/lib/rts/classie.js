define(function() {
    "use strict";

    // class helper functions from bonzo https://github.com/ded/bonzo
    /**
     * @param {String} className
     * @return {Regex}
     */
    function classReg(className) {
        return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
    }

    // classList support for class management
    // altho to be fair, the api sucks because it won't accept multiple classes at once
    let hasClass;
    let addClass;
    let removeClass;

    if ("classList" in document.documentElement) {
        hasClass = function(elem, c) {
            return elem.classList.contains(c);
        };
        addClass = function(elem, c) {
            elem.classList.add(c);
        };
        removeClass = function(elem, c) {
            elem.classList.remove(c);
        };
    } else {
        hasClass = function(elem, c) {
            return classReg(c).test(elem.className);
        };
        addClass = function(elem, c) {
            if (!hasClass(elem, c)) {
                elem.className = elem.className + " " + c;
            }
        };
        removeClass = function(elem, c) {
            elem.className = elem.className.replace(classReg(c), " ");
        };
    }

/**
 * @param {Element} elem
 * @param {String} c
 */
    function toggleClass(elem, c) {
        let fn = hasClass(elem, c) ? removeClass : addClass;
        fn(elem, c);
    }

    let classie = {
        // full names
        hasClass: hasClass,
        addClass: addClass,
        removeClass: removeClass,
        toggleClass: toggleClass,
        // short names
        has: hasClass,
        add: addClass,
        remove: removeClass,
        toggle: toggleClass
    };

    return classie;
});
