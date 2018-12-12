"use strict";
cc._RF.push(module, '61de062n4dJ7ZM9/Xdumozn', 'LanguageData');
// LanguageData.js

'use strict';

var Polyglot = require('polyglot.min');

var polyInst = null;
if (!window.i18n) {
    window.i18n = {
        languages: {},
        curLang: ''
    };
}

if (CC_EDITOR) {
    Editor.Profile.load('profile://project/i18n.json', function (err, profile) {
        window.i18n.curLang = profile.data['default_language'];
        if (polyInst) {
            var data = loadLanguageData(window.i18n.curLang) || {};
            initPolyglot(data);
        }
    });
}

function loadLanguageData(language) {
    return window.i18n.languages[language];
}

function initPolyglot(data) {
    if (data) {
        if (polyInst) {
            polyInst.replace(data);
        } else {
            polyInst = new Polyglot({ phrases: data, allowMissing: true });
        }
    }
}

module.exports = {
    /**
     * This method allow you to switch language during runtime, language argument should be the same as your data file name
     * such as when language is 'zh', it will load your 'zh.js' data source.
     * @method init
     * @param language - the language specific data file name, such as 'zh' to load 'zh.js'
     */
    init: function init(language) {
        if (language === window.i18n.curLang) {
            return;
        }
        var data = loadLanguageData(language) || {};
        window.i18n.curLang = language;
        initPolyglot(data);
        this.inst = polyInst;
    },

    /**
     * this method takes a text key as input, and return the localized string
     * Please read https://github.com/airbnb/polyglot.js for details
     * @method t
     * @return {String} localized string
     * @example
     *
     * var myText = i18n.t('MY_TEXT_KEY');
     *
     * // if your data source is defined as
     * // {"hello_name": "Hello, %{name}"}
     * // you can use the following to interpolate the text
     * var greetingText = i18n.t('hello_name', {name: 'nantas'}); // Hello, nantas
     */
    t: function t(key, opt) {
        if (polyInst) {
            return polyInst.t(key, opt);
        }
    },


    inst: polyInst,

    updateSceneRenderers: function updateSceneRenderers() {
        // very costly iterations
        var rootNodes = cc.director.getScene().children;
        // walk all nodes with localize label and update
        var allLocalizedLabels = [];
        for (var i = 0; i < rootNodes.length; ++i) {
            var labels = rootNodes[i].getComponentsInChildren('LocalizedLabel');
            Array.prototype.push.apply(allLocalizedLabels, labels);
        }
        for (var _i = 0; _i < allLocalizedLabels.length; ++_i) {
            var label = allLocalizedLabels[_i];
            if (!label.node.active) continue;
            label.updateLabel();
        }
        // walk all nodes with localize sprite and update
        var allLocalizedSprites = [];
        for (var _i2 = 0; _i2 < rootNodes.length; ++_i2) {
            var sprites = rootNodes[_i2].getComponentsInChildren('LocalizedSprite');
            Array.prototype.push.apply(allLocalizedSprites, sprites);
        }
        for (var _i3 = 0; _i3 < allLocalizedSprites.length; ++_i3) {
            var sprite = allLocalizedSprites[_i3];
            if (!sprite.node.active) continue;
            sprite.updateSprite(window.i18n.curLang);
        }
    }
};

cc._RF.pop();