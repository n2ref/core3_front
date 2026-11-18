
import Admin from "./js/admin";

import IndexController    from "./js/index/controller";
import UsersController    from "./js/users/controller";
import SettingsController from "./js/settings/controller";

import Index   from "./js/index/index";
import Logs    from "./js/logs";
import Modules from "./js/modules";
import Roles   from "./js/roles";
import Users   from "./js/users/users";

import langEn from "./js/lang/en";
import langRu from "./js/lang/ru";


Admin.index   = Index;
Admin.logs    = Logs;
Admin.modules = Modules;
Admin.roles   = Roles;
Admin.users   = Users;

Admin.lang.en = langEn;
Admin.lang.ru = langRu;


/**
 * Описание модуля для ядра
 */
let adminModule = {

    name: 'admin',
    title: 'Админ',
    icon: '',

    sections: {
        index:    IndexController,
        users:    UsersController,
        roles:    Roles,
        modules:  Modules,
        logs:     Logs,
        settings: SettingsController,
    },


    /**
     * @param {Object} ctx
     */
    init: function (ctx) {

        let container = ctx && ctx.container
            ? ctx.container
            : document.getElementsByClassName('mod-container')[0];

        Admin.init(container);
    },


    /**
     *
     */
    deinit: function () {
        Admin.deinit();
    }
};


if (window.Core && window.Core.modules) {
    window.Core.modules.register('admin', adminModule);
}


export default Admin;
