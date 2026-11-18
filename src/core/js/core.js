
import Auth   from "./core/auth";
import Router from "./core/router";
import Tools  from "./core/tools";

import PageApp   from './pages/app';
import PageLogin from './pages/login';
import PageDisable from './pages/disable';

import UITable       from './core/ui/table.js';
import UIForm        from './core/ui/form.js';
import UIPlaceholder from './core/ui/placeholder.js';
import UIBreadcrumb  from './core/ui/breadcrumb.js';
import UIPanel       from './core/ui/panel.js';


let Core = {

    auth: Auth,
    tools: Tools,
    router: Router,

    app: PageApp,
    login: PageLogin,
    disable: PageDisable,

    ui: {
        Table: UITable,
        Form: UIForm,
        Breadcrumb: UIBreadcrumb,
        Panel: UIPanel,
        placeholder : UIPlaceholder,


        /**
         * Регистрация ui-компонента, доступного модулям
         * @param {string}           name
         * @param {Object|function}  component
         * @return {boolean}
         */
        register: function (name, component) {

            if ( ! Tools.isString(name) ||
                 ! name ||
                 ! component
            ) {
                return false;
            }

            this[name] = component;

            if (window.CoreUI && typeof window.CoreUI === 'object') {
                window.CoreUI[name] = component;
            }

            return true;
        },


        /**
         * @param {string} name
         * @return {*}
         */
        get: function (name) {

            return this.has(name) ? this[name] : null;
        },


        /**
         * @param {string} name
         * @return {boolean}
         */
        has: function (name) {

            return Tools.isString(name) && this.hasOwnProperty(name);
        }
    },


    /**
     * Реестр модулей
     */
    modules: {

        _items: {},


        /**
         * Регистрация модуля
         *
         * Контракт модуля:
         * name     {string}   - имя модуля
         * title    {string}   - название
         * icon     {string}   - иконка
         * sections {Object}   - разделы: name -> фабрика компонента
         * routes   {Array}    - маршруты модуля
         * init     {function} - активация модуля
         * deinit   {function} - снятие подписок и таймеров
         *
         * @param {string} name
         * @param {Object} definition
         * @return {Object|null}
         */
        register: function (name, definition) {

            if ( ! Tools.isString(name) ||
                 ! name ||
                 ! Tools.isObject(definition)
            ) {
                return null;
            }

            this._items[name] = definition;

            return definition;
        },


        /**
         * @param {string} name
         * @return {Object|null}
         */
        get: function (name) {

            return this.has(name) ? this._items[name] : null;
        },


        /**
         * @param {string} name
         * @return {boolean}
         */
        has: function (name) {

            return Tools.isString(name) && this._items.hasOwnProperty(name);
        },


        /**
         * @param {string} name
         */
        unregister: function (name) {

            if (this.has(name)) {
                delete this._items[name];
            }
        },


        /**
         * @return {Object}
         */
        list: function () {

            return this._items;
        }
    },


    /**
     * Реестр страниц
     */
    pages: {

        _items: {},


        /**
         * Регистрация страницы
         * @param {string} name
         * @param {Object} page
         * @return {Object|null}
         */
        register: function (name, page) {

            if ( ! Tools.isString(name) ||
                 ! name ||
                 ! Tools.isObject(page) ||
                 typeof page.getPageContent !== 'function'
            ) {
                return null;
            }

            this._items[name] = page;

            return page;
        },


        /**
         * @param {string} name
         * @return {Object|null}
         */
        get: function (name) {

            return this.has(name) ? this._items[name] : null;
        },


        /**
         * @param {string} name
         * @return {boolean}
         */
        has: function (name) {

            return Tools.isString(name) && this._items.hasOwnProperty(name);
        },


        /**
         * @return {Object}
         */
        list: function () {

            return this._items;
        }
    },

    lang: {},

    install: {
        event: null,
        promise: null,
    },

    options: {
        basePath: 'sys',
    },


    /**
     * Манифест модулей, полученный от системы
     */
    manifest: null,

    config: {
        modules: {},
    },


    _settings: {
        lang: 'en',
    },

    _activePage: null,
    _langSections: {},
    _events: {},


    /**
     * Установка переводов для раздела
     * @param {string} section
     * @param {Object} langs
     */
    setTranslates: function (section, langs) {

        if ( ! Tools.isString(section) ||
             ! Tools.isObject(langs)
        ) {
            return;
        }

        this._langSections[section] = langs;
    },


    /**
     * Переводы раздела
     * @param {string} section
     * @param {string} text
     * @param {Array}  items
     * @return {string}
     */
    translate: function (section, text, items) {

        if ( ! Tools.isString(section) ||
             ! Tools.isString(text)
        ) {
            return '';
        }


        let lang = {};

        if (this._settings.lang &&
            this._langSections.hasOwnProperty(section) &&
            this._langSections[section].hasOwnProperty(this._settings.lang) &&
            Tools.isObject(this._langSections[section][this._settings.lang])
        ) {
            lang = this._langSections[section][this._settings.lang];
        }

        let result = lang.hasOwnProperty(text)
            ? lang[text]
            : text;

        if (items && Array.isArray(items)) {
            result = items.reduce(function (p, c) {
                return p.replace(/%s/, c)
            }, result)
        }

        return result;
    },


    /**
     * Перевод
     * @param  {string} text
     * @param  {Array} items
     * @return {string}
     */
    _: function (text, items) {

        let lang = {};

        if (this._settings.lang &&
            this.lang.hasOwnProperty(this._settings.lang) &&
            Tools.isObject(this.lang[this._settings.lang])
        ) {
            lang = this.lang[this._settings.lang];
        }

        let result = lang.hasOwnProperty(text)
            ? lang[text]
            : text;

        if (items && Array.isArray(items)) {
            result = items.reduce(function (p, c) {
                return p.replace(/%s/, c)
            }, result)
        }

        return result;
    },


    /**
     * Установка настроек
     * @param {object} settings
     */
    setSettings: function(settings) {

        this._settings = $.extend({}, this._settings, settings);
    },


    /**
     * Получение значения настройки
     * @param {string} name
     */
    getSetting: function(name) {

        let value = null;

        if (this._settings.hasOwnProperty(name)) {
            value = this._settings[name];
        }

        return value;
    },


    /**
     * Установка манифеста модулей
     * @param {Array|Object} modules
     */
    setManifest: function (modules) {

        this.manifest      = modules || null;
        this.config.modules = {};

        let items = [];

        if (Array.isArray(modules)) {
            items = modules;
        } else if (Tools.isObject(modules)) {
            items = Object.values(modules);
        }

        for (let i = 0; i < items.length; i++) {
            let module = items[i];

            if (Tools.isObject(module) &&
                Tools.isString(module.name) &&
                module.name
            ) {
                this.config.modules[module.name] = module;
            }
        }
    },


    /**
     * Данные модуля из манифеста
     * @param {string} name
     * @return {Object|null}
     */
    getModuleManifest: function (name) {

        if ( ! Tools.isString(name) ||
             ! this.config.modules.hasOwnProperty(name)
        ) {
            return null;
        }

        return this.config.modules[name];
    },


    /**
     * Показ страницы
     * @param {string} pageName
     */
    viewPage: function (pageName) {

        let page = Core.pages.get(pageName);

        if (page) {
            let pageContent = page.getPageContent();
            $('.main').append('<div class="page page-' + pageName + '">' + pageContent + '</div>');
            page.init();

            this._activePage = pageName

            let $otherPages = $('.main > .page:not(.page-' + pageName + ')');

            if ($otherPages[0]) {
                $otherPages.fadeOut('fast', function () {
                    $otherPages.remove();

                    $('.main > .page-' + pageName).fadeIn('fast');
                });

            } else {
                $('.main > .page-' + pageName).fadeIn('fast');
            }

        } else {
            CoreUI.alert.danger(Core._('Ошибка'), Core._('Страница %s не найдена', [pageName]));
        }
    },


    /**
     * @param {function} callback
     */
    onHashchange: function (callback) {

        if (typeof callback !== 'function') {
            return;
        }

        if ( ! this._events.hasOwnProperty('hashchange')) {
            this._events['hashchange'] = [];
        }

        this._events['hashchange'].push(callback);
    },


    /**
     *
     */
    hashChange: function () {

        if (Core._events.hasOwnProperty('hashchange') && Core._events['hashchange'].length > 0) {
            for (let i = 0; i < Core._events['hashchange'].length; i++) {
                let result = Core._events['hashchange'][i]();

                if (result === false) {
                    Core._events['hashchange'].splice(i, 1);
                }
            }
        }
    },


    /**
     * Загрузка
     * @private
     */
    _onLoad: function () {

        Core.onHashchange(function () {
            if ($('.page.page-login')[0]) {
                Core.login.viewActualContainer();

            } else if ($('.page.page-app')[0]) {
                if (window.screen.width < 600 && $('.page.page-app.drawer-toggle')[0]) {
                    Core.app._drawerToggle();
                }

                Core.app.load(location.hash.substring(1));
            }
        });

        // Событие установки
        Core.install.promise = new Promise(function (resolve, reject) {

            window.addEventListener('beforeinstallprompt', event => {
                event.preventDefault();
                Core.install.event = event;
                resolve(event);
            })
        });


        let accessToken = Core.auth.token.getAccessToken();

        if ( ! accessToken) {
            Core.viewPage('login');

        } else {
            Core.auth.token.refreshToken(function() {
                Core.auth.token.initRefresh();
                Core.viewPage('app');
            }, function () {
                Core.viewPage('login');
            });
        }


        if ("onhashchange" in window) {
            window.onhashchange = Core.hashChange;
        }


        /**
         * Замена alert
         * @param message
         */
        alert = function (message) {
            CoreUI.alert.create({ type: 'warning', message: message });
        }
    }
}


Core.pages.register('app',     PageApp);
Core.pages.register('login',   PageLogin);
Core.pages.register('disable', PageDisable);


document.addEventListener('DOMContentLoaded', Core._onLoad);

export default Core;