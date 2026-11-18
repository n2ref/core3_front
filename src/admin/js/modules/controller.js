import Admin        from "../admin";
import ModulesView from "./view";


let ModulesController = {

    baseUrl: 'admin/modules',


    /**
     * Модули
     * @param {HTMLElement} container
     */
    index: function (container) {

        let panel = new Core.ui.Panel();

        panel.addTab('installed', Admin._('Установленные'));
        panel.addTab('available', Admin._('Доступные'));
        panel.addTab('repo',      Admin._('Репозитории'));

        $(container).empty().append(panel.render());
        panel.initEvents();

        let tab = Core.tools.getParams().section || 'installed';

        panel.setTabActive(tab);
        this.tab(panel, tab);
    },


    /**
     * Показ содержимого вкладки
     * @param {PanelInstance} panel
     * @param {string}        tabId
     * @param {int}           moduleId
     */
    tab: function (panel, tabId, moduleId) {

        switch (tabId) {
            case 'available': return this.available(panel, moduleId);
            case 'repo':      return this.repo(panel);

            case 'installed':
            default:
                return this.installed(panel);
        }
    },


    /**
     * Установленные модули
     * @param {PanelInstance} panel
     */
    installed: function (panel) {

        panel.setContent(Core.ui.placeholder.table({ content: 'medium' }));

        Core.app.fetchQuiet(`${this.baseUrl}/installed/records`)
            .then(function (modules) {

                let table = ModulesView.getTableInstalled(modules);

                panel.setContent(table);
                table.initEvents();
            });
    },


    /**
     * Доступные модули
     * @param {PanelInstance} panel
     * @param {int}           moduleId
     * @param {string}        tabId
     */
    available: function (panel, moduleId, tabId) {

        let layout = ModulesView.getLayoutAvailable();
        let table  = ModulesView.getTableAvailable(moduleId);

        panel.setContent([table, layout]);

        table.initEvents();
        layout.initEvents();

        if (moduleId) {
            Core.app.fetchQuiet(`${this.baseUrl}/available/${moduleId}`)
                .then(function (availableModule) {

                    layout.setItemContent(
                        'available-preview',
                        ModulesView.getPanelAvailable(availableModule, tabId)
                    );
                });
        }
    },


    /**
     * Репозитории модулей
     * @param {PanelInstance} panel
     */
    repo: function (panel) {

        let layout = ModulesView.getPanelRepo();

        panel.setContent(layout);
        layout.initEvents();

        Core.app.fetchQuiet(`${this.baseUrl}/repo/form`)
            .then(function (form) {
                layout.setItemContent('repo-form', form);
            });
    },


    /**
     * Модуль
     * @param {HTMLElement} container
     * @param {int}         moduleId
     * @param {string}      tabId
     */
    module: function (container, moduleId, tabId) {

        if ( ! moduleId || Number(moduleId) === 0) {
            return this.moduleNew(container, tabId);
        }

        let breadcrumb = new Core.ui.Breadcrumb();
        breadcrumb.addItem(Admin._('Модули'),        '#/admin/modules');
        breadcrumb.addItem(Admin._('Установленные'), '#/admin/modules/installed');
        breadcrumb.addItem(Admin._('Модуль'));

        let panel = new Core.ui.Panel();
        panel.addTab('module',   Admin._('Модуль'));
        panel.addTab('sections', Admin._('Разделы'));
        panel.addTab('versions', Admin._('Версии'));

        let tab = tabId || 'module';

        panel.setTabActive(tab);

        $(container).empty()
            .append(breadcrumb.render())
            .append(panel.render());

        panel.initEvents();

        Core.app.fetchQuiet(`${this.baseUrl}/${moduleId}`)
            .then(function (module) {

                panel.setTitle(module.title, `${module.name} / ${module.version}`);

                switch (tab) {
                    case 'sections': ModulesController.sections(panel, module); break;
                    case 'versions': ModulesController.versions(panel, module); break;

                    case 'module':
                    default:
                        ModulesController.moduleForm(panel, module);
                }
            });
    },


    /**
     * Форма модуля
     * @param {PanelInstance} panel
     * @param {Object}        module
     */
    moduleForm: function (panel, module) {

        panel.setContent(Core.ui.placeholder.form({ content: 'medium' }));

        Core.app.fetchQuiet(`${this.baseUrl}/${module.id}/form`)
            .then(function (form) {
                panel.setContent(form);

                if (typeof form.initEvents === 'function') {
                    form.initEvents();
                }
            });
    },


    /**
     * Разделы модуля
     * @param {PanelInstance} panel
     * @param {Object}        module
     */
    sections: function (panel, module) {

        panel.setContent(Core.ui.placeholder.table({ content: 'medium' }));

        // TODO: форма раздела при наличии section_id + таблица разделов
        Core.app.fetchQuiet(`${this.baseUrl}/${module.id}/sections`)
            .then(function (sections) {
                panel.setContent(sections);
            });
    },


    /**
     * Версии модуля
     * @param {PanelInstance} panel
     * @param {Object}        module
     */
    versions: function (panel, module) {

        panel.setContent(Core.ui.placeholder.table({ content: 'medium' }));

        Core.app.fetchQuiet(`${this.baseUrl}/${module.id}/versions`)
            .then(function (versions) {
                panel.setContent(versions);
            });
    },


    /**
     * Добавление модуля
     * @param {HTMLElement} container
     * @param {string}      tabId
     */
    moduleNew: function (container, tabId) {

        let breadcrumb = new Core.ui.Breadcrumb();
        breadcrumb.addItem(Admin._('Модули'),        '#/admin/modules');
        breadcrumb.addItem(Admin._('Установленные'), '#/admin/modules/installed');
        breadcrumb.addItem(Admin._('Добавление модуля'));

        let panel = new Core.ui.Panel();
        panel.setTitle(Admin._('Добавление модуля'));

        panel.addTab('hand', Admin._('Ручная установка'));
        panel.addTab('file', Admin._('Из файла'));
        panel.addTab('link', Admin._('По ссылке'));

        let tab = tabId || 'hand';

        panel.setTabActive(tab);

        $(container).empty()
            .append(breadcrumb.render())
            .append(panel.render());

        panel.initEvents();

        this.moduleNewForm(panel, tab);
    },


    /**
     * Форма добавления модуля
     * @param {PanelInstance} panel
     * @param {string}        tabId
     */
    moduleNewForm: function (panel, tabId) {

        panel.setContent(Core.ui.placeholder.form({ content: 'medium' }));

        Core.app.fetchQuiet(`${this.baseUrl}/0/${tabId}/form`)
            .then(function (form) {
                panel.setContent(form);

                if (typeof form.initEvents === 'function') {
                    form.initEvents();
                }
            });
    }
};

export default ModulesController;
