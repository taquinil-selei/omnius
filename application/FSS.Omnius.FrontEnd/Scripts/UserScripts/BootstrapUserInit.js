﻿var BootstrapUserInit = {

    context: null,

    init: function (bootstrapContext) {
        var self = BootstrapUserInit;
        self.context = bootstrapContext;

        $(self.context)
            .on('keyup change', '.data-table > tfoot input', self.DataTable.filter)
            .on('click', '.data-table i.fa[data-action]', self.DataTable.onAction)
            .on('search.dt', '.data-table', self.DataTable.onSearch)
            .on('select.dt deselect.dt', '.data-table', self.DataTable.onSearch);

        self.DataTable.init();
        self.loadValidators();

        $(".closeAlertIcon").on("click", function () {
            //$("#upperPanel, #lowerPanel, #minimizedUpperPanel, #userContentArea").css({ top: "-=" + newNotification.outerHeight() + "px" });
            $(this).parents(".app-alert").remove();
            if (CurrentModuleIs("tapestryModule")) {
                RecalculateToolboxHeight();
            } else if (CurrentModuleIs("mozaicEditorModule")) {
                RecalculateMozaicToolboxHeight();
            }
        });
    },

    confirm: function (message, callbackTrue, callbackFalse, context) {
        var modal = $('<div class="modal fade" id="modalConfirm" tabindex="-1" role="dialog"></div>');
        var modalDialog = $('<div class="modal-dialog" role="document"></div>');
        var modalContent = $('<div class="modal-content"></div>');
        var modalHeader = $('<div class="modal-header"></div>');
        var modalClose = $('<button type="button" class="close" data-dismiss="modal" aria-label="Close" title="Close"><span aria-hidden="true">&times;</span></button>');
        var modalTitle = $('<h4 class="modal-title">Are you sure?</h4>');
        var modalBody = $('<div class="modal-body">' + message + '</div>');
        var modalFooter = $('<div class="modal-footer"></div>');
        var buttonYes = $('<button type="button" class="btn btn-danger">Yes</button>');
        var buttonNo = $('<button type="button" class="btn btn-default">No</button>');

        modal.append(modalDialog);
        modalDialog.append(modalContent);
        modalContent.append(modalHeader).append(modalBody).append(modalFooter);
        modalHeader.append(modalClose).append(modalTitle);
        modalFooter.append(buttonNo).append(buttonYes);

        buttonYes.click(function () {
            callbackTrue.apply(context, []);
            $('#modalConfirm').modal('hide');
        });
        buttonNo.click(function () {
            if (typeof callbackFalse == 'function') {
                callbackFalse.apply(context, []);
            }
            $('#modalConfirm').modal('hide');
        });

        modal.appendTo('body');
        $('#modalConfirm').modal();
        $('#modalConfirm').on('hidden.bs.modal', function () {
            $('#modalConfirm').remove();
        });
    },

    /******************************************************/
    /* DATA TABLES                                        */
    /******************************************************/
    DataTable:
    {
        init: function () {
            var self = BootstrapUserInit;

            $('.data-table', self.context).each(function () {
                var table = $(this);
                self.DataTable.initTable(table);
            });
        },
        initTable: function(table) {

                //Select extension init
                if (table.data('dtselect') == '1') {
                    table.find("thead tr").prepend("<th class='select-head'><input type='checkbox' id='selAll'></th>");
                    table.find("tfoot tr").prepend("<th>Select All</th>");
                    table.find("tbody tr").prepend("<td></td>");
                    $("th.select-head > input[type='checkbox']").on("change", function () {
                        var cb_checked = $("th.select-head > input[type='checkbox']").prop("checked");
                        if (cb_checked)
                            $(this).parents(".data-table").DataTable().rows().select();
                        else
                            $(this).parents(".data-table").DataTable().rows().deselect();
                    });

                }

                //Select extension init
                if (table.data('dtselect') == '1') {
                    table.find("thead tr").prepend("<th class='select-head'><input type='checkbox' id='selAll'></th>");
                    table.find("tfoot tr").prepend("<th>Select All</th>");
                    table.find("tbody tr").prepend("<td></td>");
                    $("th.select-head > input[type='checkbox']").on("change", function () {
                        var cb_checked = $("th.select-head > input[type='checkbox']").prop("checked");
                        if (cb_checked)
                            $(this).parents(".data-table").DataTable().rows().select();
                        else
                            $(this).parents(".data-table").DataTable().rows().deselect();
                    });

                }

                table.DataTable({
                    columnDefs: table.data('dtselect') ? [{
                        orderable: false,
                        className: 'select-checkbox',
                        targets: 'select-head'
                    }] : '0',
                    select: table.data('dtselect') ? {
                        style: 'multi',
                        selector: 'td:first-child'
                    } : false,
                    //order: [[ 1, 'asc' ]],
                    paging: table.data('dtpaging') == '1',
                    pageLength: 50,
                    lengthMenu: [[10, 20, 50, 100, 200, 500, 1000, -1], [10, 20, 50, 100, 200, 500, 1000, 'Vše']],
                    info: table.data('dtinfo') == '1',
                    filter: table.data('dtfilter') == '1' || table.data('dtcolumnfilter') == '1',
                    ordering: table.data('dtordering') == '1',
                    order: table.data('dtorder') ? eval(table.data('dtorder')) : [[0, 'desc']],
                    language: {
                        sEmptyTable: 'Table contains no data',
                        sInfo: 'Showing _START_ to _END_ of total _TOTAL_ entries',
                        sInfoEmpty: 'Showing 0 to 0 of total 0 entries',
                        sInfoFiltered: '(filtered of total _MAX_ entries)',
                        sInfoPostFix: '',
                        sInfoThousands: '',
                        sLengthMenu: 'Show _MENU_ entries',
                        sLoadingRecords: 'Loading...',
                        sProcessing: 'In progress...',
                        sSearch: 'Search:',
                        sZeroRecords: 'No entries was found',
                        oPaginate: {
                            sFirst: 'First',
                            sLast: 'Last',
                            sNext: 'Next',
                            sPrevious: 'Previous'
                        },
                        oAria: {
                            sSortAscending: ': activate to sort column ascending',
                            sSortDescending: ': activate to sort column descending'
                        }
                    },
                    drawCallback: function () {
                        var t = $(this);
                        t.find("thead th").each(function (i) {
                            if (/^(id|hiddenId|hidden__)/.test($(this).text())) {
                                t.find("td:nth-child(" + (i + 1) + "), th:nth-child(" + (i + 1) + ")").hide();
                            }
                        });
                    }
                });

                if (table.data('dtcolumnfilter') == '1') {
                    if (table.data('dtfilter') != '1') {
                        table.parent().find('.dataTables_filter').remove();
                    }

                    table.find('tfoot th').each(function () {
                        var title = $(this).text();
                        if (title == "Action" || title == "Select All")
                            $(this).html("");
                        else
                            $(this).html('<input type="text" placeholder="Hledat v &quot;' + title + '&quot;" />');
                    });
                }
                else {
                    table.find('> tfoot').remove();
                }

                table.css("background-image", "initial");
                table.children("thead").css("visibility", "visible");
                table.children("tbody").css("visibility", "visible");
                table.children("tfoot").css("visibility", "visible");
        },

        filter: function () {
            var field = $(this);
            var dataTable = field.parents('.data-table').DataTable();
            var colIndex = field.parent().prevAll().length;

            dataTable.column(colIndex).search(this.value).draw();
        },

        onSearch: function () {
            var visibleRowList = "";
            var i = $(this).data('dtselect') == '1' ? 1 : 0;
            var dataTable = $(this).DataTable();
            dataTable.rows({ search: 'applied', selected: true }).data().each(function (value, index) {
                if (index > 0)
                    visibleRowList += ",";
                visibleRowList += value[i];
            });
            var tableName = $(this).attr("id");
            $('input[name="' + tableName + '"]').val(visibleRowList);
        },

        onAction: function () {
            var button = $(this);
            var confirm = button.data('confirm');

            if (button.attr("title") == "modal")
                return;
            if (confirm && confirm.length) {
                while (match = /(\{col_(\d)\})/.exec(confirm)) {
                    var colIndex = match[2];
                    var text = button.parents('tr').eq(0).find('td').eq(colIndex).text();

                    confirm = confirm.replace(match[1], text);
                }

                BootstrapUserInit.confirm(confirm, BootstrapUserInit.DataTable.doAction, null, this);
            }
            else {
                BootstrapUserInit.DataTable.doAction.apply(this, []);
            }
        },

        doAction: function () {
            var button = $(this);
            var rowId = parseInt(button.parents('tr').find('td:first').text());
            var tableName = button.parents('table').eq(0).attr('id');

            $.ajax({
                url: '/Persona/Account/GetAntiForgeryToken',
                type: 'GET',
                success: function (token) {
                    if (button.hasClass('fa-download')) {
                        window.ignoreUnload = true;
                    }

                    var form = $('<form class="hiddenForm" method="POST" action="' + window.location.href + '"><input type="hidden" name="' + button.data('idparam') + '" value="' + rowId + '" /><input type="hidden" name="button" value="' + tableName + '_' + button.data('action') + '" /></form>');
                    form.append('<input type="hidden" name="__RequestVerificationToken" value="' + token + '" />');
                    form.appendTo('body').submit();
                }
            })
        },

    },

    loadValidators: function () {
        $.extend($.validator.methods, {
            auditNumber: function (value, element, attr) {
                return value.match(/^[0-9]{4} [PA] [0-9]{2,3}$/);
            }
        });
        $.extend($.validator.methods, {
            auditNumberNoWF: function (value, element, attr) {
                return value.match(/^[0-9]{4} [BCEFSZ] [0-9]{2,3}$/);
            }
        });
        $.extend($.validator.methods, {
            auditNumberNonWF: function (value, element, attr) {
                return value.match(/^[0-9]{4} C [0-9]{2,3}$/);
            }
        });
        $.extend($.validator.methods, {
            greaterThan: function (value, element, attr) {
                return this.optional(element) || +value > +attr;
            }
        });
        $.extend($.validator.methods, {
            greaterOrEqual: function (value, element, attr) {
                return this.optional(element) || +value >= +attr;
            }
        });
        $.extend($.validator.methods, {
            optionSelected: function (value, element, attr) {
                return $(element).attr("required") == undefined || +value != +attr;
            }
        });
        jQuery.validator.addClassRules("dropdown-select", {
            optionSelected: -1
        });

        mozaicFormValidator = $(".mozaicBootstrapPage form").validate({
            errorLabelContainer: $("<div>"), //put error messages into a detached element, AKA a trash bin; todo: find a better way to get rid of them
            ignore: "[readonly]",
            unhighlight: function (element) {
                $("button[ignoredonvalidation]").addClass("cancel");
                $(element).removeClass("has-error");

                // Element validator
                $('#' + element.id + '_validator').hide();

                if (this.numberOfInvalids() === 0) $("button:not([ignoredonvalidation])").removeClass("looks-disabled");
            },
            highlight: function (element) {
                $("button[ignoredonvalidation]").addClass("cancel");
                $(element).addClass("has-error");

                // Element validator
                $('#' + element.id + '_validator').show();

                $("button:not([ignoredonvalidation])").addClass("looks-disabled");
            }
        });
        if ($(".mozaicBootstrapPage from").length)
            mozaicFormValidator.form();
    }
};

$(function () {
    var bc = $('.mozaicBootstrapPage');

    if(bc.length)
    {
        BootstrapUserInit.init(bc);

        $(".input-with-datepicker").datetimepicker({
            datepicker: true,
            timepicker: false,
            format: "d.m.Y"
        });
        $(".input-with-timepicker").datetimepicker({
            datepicker: false,
            timepicker: true,
            step: 5,
            format: "H:i:00"
        });
        $(".input-with-datetimepicker").datetimepicker({
            datepicker: true,
            timepicker: true,
            step: 5,
            format: "d.m.Y H:i:00"
        });

        $("input").on('wheel', function(e){ e.preventDefault(e) });
        $("input").off('mousewheel');
    }
});