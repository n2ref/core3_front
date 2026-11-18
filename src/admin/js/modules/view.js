import Admin from "../admin";


let ModulesView = {

    _baseUrl: '/admin/modules',


    /**
     * Панель управления репозиториями модулей
     * @return {LayoutInstance}
     */
    getPanelRepo() {

        return CoreUI.layout.create({
            justify: "around",
            direction: "column",
            gap: 15,
            items: [
                {
                    id: 'repo-form',
                },
                {
                    id: 'repo-upgrade',
                    fill: true,
                }
            ]
        });
    },


    /**
     * Разметка вкладки доступных модулей
     * @return {LayoutInstance}
     */
    getLayoutAvailable() {

        return CoreUI.layout.create({
            justify: "start",
            direction: "row",
            gap: 15,
            wrap: false,
            items: [
                {
                    id: 'available-preview',
                    fill: true,
                }
            ]
        });
    },


    /**
     * Таблица доступных модулей
     * @param {int} selectModuleId
     * @return {CoreUITable}
     */
    getTableAvailable(selectModuleId) {

        let table = new Core.ui.Table('admin', 'modules');

        table.setOptions({
            class: "table-hover table-striped",
            onClickUrl: "#/admin/modules/available/[id]",
            showHeaders: false,
            recordsRequest: {
                url: `admin/modules/available/records?select_module_id=${selectModuleId ?? ''}`,
                method: "GET"
            }
        });

        table.addHeaderOut()
            .left([
                table.filters.text('text').setAttrPlaceholder(Admin._("Поиск")).setWidth(200).setAutoSearch(true),
                table.controls.filterClear(),
            ]);


        table.addColumns([
            table.columns.html('icon',  '', 50).setSort(false),
            table.columns.html('title', ''),
            table.columns.button('install', '', 100).setAttrHeader({ class: 'text-end' }),
        ]);

        return table;
    },


    /**
     * Панель доступного модуля
     * @param {Object} availableModule
     * @param {string} tabId
     * @return {PanelInstance}
     */
    getPanelAvailable(availableModule, tabId) {

        let subtitles = [[], [], []];

        if (availableModule.count_downloads != null) {
            subtitles[0].push(`<small class="text-secondary pe-2"><i class="bi bi-download"></i> ${availableModule.count_downloads}</small>`);
        }

        subtitles[0].push(`<small class="text-secondary pe-2">v${availableModule.version}</small>`);
        subtitles[0].push(`<small class="text-secondary">${availableModule.vendor}/${availableModule.name}</small>`);

        if (availableModule.home_page) {
            subtitles[1].push(`<a href="${availableModule.home_page}" target="_blank">module homepage</a>`);
        }

        if (availableModule.tags) {
            let tags = availableModule.tags;

            if (typeof tags === 'string') {
                try {
                    tags = JSON.parse(tags);
                } catch (e) {
                    tags = [];
                }
            }

            tags = Array.isArray(tags) ? tags : [];

            let badges = tags.map(function (tag) {
                return Core.tools.isString(tag) && tag
                    ? `<span class="badge text-bg-secondary">${tag}</span>`
                    : null;
            }).filter(function (badge) {
                return badge !== null;
            });

            if (badges.length > 0) {
                subtitles[2].push(badges.join(' '));
            }
        }

        let subtitle = subtitles
            .filter(function (items) {
                return items.length > 0;
            })
            .map(function (items) {
                return items.join(' ');
            })
            .join('<br>');


        let tab   = tabId || 'description';
        let panel = CoreUI.panel.create({
            controls: [
                {
                    type: "button",
                    content: Admin._('Установить'),
                    attr: {
                        class: "btn btn-sm btn-outline-success"
                    }
                }
            ]
        });

        panel.setTitle(availableModule.title, subtitle);
        panel.addTab('description', Admin._('Описание'));
        panel.addTab('versions',    Admin._('Версии')).setCount(availableModule.count_versions ?? 0);
        panel.setTabActive(tab);

        panel.setContent(tab === 'versions'
            ? []
            : (availableModule.description ?? ''));

        return panel;
    },


    /**
     * Таблица установленных модулей
     * @param {Array} modules
     * @return {CoreUITable}
     */
    getTableInstalled(modules) {

        let table = new Core.ui.Table('admin', 'modules', 'modules_installed');

        table.setOptions({
            saveState: true,
            overflow: true,
            onClickUrl: "#/admin/modules/[id]"
        });

        let dropdown = {
            type: 'dropdown',
            content: `<i class="bi bi-plus"></i> ${Admin._('Добавить')}`,
            attr: {
                class: "btn btn-success dropdown-toggle"
            },
            items: [
                {
                    type: 'link',
                    content: `<i class="bi bi-person-fill-gear"></i> ${Admin._('Ручная установка')}`,
                    url: '#/admin/modules/0/hand'
                },
                {
                    type: 'link',
                    content: `<i class="bi bi-file-earmark-zip"></i> ${Admin._('Установка из файла')}`,
                    url: '#/admin/modules/0/file'
                },
                {
                    type: 'link',
                    content: `<i class="bi bi-link-45deg"></i> ${Admin._('Установка по ссылке')}`,
                    url: '#/admin/modules/0/link'
                }
            ]
        };

        table.addHeaderOut()
            .left([
                table.controls.columns(),
                table.controls.divider(30),
                table.filters.text('title').setAttrPlaceholder(Admin._('Название / Описание')).setWidth(250).setAutoSearch(true),
                table.controls.filterClear(),
            ])
            .right([
                dropdown,
            ]);


        table.addFooterOut()
            .left([
                table.controls.total(),
            ]);


        table.addColumns([
            table.columns.switch('is_active',   Admin._('Активность'),   45),
            table.columns.link('title',         Admin._('Название')).setWidthMin(200),
            table.columns.text('description',   Admin._('Описание'),     300).setWidthMin(100),
            table.columns.text('name',          Admin._('Идентификатор')).setWidth(200).setShow(false),
            table.columns.text('version',       Admin._('Версия'),       100).setNoWrap(true).setWidthMin(100),
            table.columns.badge('is_visible',   Admin._('Отображаемый'), 150),
            table.columns.menu('actions',       Admin._('Действия'),     1).setShowLabel(false).setAttrHeader({ class: 'text-end' }),
        ]);


        if (Array.isArray(modules)) {
            table.setRecords(modules);

            table.getRecords().map(function (record) {

                let icon = record.icon
                    ? `<i class="${record.icon}"></i> `
                    : '';

                record.title = {
                    url:     `#/admin/modules/${record.id}`,
                    content: icon + record.title
                };

                record.is_visible = record.is_visible
                    ? { type: 'none',    text: Admin._('Да') }
                    : { type: 'warning', text: Admin._('Нет') };

                record.actions = {
                    content:  '<i class="bi bi-three-dots-vertical"></i><span class="bg-danger border p-1 position-absolute rounded-circle top-0 translate-middle z-1"></span>',
                    attr: {
                        class:   'btn btn-outline-secondary rounded-1',
                        onclick: 'event.stopPropagation()'
                    },
                    position: 'end',
                    items: [
                        {
                            type:    'button',
                            content: `<i class="bi bi-arrow-down-circle"></i> ${Admin._('Обновить до 1.1.0')}`,
                            attr:    { class: 'text-success' },
                            onClick: '',
                        },
                        {
                            type:    'button',
                            content: `<i class="bi bi-arrow-clockwise"></i> ${Admin._('Проверить обновления')}`,
                            onClick: '',
                        },
                        { type: 'divider' },
                        {
                            type:    'button',
                            content: `<i class="bi bi-trash"></i> ${Admin._('Удалить')}`,
                            attr:    { class: 'text-danger' },
                            onClick: '',
                        },
                    ],
                };
            });
        }

        return table;
    }
};

export default ModulesView;
