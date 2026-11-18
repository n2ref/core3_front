import IndexController    from "./index/controller";
import UsersController    from "./users/controller";
import SettingsController from "./settings/controller";

let Admin = {

    lang: {},

    /**
     * Инициализация
     * @param {HTMLElement} container
     */
    init: function (container) {

        Core.setTranslates('admin', Admin.lang)

        this.route(container);

        Core.app.on('module.admin.url', function () {
            Admin.route(container);
        })
    },


    /**
     * Деинициализация
     */
    deinit: function () {

        if (Core.app && typeof Core.app._eventsClear === 'function') {
            Core.app._eventsClear('module.admin.url');
            Core.app._eventsClear('module.admin.deinit');
        }
    },


    /**
     *
     */
    route: function (container) {

        let router = new Core.router({
            "/index" : [IndexController, 'index'],

            "/users" :               [UsersController, 'index'],
            "/users/0" :             [UsersController, 'userNew'],
            "/users/{id}" :          [UsersController, 'user'],
            "/users/{id}/info" :     [UsersController, 'user', 'info'],
            "/users/{id}/sessions" : [UsersController, 'user', 'sessions'],

            "/roles" : '',
            "/modules" : '',

            "/settings"      : [SettingsController, 'table'],
            "/settings/{id}" : [SettingsController, 'form'],


            "/logs" : "",
        });

        router.setBaseUrl('/admin');
        let routeMethod = router.getRouteMethod(location.hash.substring(1))


        if (routeMethod) {
            routeMethod.prependParam(container)
            routeMethod.run()
        } else {
            $(container).html(CoreUI.info.warning(Admin._('Страница не найдена'), Admin._('Упс...')));
        }
    },


    /**
     * Переводы модуля
     * @param {string} text
     * @param {Array}  items
     * @return {*}
     */
    _: function (text, items) {

        return Core.translate('admin', text, items);
    }
};


export default Admin;